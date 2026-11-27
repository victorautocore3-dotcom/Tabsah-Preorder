import { PRODUCT_IMAGES_BUCKET, supabase } from '../config/supabase';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentRecord,
  Product,
  ProductVariant,
} from '../data/storeData';

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  delivery_address?: string | null;
  created_at?: string;
}

export interface DbProductWithActive extends Product {
  active: boolean;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  category: ['category_slug'],
  category_slug: ['category'],
  price: ['price_naira'],
  price_naira: ['price'],
  arrival_date: ['expected_arrival_date'],
  expected_arrival_date: ['arrival_date'],
  images: ['gallery', 'image_urls', 'image_url'],
  amount: ['amount_naira'],
  amount_naira: ['amount'],
  phone: ['customer_phone', 'whatsapp'],
  email: ['customer_email'],
};

function extractMissingColumn(errorMessage: string): string | null {
  const match = errorMessage.match(/'([^']+)' column/);
  return match ? match[1] : null;
}

/**
 * Inserts a row into a Supabase table while gracefully adapting if an optional
 * column is absent or uses a known column alias in the database schema.
 */
export async function insertRowResilient<T = Record<string, unknown>>(
  table: string,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const working: Record<string, unknown> = { ...payload };
  const triedCols = new Set<string>();

  for (let attempt = 0; attempt < 15; attempt++) {
    const { data, error } = await supabase.from(table).insert(working).select('*').single();
    if (!error) {
      return { data: data as T, error: null };
    }
    if (error.code === 'PGRST204') {
      const missingCol = extractMissingColumn(error.message);
      if (missingCol && missingCol in working) {
        const val = working[missingCol];
        delete working[missingCol];
        triedCols.add(missingCol);
        const aliases = COLUMN_ALIASES[missingCol] ?? [];
        const nextAlias = aliases.find((a) => !triedCols.has(a) && !(a in working));
        if (nextAlias) {
          working[nextAlias] =
            nextAlias === 'image_url' && Array.isArray(val) ? val[0] ?? '' : val;
        }
        continue;
      }
    }
    return { data: null, error: { message: error.message, code: error.code } };
  }

  return { data: null, error: { message: `Could not insert row into ${table}.` } };
}

/**
 * Updates a row in a Supabase table while gracefully adapting if an optional
 * column is absent or uses a known column alias in the database schema.
 */
export async function updateRowResilient<T = Record<string, unknown>>(
  table: string,
  id: string,
  payload: Record<string, unknown>
): Promise<{ data: T | null; error: { message: string; code?: string } | null }> {
  const working: Record<string, unknown> = { ...payload };
  const triedCols = new Set<string>();

  for (let attempt = 0; attempt < 15; attempt++) {
    const { data, error } = await supabase
      .from(table)
      .update(working)
      .eq('id', id)
      .select('*')
      .single();
    if (!error) {
      return { data: data as T, error: null };
    }
    if (error.code === 'PGRST204') {
      const missingCol = extractMissingColumn(error.message);
      if (missingCol && missingCol in working) {
        const val = working[missingCol];
        delete working[missingCol];
        triedCols.add(missingCol);
        const aliases = COLUMN_ALIASES[missingCol] ?? [];
        const nextAlias = aliases.find((a) => !triedCols.has(a) && !(a in working));
        if (nextAlias) {
          working[nextAlias] =
            nextAlias === 'image_url' && Array.isArray(val) ? val[0] ?? '' : val;
        }
        continue;
      }
    }
    return { data: null, error: { message: error.message, code: error.code } };
  }

  return { data: null, error: { message: `Could not update row in ${table}.` } };
}

