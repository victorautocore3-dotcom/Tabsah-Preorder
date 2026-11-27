import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DeliveryZoneFee, STORE_CONFIG, StoreConfig } from '../config/storeConfig';
import { supabase } from '../config/supabase';
import {
  calculateDepositAndBalance,
  Category,
  CustomerAccount,
  getLowestVariant,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  Order,
  OrderStatus,
  PaymentRecord,
  Product,
} from '../data/storeData';
import {
  DbProductWithActive,
  insertRowResilient,
  mapOrderRow,
  mapPaymentRow,
  mapProductRow,
  ProfileRow,
  updateRowResilient,
  uploadProductImageSource,
} from '../services/supabaseDb';
import {
  readCurrentLocationRoute,
  routeToHash,
  RouteView,
} from '../utils/hashRouter';

export type { RouteView };

export interface CartItem {
  productId: string;
  variantLabel?: string;
  quantity: number;
  upfrontPercentage?: number;
}

export interface CheckoutPayload {
  name: string;
  whatsApp: string;
  email: string;
  deliveryZoneId: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryNote: string;
  upfrontPercentage: number;
}

export interface CatalogueImportResult {
  ok: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

interface ToastMessage {
  id: number;
  text: string;
}

interface StoreContextValue {
  route: RouteView;
  navigate: (next: RouteView) => void;
  goBack: (fallback: RouteView) => void;
  canGoBack: boolean;
  categories: Category[];
  products: Product[];
  adminProducts: DbProductWithActive[];
  productsLoading: boolean;
  productsError: string | null;
  orders: Order[];
  ordersLoading: boolean;
  payments: PaymentRecord[];
  currentCustomer: CustomerAccount | null;
  authLoading: boolean;
  isAdmin: boolean;
  settings: StoreConfig;
  cart: CartItem[];
  cartCount: number;
  cartDetailedItems: {
    cartKey: string;
    product: Product;
    variantLabel?: string;
    unitPriceNaira: number;
    quantity: number;
    lineTotal: number;
    upfrontPercentage: number;
    payNowNaira: number;
    balanceNaira: number;
  }[];
  cartSubtotal: number;
  toast: ToastMessage | null;
  showToast: (text: string) => void;

  // Cart actions
  addToCart: (
    productId: string,
    quantity?: number,
    variantLabel?: string,
    upfrontPercentage?: number
  ) => void;
  updateCartQuantity: (productId: string, quantity: number, variantLabel?: string) => void;
  removeFromCart: (productId: string, variantLabel?: string) => void;
  clearCart: () => void;

  // Auth & customer actions
  loginCustomer: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; isAdmin?: boolean; error?: string }>;
  registerCustomer: (data: {
    name: string;
    email: string;
    whatsApp: string;
    deliveryAddress: string;
    password: string;
  }) => Promise<{
    ok: boolean;
    isAdmin?: boolean;
    needsEmailConfirmation?: boolean;
    message?: string;
    error?: string;
  }>;
  loginAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutCustomer: () => Promise<void>;
  updateCustomerDetails: (updates: {
    name: string;
    whatsApp: string;
    email: string;
    deliveryAddress: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  // Checkout & order actions
  placeOrder: (payload: CheckoutPayload) => Promise<{ ok: boolean; order?: Order; error?: string }>;
  payOrderBalance: (orderId: string) => Promise<{ ok: boolean; error?: string }>;
  lookupOrderByNumber: (orderNumber: string) => Promise<{ ok: boolean; order?: Order; error?: string }>;

  // Admin actions
  refreshCatalogue: () => Promise<void>;
  refreshOrdersAndPayments: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'slug'>) => Promise<{ ok: boolean; error?: string }>;
  updateProduct: (
    productId: string,
    updates: Partial<Product>
  ) => Promise<{ ok: boolean; error?: string }>;
  setProductActive: (productId: string, active: boolean) => Promise<{ ok: boolean; error?: string }>;
  toggleProductPreOrder: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<{ ok: boolean; error?: string }>;
  updateSettings: (updates: {
    defaultUpfrontPercentage: number;
    storeWhatsAppNumber: string;
    deliveryFees: DeliveryZoneFee[];
  }) => Promise<{ ok: boolean; error?: string }>;
  importBuiltInCatalogue: (
    onProgress?: (message: string) => void
  ) => Promise<CatalogueImportResult>;
  getWhatsAppUrl: (message?: string) => string;
}

const CART_STORAGE_KEY = 'tabsah_cart_v3';

const LEGACY_LOCAL_STORAGE_KEYS = [
  'tabsah_customers_v2',
  'tabsah_customers_v1',
  'tabsah_orders_v3',
  'tabsah_orders_v2',
  'tabsah_orders_v1',
  'tabsah_payments_v3',
  'tabsah_payments_v2',
  'tabsah_payments_v1',
  'tabsah_current_customer_v2',
  'tabsah_current_customer_v1',
  'tabsah_products_v3',
  'tabsah_products_v2',
  'tabsah_products_v1',
  'tabsah_settings_v3',
  'tabsah_settings_v2',
  'tabsah_settings_v1',
];

function purgeLegacyLocalStorage() {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_LOCAL_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage access errors in restricted browsing modes.
  }
}

function readCartStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCartStorage(cart: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Ignore storage quota errors in restricted browsing modes.
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function readHistoryNavIdx(): number | null {
  if (typeof window === 'undefined') return null;
  const state = window.history.state as { tabsahNavIdx?: unknown } | null;
  return typeof state?.tabsahNavIdx === 'number' && state.tabsahNavIdx >= 0
    ? state.tabsahNavIdx
    : null;
}

function parseUpfrontOptions(rawValue: unknown): number[] {
  const fallback = [50, 75, 100];
  try {
    let parsed = rawValue;
    if (typeof rawValue === 'string') {
      parsed = JSON.parse(rawValue);
    }
    if (Array.isArray(parsed)) {
      const nums = parsed
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0 && n <= 100);
      if (nums.length > 0) return nums;
    }
  } catch {
    // Fall back to default options.
  }
  return fallback;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy browser-local accounts, orders, payments, and sessions on load while keeping the cart.
  useState(() => {
    purgeLegacyLocalStorage();
    return true;
  });

  const [route, setRoute] = useState<RouteView>(() => readCurrentLocationRoute());
  const routeRef = useRef<RouteView>(route);
  const initialNavIdx = readHistoryNavIdx() ?? 0;
  const historyIdxRef = useRef<number>(initialNavIdx);
  const [canGoBack, setCanGoBack] = useState<boolean>(initialNavIdx > 0);
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<DbProductWithActive[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [cart, setCart] = useState<CartItem[]>(readCartStorage);
  const [settings, setSettings] = useState<StoreConfig>(STORE_CONFIG);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => writeCartStorage(cart), [cart]);

  // Initialize URL hash & history state on mount, and listen for browser back/forward/hash changes
  useEffect(() => {
    const initialRoute = readCurrentLocationRoute();
    const canonicalHash = routeToHash(initialRoute);
    const existingIdx = readHistoryNavIdx();
    const idx = existingIdx ?? 0;

    routeRef.current = initialRoute;
    historyIdxRef.current = idx;
    setRoute(initialRoute);
    setCanGoBack(idx > 0);

    try {
      const cleanPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
      if (cleanPath === '/admin' && !window.location.hash) {
        window.history.replaceState({ tabsahNavIdx: idx }, '', `/#${canonicalHash.slice(1)}`);
      } else if (existingIdx === null || !window.location.hash) {
        window.history.replaceState({ tabsahNavIdx: idx }, '', canonicalHash);
      }
    } catch {
      // Ignore history restrictions in sandboxed environments.
    }

    const syncFromLocation = () => {
      const nextRoute = readCurrentLocationRoute();
      const nextHash = routeToHash(nextRoute);
      const prevHash = routeToHash(routeRef.current);
      const stateIdx = readHistoryNavIdx();

      if (stateIdx !== null) {
        historyIdxRef.current = stateIdx;
        setCanGoBack(stateIdx > 0);
      } else if (nextHash !== prevHash) {
        const bumpedIdx = historyIdxRef.current + 1;
        historyIdxRef.current = bumpedIdx;
        setCanGoBack(true);
        try {
          window.history.replaceState({ tabsahNavIdx: bumpedIdx }, '', window.location.hash || nextHash);
        } catch {
          // Ignore history restrictions in sandboxed environments.
        }
      }

      if (nextHash !== prevHash) {
        routeRef.current = nextRoute;
        setRoute(nextRoute);
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };

    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  const showToast = useCallback((text: string) => {
    const id = Date.now();
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 3400);
  }, []);

  const navigate = useCallback((next: RouteView) => {
    const nextHash = routeToHash(next);
    const currentHash = routeToHash(routeRef.current);

    if (nextHash === currentHash && window.location.hash === nextHash) {
      routeRef.current = next;
      setRoute(next);
      return;
    }

    const nextIdx = historyIdxRef.current + 1;
    historyIdxRef.current = nextIdx;
    routeRef.current = next;
    setCanGoBack(true);
    setRoute(next);

    try {
      window.history.pushState({ tabsahNavIdx: nextIdx }, '', nextHash);
    } catch {
      window.location.hash = nextHash;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(
    (fallback: RouteView) => {
      if (historyIdxRef.current > 0) {
        window.history.back();
        return;
      }
      navigate(fallback);
    },
    [navigate]
  );

  // Load upfront options from store_settings (gracefully falling back to [50, 75, 100])
  const loadStoreSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value')
        .eq('key', 'upfront_options')
        .maybeSingle();

      if (!error && data && data.value !== undefined) {
        const parsedOptions = parseUpfrontOptions(data.value);
        setSettings((prev) => {
          const nextDefault = parsedOptions.includes(prev.defaultUpfrontPercentage)
            ? prev.defaultUpfrontPercentage
            : parsedOptions[0];
          return {
            ...prev,
            upfrontOptions: parsedOptions,
            defaultUpfrontPercentage: nextDefault,
            depositPercentage: nextDefault,
          };
        });
      }
    } catch {
      // Keep default [50, 75, 100] fallback.
    }
  }, []);

  // Load active storefront products (never falls back to INITIAL_PRODUCTS)
  const loadPublicProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (error) {
        setProducts([]);
        setProductsError(error.message);
      } else {
        const mapped = (data ?? []).map((row) =>
          mapProductRow(row as Record<string, unknown>)
        );
        setProducts(mapped);
      }
    } catch (err) {
      setProducts([]);
      setProductsError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadAdminProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_variants(*)')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setAdminProducts(
          data.map((row) => mapProductRow(row as Record<string, unknown>))
        );
      }
    } catch {
      // Keep current list on transient errors.
    }
  }, []);

  const refreshCatalogue = useCallback(async () => {
    await loadPublicProducts();
    if (isAdmin) {
      await loadAdminProducts();
    }
  }, [isAdmin, loadAdminProducts, loadPublicProducts]);

  const fetchOrdersAndPaymentsForUser = useCallback(
    async (userId: string, userIsAdmin: boolean) => {
      setOrdersLoading(true);
      try {
        let ordersQuery = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!userIsAdmin) {
          ordersQuery = ordersQuery.eq('customer_id', userId);
        }

        const { data: orderRows, error: ordersErr } = await ordersQuery;
        const mappedOrders: Order[] =
          !ordersErr && orderRows
            ? orderRows.map((row) => mapOrderRow(row as Record<string, unknown>))
            : [];
        setOrders(mappedOrders);

        if (userIsAdmin) {
          const { data: payRows, error: payErr } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });

          if (!payErr && payRows) {
            const byId = new Map<string, Order>(mappedOrders.map((o) => [o.id, o]));
            setPayments(
              payRows.map((row) => mapPaymentRow(row as Record<string, unknown>, byId))
            );
          } else {
            setPayments([]);
          }
        } else {
          setPayments([]);
        }
      } catch {
        setOrders([]);
        setPayments([]);
      } finally {
        setOrdersLoading(false);
      }
    },
    []
  );

  const refreshOrdersAndPayments = useCallback(async () => {
    if (!currentCustomer) {
      setOrders([]);
      setPayments([]);
      return;
    }
    await fetchOrdersAndPaymentsForUser(currentCustomer.id, isAdmin);
  }, [currentCustomer, fetchOrdersAndPaymentsForUser, isAdmin]);

  const hydrateSessionUser = useCallback(
    async (user: {
      id: string;
      email?: string;
      created_at?: string;
      user_metadata?: Record<string, unknown>;
    } | null) => {
      if (!user) {
        setCurrentCustomer(null);
        setIsAdmin(false);
        setOrders([]);
        setPayments([]);
        setAdminProducts([]);
        setAuthLoading(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const profile = profileData as ProfileRow | null;
        const meta = user.user_metadata ?? {};
        const adminFlag = Boolean(profile?.is_admin === true);

        const account: CustomerAccount = {
          id: user.id,
          name:
            profile?.full_name?.trim() ||
            String(meta.full_name ?? '').trim() ||
            (user.email ? user.email.split('@')[0] : 'Customer'),
          email: profile?.email || user.email || '',
          whatsApp: profile?.phone?.trim() || String(meta.phone ?? '').trim(),
          deliveryAddress:
            profile?.delivery_address?.trim() ||
            String(meta.delivery_address ?? '').trim(),
          password: '',
          createdAt: String(profile?.created_at ?? user.created_at ?? new Date().toISOString()).slice(
            0,
            10
          ),
        };

        setCurrentCustomer(account);
        setIsAdmin(adminFlag);
        setAuthLoading(false);

        await Promise.all([
          fetchOrdersAndPaymentsForUser(user.id, adminFlag),
          loadPublicProducts(),
          loadStoreSettings(),
          adminFlag ? loadAdminProducts() : Promise.resolve(),
        ]);
      } catch {
        setCurrentCustomer(null);
        setIsAdmin(false);
        setAuthLoading(false);
      }
    },
    [fetchOrdersAndPaymentsForUser, loadAdminProducts, loadPublicProducts, loadStoreSettings]
  );

  // Initial bootstrap: load settings, products, and Supabase Auth session
  useEffect(() => {
    let active = true;

    void loadStoreSettings();
    void loadPublicProducts();

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      void hydrateSessionUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      void hydrateSessionUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hydrateSessionUser, loadPublicProducts, loadStoreSettings]);

  const cartDetailedItems = useMemo(() => {
    const defaultPct = settings.upfrontOptions.includes(50)
      ? 50
      : settings.defaultUpfrontPercentage;

    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        let resolvedVariantLabel: string | undefined;
        let unitPriceNaira = product.priceNaira;

        if (product.variants && product.variants.length > 0) {
          const matched =
            product.variants.find((v) => v.label === item.variantLabel) ??
            getLowestVariant(product);
          if (matched) {
            resolvedVariantLabel = matched.label;
            unitPriceNaira = matched.priceNaira;
          }
        }

        const cartKey = resolvedVariantLabel
          ? `${product.id}::${resolvedVariantLabel}`
          : product.id;
        const lineTotal = unitPriceNaira * item.quantity;
        const upfrontPercentage =
          item.upfrontPercentage !== undefined &&
          settings.upfrontOptions.includes(item.upfrontPercentage)
            ? item.upfrontPercentage
            : defaultPct;
        const { deposit: payNowNaira, balance: balanceNaira } = calculateDepositAndBalance(
          lineTotal,
          upfrontPercentage
        );

        return {
          cartKey,
          product,
          variantLabel: resolvedVariantLabel,
          unitPriceNaira,
          quantity: item.quantity,
          lineTotal,
          upfrontPercentage,
          payNowNaira,
          balanceNaira,
        };
      })
      .filter(
        (
          entry
        ): entry is {
          cartKey: string;
          product: Product;
          variantLabel: string | undefined;
          unitPriceNaira: number;
          quantity: number;
          lineTotal: number;
          upfrontPercentage: number;
          payNowNaira: number;
          balanceNaira: number;
        } => entry !== null
      );
  }, [cart, products, settings.defaultUpfrontPercentage, settings.upfrontOptions]);

  const cartCount = useMemo(
    () => cartDetailedItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartDetailedItems]
  );

  const cartSubtotal = useMemo(
    () => cartDetailedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartDetailedItems]
  );

  const addToCart = (
    productId: string,
    quantity = 1,
    variantLabel?: string,
    upfrontPercentage?: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.isPreOrderOpen) {
      showToast('This item is currently closed for pre-order.');
      return;
    }

    let resolvedVariantLabel: string | undefined;
    if (product.variants && product.variants.length > 0) {
      const matched =
        product.variants.find((v) => v.label === variantLabel) ?? getLowestVariant(product);
      resolvedVariantLabel = matched?.label;
    }

    const defaultPct = settings.upfrontOptions.includes(50)
      ? 50
      : settings.defaultUpfrontPercentage;
    const resolvedUpfrontPct =
      upfrontPercentage !== undefined && settings.upfrontOptions.includes(upfrontPercentage)
        ? upfrontPercentage
        : defaultPct;

    setCart((prev) => {
      const existing = prev.find(
        (entry) =>
          entry.productId === productId &&
          (entry.variantLabel ?? undefined) === resolvedVariantLabel
      );
      if (existing) {
        return prev.map((entry) =>
          entry.productId === productId &&
          (entry.variantLabel ?? undefined) === resolvedVariantLabel
            ? {
                ...entry,
                quantity: entry.quantity + quantity,
                upfrontPercentage: resolvedUpfrontPct,
              }
            : entry
        );
      }
      return [
        ...prev,
        {
          productId,
          variantLabel: resolvedVariantLabel,
          quantity,
          upfrontPercentage: resolvedUpfrontPct,
        },
      ];
    });

    showToast(
      `Added ${product.name}${resolvedVariantLabel ? ` (${resolvedVariantLabel})` : ''} to your cart.`
    );
  };

  const updateCartQuantity = (productId: string, quantity: number, variantLabel?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantLabel);
      return;
    }
    setCart((prev) =>
      prev.map((entry) =>
        entry.productId === productId && (entry.variantLabel ?? undefined) === variantLabel
          ? { ...entry, quantity }
          : entry
      )
    );
  };

  const removeFromCart = (productId: string, variantLabel?: string) => {
    setCart((prev) =>
      prev.filter(
        (entry) =>
          !(entry.productId === productId && (entry.variantLabel ?? undefined) === variantLabel)
      )
    );
  };

  const clearCart = () => setCart([]);

  const loginCustomer = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message || 'The email or password does not match our records.',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, is_admin')
      .eq('id', data.user.id)
      .maybeSingle();

    const adminFlag = Boolean((profile as ProfileRow | null)?.is_admin === true);
    await hydrateSessionUser(data.user);

    const firstName =
      (profile as ProfileRow | null)?.full_name?.trim().split(' ')[0] ||
      cleanEmail.split('@')[0];
    showToast(`Welcome back, ${firstName}.`);
    return { ok: true, isAdmin: adminFlag };
  };

  const registerCustomer = async (data: {
    name: string;
    email: string;
    whatsApp: string;
    deliveryAddress: string;
    password: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const fullName = data.name.trim();
    const phone = data.whatsApp.trim();
    const deliveryAddress = data.deliveryAddress.trim();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: data.password,
      options: {
        data: {
          full_name: fullName,
          phone,
          delivery_address: deliveryAddress,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        ok: false,
        error: authError?.message || 'Could not create your account. Please try again.',
      };
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email: cleanEmail,
      full_name: fullName,
      phone,
    });

    if (profileError) {
      // If a database trigger already inserted the profile row (23505), update full_name & phone.
      if (profileError.code === '23505') {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ full_name: fullName, phone })
          .eq('id', authData.user.id);
        if (updateErr) {
          return {
            ok: false,
            error: `Account created, but we could not update your profile: ${updateErr.message}`,
          };
        }
      } else {
        return {
          ok: false,
          error: `Your login was created, but saving your customer profile failed: ${profileError.message}`,
        };
      }
    }

    if (!authData.session) {
      return {
        ok: true,
        needsEmailConfirmation: true,
        message:
          'Your account has been created. Please check your email inbox to confirm your address, then sign in.',
      };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', authData.user.id)
      .maybeSingle();

    const adminFlag = Boolean((profile as ProfileRow | null)?.is_admin === true);
    await hydrateSessionUser(authData.user);
    showToast(`Account created for ${fullName}.`);
    return { ok: true, isAdmin: adminFlag };
  };

  const loginAdmin = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return {
        ok: false,
        error: error?.message || 'The email or password does not match our records.',
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, is_admin')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      setCurrentCustomer(null);
      setIsAdmin(false);
      return {
        ok: false,
        error: `Could not verify admin permissions (${profileError.message}). Please check database permissions on public.profiles.`,
      };
    }

    if (!profile || (profile as ProfileRow).is_admin !== true) {
      await supabase.auth.signOut();
      setCurrentCustomer(null);
      setIsAdmin(false);
      return {
        ok: false,
        error: 'Not authorised. This account does not have store admin access.',
      };
    }

    await hydrateSessionUser(data.user);
    showToast('Signed in to store admin.');
    return { ok: true };
  };

  const logoutCustomer = async () => {
    await supabase.auth.signOut();
    setCurrentCustomer(null);
    setIsAdmin(false);
    setOrders([]);
    setPayments([]);
    setAdminProducts([]);
    showToast('You have signed out.');
    navigate({ page: 'home' });
  };

  const updateCustomerDetails = async (updates: {
    name: string;
    whatsApp: string;
    email: string;
    deliveryAddress: string;
  }) => {
    if (!currentCustomer) {
      return { ok: false, error: 'Please sign in first.' };
    }

    const fullName = updates.name.trim();
    const phone = updates.whatsApp.trim();
    const deliveryAddress = updates.deliveryAddress.trim();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', currentCustomer.id);

    if (profileError) {
      showToast(`Could not save profile: ${profileError.message}`);
      return { ok: false, error: profileError.message };
    }

    await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        phone,
        delivery_address: deliveryAddress,
      },
    });

    setCurrentCustomer((prev) =>
      prev
        ? {
            ...prev,
            name: fullName,
            whatsApp: phone,
            deliveryAddress,
          }
        : null
    );
    showToast('Your account details have been saved.');
    return { ok: true };
  };

  const placeOrder = async (payload: CheckoutPayload) => {
    if (!currentCustomer) {
      return { ok: false, error: 'Please sign in before placing your pre-order.' };
    }
    if (cartDetailedItems.length === 0) {
      return { ok: false, error: 'Your cart is empty.' };
    }

    const zone =
      settings.deliveryFees.find((z) => z.id === payload.deliveryZoneId) ??
      settings.deliveryFees[0];

    const cleanEmail = payload.email.trim().toLowerCase() || currentCustomer.email;
    const orderItemsJsonb = cartDetailedItems.map((entry) => ({
      product_id: entry.product.id,
      product_name: entry.product.name,
      variant_label: entry.variantLabel ?? null,
      product_image: entry.product.image,
      unit_price: entry.unitPriceNaira,
      quantity: entry.quantity,
      expected_arrival_date: entry.product.expectedArrivalDate,
    }));

    const latestArrival = cartDetailedItems.reduce(
      (latest, entry) =>
        entry.product.expectedArrivalDate > latest ? entry.product.expectedArrivalDate : latest,
      cartDetailedItems[0].product.expectedArrivalDate
    );

    const subtotalNaira = cartSubtotal;
    const deliveryFeeNaira = zone ? zone.feeNaira : 0;
    const fullTotalNaira = subtotalNaira + deliveryFeeNaira;
    const appliedUpfrontPct = settings.upfrontOptions.includes(payload.upfrontPercentage)
      ? payload.upfrontPercentage
      : settings.defaultUpfrontPercentage;
    const { deposit, balance } = calculateDepositAndBalance(fullTotalNaira, appliedUpfrontPct);

    const cleanDeliveryAddress = payload.deliveryAddress.trim();
    const cleanDeliveryCity = payload.deliveryCity.trim();
    const cleanDeliveryState = payload.deliveryState.trim();
    const cleanDeliveryNote = payload.deliveryNote.trim();

    if (!cleanDeliveryAddress || !cleanDeliveryCity || !cleanDeliveryState) {
      const missing: string[] = [];
      if (!cleanDeliveryAddress) missing.push('Full Delivery Address');
      if (!cleanDeliveryCity) missing.push('City / Town');
      if (!cleanDeliveryState) missing.push('State');
      return {
        ok: false,
        error: `Please enter the required delivery details: ${missing.join(', ')}.`,
      };
    }

    const orderNumber = `TB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const statusText: OrderStatus =
      balance === 0 ? 'Fully paid' : 'Deposit paid, waiting for stock';

    const { data: insertedOrderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: currentCustomer.id,
        customer_name: payload.name.trim(),
        phone: payload.whatsApp.trim(),
        email: cleanEmail,
        items: orderItemsJsonb,
        delivery_fee: deliveryFeeNaira,
        total: fullTotalNaira,
        upfront_percent: appliedUpfrontPct,
        deposit_paid: deposit,
        balance_due: balance,
        status: statusText,
        delivery_address: cleanDeliveryAddress,
        delivery_city: cleanDeliveryCity,
        delivery_state: cleanDeliveryState,
        delivery_note: cleanDeliveryNote || null,
      })
      .select('*')
      .single();

    if (orderError || !insertedOrderRow) {
      return {
        ok: false,
        error: orderError?.message || 'Could not save your order to the database.',
      };
    }

    const mappedOrder = mapOrderRow(insertedOrderRow as Record<string, unknown>);
    mappedOrder.deliveryZoneLabel = zone ? zone.label : 'Standard Delivery';
    mappedOrder.expectedArrivalDate = latestArrival;

    const paymentRef = `TB-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
    const { error: paymentError } = await insertRowResilient('payments', {
      order_id: mappedOrder.id,
      kind: 'deposit',
      amount: deposit,
      reference: paymentRef,
      status: 'simulated',
    });

    if (paymentError) {
      showToast(
        `Order ${mappedOrder.orderNumber} saved, but payment record note: ${paymentError.message}`
      );
    }

    // Also keep the customer's delivery address saved in auth metadata for future checkouts
    void supabase.auth.updateUser({
      data: {
        full_name: payload.name.trim(),
        phone: payload.whatsApp.trim(),
        delivery_address: payload.deliveryAddress.trim(),
      },
    });

    clearCart();
    await fetchOrdersAndPaymentsForUser(currentCustomer.id, isAdmin);
    showToast(
      balance === 0
        ? `Order ${mappedOrder.orderNumber} recorded. Paid in full.`
        : `Order ${mappedOrder.orderNumber} recorded. ${appliedUpfrontPct}% upfront payment recorded.`
    );
    return { ok: true, order: mappedOrder };
  };

  const payOrderBalance = async (orderId: string) => {
    if (!currentCustomer) {
      return { ok: false, error: 'Please sign in to pay your balance.' };
    }
    const target = orders.find((o) => o.id === orderId);
    if (!target) return { ok: false, error: 'Order not found.' };
    if (target.balanceRemainingNaira <= 0) {
      return { ok: false, error: 'This order is already fully paid.' };
    }

    const amountPaid = target.balanceRemainingNaira;
    const { error: updateErr } = await updateRowResilient('orders', orderId, {
      balance_due: 0,
      status: 'Fully paid',
    });

    if (updateErr) {
      showToast(`Could not update order balance: ${updateErr.message}`);
      return { ok: false, error: updateErr.message };
    }

    const paymentRef = `TB-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
    const { error: payErr } = await insertRowResilient('payments', {
      order_id: orderId,
      kind: 'balance',
      amount: amountPaid,
      reference: paymentRef,
      status: 'simulated',
    });

    if (payErr) {
      showToast(`Order marked fully paid, but payment record error: ${payErr.message}`);
    } else {
      showToast(`Balance recorded for ${target.orderNumber}. Your order is now ready for dispatch.`);
    }

    await fetchOrdersAndPaymentsForUser(currentCustomer.id, isAdmin);
    return { ok: true };
  };

  const lookupOrderByNumber = async (orderNumber: string) => {
    if (!currentCustomer) {
      return { ok: false, error: 'Please sign in to look up your order.' };
    }
    const trimmed = orderNumber.trim();
    if (!trimmed) {
      return { ok: false, error: 'Please enter an order number.' };
    }

    let query = supabase
      .from('orders')
      .select('*')
      .ilike('order_number', trimmed);

    if (!isAdmin) {
      query = query.eq('customer_id', currentCustomer.id);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data) {
      return { ok: false, error: `No order found matching ${trimmed}.` };
    }

    return { ok: true, order: mapOrderRow(data as Record<string, unknown>) };
  };

  const addProduct = async (product: Omit<Product, 'id' | 'slug'>) => {
    if (!isAdmin) {
      return { ok: false, error: 'Not authorised.' };
    }

    const rawImages = (product.gallery && product.gallery.length > 0
      ? product.gallery
      : product.image
        ? [product.image]
        : []
    )
      .map((img) => img.trim())
      .filter(Boolean);

    if (rawImages.length === 0) {
      return {
        ok: false,
        error: 'Please add at least one product picture before saving this product.',
      };
    }

    const slug = `${slugify(product.name)}-${String(Date.now()).slice(-4)}`;
    const uploadedUrls: string[] = [];

    for (let i = 0; i < rawImages.length; i++) {
      const uploadRes = await uploadProductImageSource(
        rawImages[i],
        `products/${slug}/photo-${i + 1}-${Date.now()}`
      );
      if (!uploadRes.url) {
        return {
          ok: false,
          error: `Image upload failed: ${uploadRes.error ?? 'Unknown storage error.'}`,
        };
      }
      uploadedUrls.push(uploadRes.url);
    }

    const { data: insertedRow, error: insertErr } = await insertRowResilient<
      Record<string, unknown>
    >('products', {
      name: product.name.trim(),
      slug,
      category: product.categorySlug,
      price: product.priceNaira,
      description: product.description.trim(),
      short_summary: product.shortSummary.trim(),
      images: uploadedUrls,
      arrival_date: product.expectedArrivalDate,
      batch_code: product.batchCode.trim() || 'TAB-114',
      featured: product.featured,
      is_preorder_open: product.isPreOrderOpen,
      active: true,
    });

    if (insertErr || !insertedRow) {
      return { ok: false, error: insertErr?.message || 'Could not save product.' };
    }

    const newProductId = String(insertedRow.id);
    if (product.variants && product.variants.length > 0) {
      for (let i = 0; i < product.variants.length; i++) {
        const variant = product.variants[i];
        await insertRowResilient('product_variants', {
          product_id: newProductId,
          label: variant.label,
          price: variant.priceNaira,
          sort_order: i,
        });
      }
    }

    await refreshCatalogue();
    showToast(`Added ${product.name.trim()} to the store.`);
    return { ok: true };
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    if (!isAdmin) {
      return { ok: false, error: 'Not authorised.' };
    }

    const existing =
      adminProducts.find((p) => p.id === productId) ?? products.find((p) => p.id === productId);
    const slugBase = existing?.slug ?? `product-${productId.slice(0, 8)}`;

    const rawImages =
      updates.gallery !== undefined
        ? updates.gallery.map((img) => img.trim()).filter(Boolean)
        : updates.image !== undefined
          ? [updates.image.trim()].filter(Boolean)
          : existing?.gallery ?? [];

    if (rawImages.length === 0) {
      return {
        ok: false,
        error: 'Please add at least one product picture before saving this product.',
      };
    }

    const uploadedUrls: string[] = [];
    for (let i = 0; i < rawImages.length; i++) {
      const uploadRes = await uploadProductImageSource(
        rawImages[i],
        `products/${slugBase}/photo-${i + 1}-${Date.now()}`
      );
      if (!uploadRes.url) {
        return {
          ok: false,
          error: `Image upload failed: ${uploadRes.error ?? 'Unknown storage error.'}`,
        };
      }
      uploadedUrls.push(uploadRes.url);
    }

    const patch: Record<string, unknown> = {
      images: uploadedUrls,
    };
    if (updates.name !== undefined) patch.name = updates.name.trim();
    if (updates.categorySlug !== undefined) patch.category = updates.categorySlug;
    if (updates.priceNaira !== undefined) patch.price = updates.priceNaira;
    if (updates.expectedArrivalDate !== undefined) patch.arrival_date = updates.expectedArrivalDate;
    if (updates.batchCode !== undefined) patch.batch_code = updates.batchCode.trim() || 'TAB-114';
    if (updates.shortSummary !== undefined) patch.short_summary = updates.shortSummary.trim();
    if (updates.description !== undefined) patch.description = updates.description.trim();
    if (updates.isPreOrderOpen !== undefined) patch.is_preorder_open = updates.isPreOrderOpen;
    if (updates.featured !== undefined) patch.featured = updates.featured;

    const { error: updateErr } = await updateRowResilient('products', productId, patch);
    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }

    if (updates.variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', productId);
      for (let i = 0; i < updates.variants.length; i++) {
        const variant = updates.variants[i];
        await insertRowResilient('product_variants', {
          product_id: productId,
          label: variant.label,
          price: variant.priceNaira,
          sort_order: i,
        });
      }
    }

    await refreshCatalogue();
    showToast('Product updated.');
    return { ok: true };
  };

  const setProductActive = async (productId: string, active: boolean) => {
    if (!isAdmin) return { ok: false, error: 'Not authorised.' };
    const { error } = await updateRowResilient('products', productId, { active });
    if (error) {
      showToast(`Could not update product status: ${error.message}`);
      return { ok: false, error: error.message };
    }
    await refreshCatalogue();
    showToast(active ? 'Product reactivated.' : 'Product deactivated.');
    return { ok: true };
  };

  const toggleProductPreOrder = async (productId: string) => {
    if (!isAdmin) return { ok: false, error: 'Not authorised.' };
    const target =
      adminProducts.find((p) => p.id === productId) ?? products.find((p) => p.id === productId);
    if (!target) return { ok: false, error: 'Product not found.' };

    const nextOpen = !target.isPreOrderOpen;
    const { error } = await updateRowResilient('products', productId, {
      is_preorder_open: nextOpen,
    });
    if (error) {
      // Fallback: if table only uses active boolean for open/closed state
      const fallbackRes = await updateRowResilient('products', productId, { active: nextOpen });
      if (fallbackRes.error) {
        showToast(`Could not update pre-order status: ${fallbackRes.error.message}`);
        return { ok: false, error: fallbackRes.error.message };
      }
    }
    await refreshCatalogue();
    showToast('Pre-order status updated.');
    return { ok: true };
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!isAdmin) return { ok: false, error: 'Not authorised.' };
    const isSettled = status === 'Fully paid' || status === 'Shipped' || status === 'Delivered';
    const patch: Record<string, unknown> = { status };
    if (isSettled) {
      patch.balance_due = 0;
    }

    const { error } = await updateRowResilient('orders', orderId, patch);
    if (error) {
      showToast(`Could not update order status: ${error.message}`);
      return { ok: false, error: error.message };
    }

    await refreshOrdersAndPayments();
    showToast(`Order status updated to ${status}.`);
    return { ok: true };
  };

  const updateSettings = async (updates: {
    defaultUpfrontPercentage: number;
    storeWhatsAppNumber: string;
    deliveryFees: DeliveryZoneFee[];
  }) => {
    if (!isAdmin) return { ok: false, error: 'Not authorised.' };
    setSettings((prev) => {
      const validDefault = prev.upfrontOptions.includes(updates.defaultUpfrontPercentage)
        ? updates.defaultUpfrontPercentage
        : prev.defaultUpfrontPercentage;
      return {
        ...prev,
        defaultUpfrontPercentage: validDefault,
        depositPercentage: validDefault,
        storeWhatsAppNumber: updates.storeWhatsAppNumber.trim(),
        deliveryFees: updates.deliveryFees,
      };
    });

    await supabase
      .from('store_settings')
      .upsert({ key: 'upfront_options', value: settings.upfrontOptions }, { onConflict: 'key' });

    showToast('Store settings saved.');
    return { ok: true };
  };

  const importBuiltInCatalogue = async (
    onProgress?: (message: string) => void
  ): Promise<CatalogueImportResult> => {
    if (!isAdmin) {
      return { ok: false, importedCount: 0, skippedCount: 0, errors: ['Not authorised.'] };
    }

    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    onProgress?.('Checking existing products in the database...');
    const { data: existingRows, error: existingErr } = await supabase
      .from('products')
      .select('slug, name');

    if (existingErr) {
      return {
        ok: false,
        importedCount: 0,
        skippedCount: 0,
        errors: [`Could not read public.products: ${existingErr.message}`],
      };
    }

    const existingSlugs = new Set(
      (existingRows ?? [])
        .map((r: Record<string, unknown>) => String(r.slug ?? '').toLowerCase())
        .filter(Boolean)
    );
    const existingNames = new Set(
      (existingRows ?? [])
        .map((r: Record<string, unknown>) => String(r.name ?? '').toLowerCase())
        .filter(Boolean)
    );

    const total = INITIAL_PRODUCTS.length;

    for (let idx = 0; idx < total; idx++) {
      const item = INITIAL_PRODUCTS[idx];
      if (
        existingSlugs.has(item.slug.toLowerCase()) ||
        existingNames.has(item.name.toLowerCase())
      ) {
        skippedCount++;
        onProgress?.(`Skipped ${idx + 1} of ${total}: ${item.name} (already imported)`);
        continue;
      }

      onProgress?.(`Importing ${idx + 1} of ${total}: ${item.name} (uploading photos)...`);
      const photoSources = item.gallery.length > 0 ? item.gallery : [item.image];
      const uploadedUrls: string[] = [];
      let photoFailed = false;

      for (let pIdx = 0; pIdx < photoSources.length; pIdx++) {
        const res = await uploadProductImageSource(
          photoSources[pIdx],
          `catalogue/${item.slug}/photo-${pIdx + 1}`
        );
        if (!res.url) {
          errors.push(`${item.name} photo ${pIdx + 1}: ${res.error ?? 'Upload failed'}`);
          photoFailed = true;
          break;
        }
        uploadedUrls.push(res.url);
      }

      if (photoFailed || uploadedUrls.length === 0) {
        continue;
      }

      onProgress?.(`Importing ${idx + 1} of ${total}: ${item.name} (saving product)...`);
      const { data: insertedProduct, error: insertErr } = await insertRowResilient<
        Record<string, unknown>
      >('products', {
        name: item.name,
        slug: item.slug,
        category: item.categorySlug,
        price: item.priceNaira,
        description: item.description,
        short_summary: item.shortSummary,
        images: uploadedUrls,
        arrival_date: item.expectedArrivalDate,
        batch_code: item.batchCode,
        featured: item.featured,
        is_preorder_open: item.isPreOrderOpen,
        active: true,
      });

      if (insertErr || !insertedProduct) {
        errors.push(`${item.name}: ${insertErr?.message ?? 'Insert failed'}`);
        continue;
      }

      const dbProductId = String(insertedProduct.id);
      if (item.variants && item.variants.length > 0) {
        for (let vIdx = 0; vIdx < item.variants.length; vIdx++) {
          const variant = item.variants[vIdx];
          const { error: varErr } = await insertRowResilient('product_variants', {
            product_id: dbProductId,
            label: variant.label,
            price: variant.priceNaira,
            sort_order: vIdx,
          });
          if (varErr) {
            errors.push(`${item.name} variant (${variant.label}): ${varErr.message}`);
          }
        }
      }

      existingSlugs.add(item.slug.toLowerCase());
      existingNames.add(item.name.toLowerCase());
      importedCount++;
    }

    await refreshCatalogue();
    onProgress?.(
      `Done: imported ${importedCount} ${importedCount === 1 ? 'product' : 'products'}, skipped ${skippedCount}.`
    );

    if (errors.length === 0) {
      showToast(`Imported ${importedCount} products into the database.`);
    }

    return {
      ok: errors.length === 0,
      importedCount,
      skippedCount,
      errors,
    };
  };

  const getWhatsAppUrl = (message?: string) => {
    const digits = settings.storeWhatsAppNumber.replace(/[^0-9]/g, '');
    const defaultText = message ?? 'Hello Tabsah team, I have a question about a pre-order.';
    return `https://wa.me/${digits}?text=${encodeURIComponent(defaultText)}`;
  };

  const value: StoreContextValue = {
    route,
    navigate,
    goBack,
    canGoBack,
    categories,
    products,
    adminProducts,
    productsLoading,
    productsError,
    orders,
    ordersLoading,
    payments,
    currentCustomer,
    authLoading,
    isAdmin,
    settings,
    cart,
    cartCount,
    cartDetailedItems,
    cartSubtotal,
    toast,
    showToast,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    loginCustomer,
    registerCustomer,
    loginAdmin,
    logoutCustomer,
    updateCustomerDetails,
    placeOrder,
    payOrderBalance,
    lookupOrderByNumber,
    refreshCatalogue,
    refreshOrdersAndPayments,
    addProduct,
    updateProduct,
    setProductActive,
    toggleProductPreOrder,
    updateOrderStatus,
    updateSettings,
    importBuiltInCatalogue,
    getWhatsAppUrl,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