export function dataUriToBlob(dataUri: string): { blob: Blob; ext: string; contentType: string } {
  const [header, base64] = dataUri.split(',');
  const mimeMatch = header.match(/data:([^;]+);base64/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext =
    contentType === 'image/png'
      ? 'png'
      : contentType === 'image/webp'
        ? 'webp'
        : 'jpg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { blob: new Blob([bytes], { type: contentType }), ext, contentType };
}

export async function uploadProductImageSource(
  source: string,
  storagePathPrefix: string
): Promise<{ url: string | null; error?: string }> {
  const trimmed = source.trim();
  if (!trimmed) {
    return { url: null, error: 'Empty image source.' };
  }

  // Already a hosted URL
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return { url: trimmed };
  }

  if (trimmed.startsWith('data:image/')) {
    const { blob, ext, contentType } = dataUriToBlob(trimmed);
    const fullPath = `${storagePathPrefix}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(fullPath, blob, { contentType, upsert: true });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(fullPath);
    return { url: data.publicUrl };
  }

  return { url: trimmed };
}

function normalizeImageArray(row: Record<string, unknown>): string[] {
  const candidate = row.images ?? row.gallery ?? row.image_urls;
  if (Array.isArray(candidate)) {
    const cleaned = candidate.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
    if (cleaned.length > 0) return cleaned;
  }
  if (typeof row.image_url === 'string' && row.image_url.trim()) {
    return [row.image_url.trim()];
  }
  if (typeof row.image === 'string' && row.image.trim()) {
    return [row.image.trim()];
  }
  return [];
}

function mapVariantRow(v: Record<string, unknown>): ProductVariant {
  const label = String(v.label ?? v.name ?? v.option_label ?? 'Standard');
  const priceNaira = Number(v.price ?? v.price_naira ?? 0);
  return { label, priceNaira };
}

export function mapProductRow(row: Record<string, unknown>): DbProductWithActive {
  const rawVariants = Array.isArray(row.product_variants)
    ? (row.product_variants as Record<string, unknown>[])
    : [];
  const sortedRawVariants = [...rawVariants].sort(
    (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
  );
  const variants =
    sortedRawVariants.length > 0 ? sortedRawVariants.map(mapVariantRow) : undefined;

  const images = normalizeImageArray(row);
  const basePrice = Number(row.price ?? row.price_naira ?? 0);
  const lowestVariantPrice =
    variants && variants.length > 0
      ? Math.min(...variants.map((v) => v.priceNaira))
      : basePrice;

  const arrivalDate = String(row.arrival_date ?? row.expected_arrival_date ?? '2026-12-06').slice(
    0,
    10
  );
  const description = String(row.description ?? '');
  const shortSummary =
    typeof row.short_summary === 'string' && row.short_summary.trim()
      ? row.short_summary.trim()
      : description.slice(0, 140) || 'Curated pre-order batch item.';

  const batchCode =
    typeof row.batch_code === 'string' && row.batch_code.trim()
      ? row.batch_code.trim()
      : 'TAB-BATCH';

  const specsRaw = Array.isArray(row.specifications) ? row.specifications : [];
  const specifications =
    specsRaw.length > 0
      ? specsRaw.map((s: Record<string, unknown>) => ({
          label: String(s.label ?? ''),
          value: String(s.value ?? ''),
        }))
      : [
          { label: 'Expected Arrival', value: arrivalDate },
          { label: 'Batch Code', value: batchCode },
        ];

  const isActive = row.active !== false;

  return {
    id: String(row.id),
    slug: String(row.slug ?? row.id),
    name: String(row.name ?? 'Untitled Product'),
    categorySlug: String(row.category ?? row.category_slug ?? 'home-and-kitchen'),
    priceNaira: lowestVariantPrice > 0 ? lowestVariantPrice : basePrice,
    variants,
    shortSummary,
    description,
    image: images[0] ?? '',
    gallery: images,
    expectedArrivalDate: arrivalDate,
    isPreOrderOpen: row.is_preorder_open !== false && isActive,
    featured: row.featured !== false,
    batchCode,
    specifications,
    active: isActive,
  };
}

function normalizeOrderItems(rawItems: unknown, fallbackArrival: string): OrderItem[] {
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((entry: Record<string, unknown>, idx) => ({
    productId: String(entry.product_id ?? entry.productId ?? `item-${idx}`),
    productName: String(entry.product_name ?? entry.productName ?? 'Pre-order item'),
    variantLabel:
      typeof (entry.variant_label ?? entry.variantLabel) === 'string' &&
      String(entry.variant_label ?? entry.variantLabel).trim()
        ? String(entry.variant_label ?? entry.variantLabel)
        : undefined,
    productImage: String(entry.product_image ?? entry.productImage ?? ''),
    unitPriceNaira: Number(entry.unit_price ?? entry.unitPriceNaira ?? 0),
    quantity: Number(entry.quantity ?? 1),
    expectedArrivalDate: String(
      entry.expected_arrival_date ?? entry.expectedArrivalDate ?? fallbackArrival
    ).slice(0, 10),
  }));
}

export function mapOrderRow(row: Record<string, unknown>): Order {
  const createdAt = String(row.created_at ?? new Date().toISOString()).slice(0, 10);
  const rawExpectedArrival = row.expected_arrival_date ?? row.arrival_date;
  const fallbackArrival =
    typeof rawExpectedArrival === 'string' && rawExpectedArrival.trim()
      ? rawExpectedArrival.slice(0, 10)
      : '2026-12-06';
  const items = normalizeOrderItems(row.items, fallbackArrival);
  const latestItemArrival = items.reduce(
    (latest, entry) =>
      entry.expectedArrivalDate > latest ? entry.expectedArrivalDate : latest,
    items[0]?.expectedArrivalDate ?? fallbackArrival
  );
  const expectedArrival =
    typeof rawExpectedArrival === 'string' && rawExpectedArrival.trim()
      ? rawExpectedArrival.slice(0, 10)
      : latestItemArrival;
  const deliveryFeeNaira = Number(row.delivery_fee ?? row.delivery_fee_naira ?? 0);
  const fullTotalNaira = Number(row.total ?? row.full_total_naira ?? 0);
  const subtotalNaira = Number(
    row.subtotal ?? Math.max(0, fullTotalNaira - deliveryFeeNaira)
  );
  const depositPercentageApplied = Number(
    row.upfront_percent ?? row.deposit_percentage_applied ?? 50
  );
  const depositPaidNaira = Number(row.deposit_paid ?? row.deposit_paid_naira ?? 0);
  const balanceRemainingNaira = Number(row.balance_due ?? row.balance_remaining_naira ?? 0);

  const deliveryAddress =
    typeof row.delivery_address === 'string' ? row.delivery_address.trim() : '';
  const deliveryCity =
    typeof row.delivery_city === 'string' ? row.delivery_city.trim() : '';
  const deliveryState =
    typeof row.delivery_state === 'string' ? row.delivery_state.trim() : '';
  const deliveryNote =
    typeof row.delivery_note === 'string' ? row.delivery_note.trim() : '';

  return {
    id: String(row.id),
    orderNumber: String(row.order_number ?? row.id),
    customerId: String(row.customer_id ?? ''),
    customerName: String(row.customer_name ?? ''),
    customerEmail: String(row.email ?? row.customer_email ?? ''),
    customerWhatsApp: String(row.phone ?? row.customer_phone ?? ''),
    deliveryZoneId: String(row.delivery_zone_id ?? 'lagos-mainland'),
    deliveryZoneLabel: String(row.delivery_zone_label ?? 'Standard Delivery'),
    deliveryAddress,
    deliveryCity,
    deliveryState,
    deliveryNote,
    createdAt,
    expectedArrivalDate: expectedArrival,
    items,
    subtotalNaira,
    deliveryFeeNaira,
    fullTotalNaira,
    depositPercentageApplied,
    depositPaidNaira,
    balanceRemainingNaira,
    status: String(row.status ?? 'Deposit paid, waiting for stock') as OrderStatus,
  };
}

export function mapPaymentRow(
  row: Record<string, unknown>,
  ordersById: Map<string, Order>
): PaymentRecord {
  const orderId = String(row.order_id ?? '');
  const linkedOrder = ordersById.get(orderId);
  const kind = String(row.kind ?? 'deposit').toLowerCase();
  const type: PaymentRecord['type'] = kind === 'balance' ? 'Balance' : 'Deposit';
  const rawStatus = String(row.status ?? 'simulated');
  const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

  return {
    id: String(row.id),
    reference: String(row.reference ?? row.id),
    orderId,
    orderNumber: String(row.order_number ?? linkedOrder?.orderNumber ?? orderId.slice(0, 8)),
    customerName: String(row.customer_name ?? linkedOrder?.customerName ?? 'Customer'),
    type,
    amountNaira: Number(row.amount ?? row.amount_naira ?? 0),
    date: String(row.created_at ?? row.date ?? new Date().toISOString()).slice(0, 10),
    method: 'Simulated',
    status: displayStatus,
  };
}
