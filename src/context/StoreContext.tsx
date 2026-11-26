import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DeliveryZoneFee, STORE_CONFIG, StoreConfig } from '../config/storeConfig';
import {
  calculateDepositAndBalance,
  Category,
  CustomerAccount,
  getLowestVariant,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_PRODUCTS,
  Order,
  OrderItem,
  OrderStatus,
  PaymentRecord,
  Product,
} from '../data/storeData';

export const ADMIN_EMAIL = 'toluwalopeesther80@gmail.com';

export type RouteView =
  | { page: 'home' }
  | { page: 'shop'; categorySlug?: string; searchQuery?: string }
  | { page: 'product'; productSlug: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'login' }
  | { page: 'account'; tab?: 'orders' | 'details'; orderId?: string }
  | { page: 'admin'; tab?: 'overview' | 'products' | 'orders' | 'payments' | 'settings' }
  | { page: 'info'; slug: 'preorder-terms' | 'refund-policy' | 'privacy-policy' | 'delivery-info' | 'contact' };

export interface CartItem {
  productId: string;
  variantLabel?: string;
  quantity: number;
}

export interface CheckoutPayload {
  name: string;
  whatsApp: string;
  email: string;
  deliveryZoneId: string;
  deliveryAddress: string;
  upfrontPercentage: number;
  password?: string;
}

interface ToastMessage {
  id: number;
  text: string;
}

interface StoreContextValue {
  route: RouteView;
  navigate: (next: RouteView) => void;
  categories: Category[];
  products: Product[];
  orders: Order[];
  payments: PaymentRecord[];
  customers: CustomerAccount[];
  currentCustomer: CustomerAccount | null;
  isAdmin: boolean;
  hasAdminAccount: boolean;
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
  }[];
  cartSubtotal: number;
  toast: ToastMessage | null;
  showToast: (text: string) => void;

  // Cart actions
  addToCart: (productId: string, quantity?: number, variantLabel?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, variantLabel?: string) => void;
  removeFromCart: (productId: string, variantLabel?: string) => void;
  clearCart: () => void;

  // Auth & customer actions
  loginCustomer: (email: string, password: string) => { ok: boolean; isAdmin?: boolean; error?: string };
  registerCustomer: (data: {
    name: string;
    email: string;
    whatsApp: string;
    deliveryAddress: string;
    password: string;
  }) => { ok: boolean; isAdmin?: boolean; error?: string };
  loginAdmin: (email: string, password: string) => { ok: boolean; error?: string };
  setupAdminAccount: (email: string, password: string) => { ok: boolean; error?: string };
  logoutCustomer: () => void;
  updateCustomerDetails: (updates: {
    name: string;
    whatsApp: string;
    email: string;
    deliveryAddress: string;
  }) => void;

  // Checkout & order actions
  placeOrder: (payload: CheckoutPayload) => { ok: boolean; order?: Order; error?: string };
  payOrderBalance: (orderId: string) => { ok: boolean; error?: string };

  // Admin actions
  addProduct: (product: Omit<Product, 'id' | 'slug'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  toggleProductPreOrder: (productId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateSettings: (updates: {
    defaultUpfrontPercentage: number;
    storeWhatsAppNumber: string;
    deliveryFees: DeliveryZoneFee[];
  }) => void;
  getWhatsAppUrl: (message?: string) => string;
}

const STORAGE_KEYS = {
  products: 'tabsah_products_v3',
  orders: 'tabsah_orders_v3',
  payments: 'tabsah_payments_v3',
  customers: 'tabsah_customers_v2',
  currentCustomerId: 'tabsah_current_customer_v2',
  cart: 'tabsah_cart_v3',
  settings: 'tabsah_settings_v3',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in restricted browsing modes.
  }
}

function getTodayIso(): string {
  // Using local store date aligned with Nov 2026
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isAdminLocation(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return path === '/admin' || hash === 'admin';
}

const LEGACY_SEED_CUSTOMER_IDS = new Set(['cust-1', 'cust-2', 'cust-3']);
const LEGACY_SEED_ORDER_IDS = new Set(['ord-1001', 'ord-1002', 'ord-1003', 'ord-1004', 'ord-1005']);
const LEGACY_SEED_PAYMENT_IDS = new Set([
  'pay-1',
  'pay-2',
  'pay-3',
  'pay-4',
  'pay-5',
  'pay-6',
  'pay-7',
]);

function isLegacySeedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@example.com');
}

function loadCleanedPersistedState() {
  const rawCustomers = readStorage<CustomerAccount[]>(STORAGE_KEYS.customers, INITIAL_CUSTOMERS);
  const removedCustomerIds = new Set<string>(LEGACY_SEED_CUSTOMER_IDS);
  const cleanedCustomers = rawCustomers.filter((c) => {
    const shouldRemove = LEGACY_SEED_CUSTOMER_IDS.has(c.id) || isLegacySeedEmail(c.email);
    if (shouldRemove) removedCustomerIds.add(c.id);
    return !shouldRemove;
  });

  const rawOrders = readStorage<Order[]>(STORAGE_KEYS.orders, INITIAL_ORDERS);
  const removedOrderIds = new Set<string>(LEGACY_SEED_ORDER_IDS);
  const cleanedOrders = rawOrders.filter((o) => {
    const shouldRemove =
      LEGACY_SEED_ORDER_IDS.has(o.id) ||
      removedCustomerIds.has(o.customerId) ||
      isLegacySeedEmail(o.customerEmail);
    if (shouldRemove) removedOrderIds.add(o.id);
    return !shouldRemove;
  });

  const rawPayments = readStorage<PaymentRecord[]>(STORAGE_KEYS.payments, INITIAL_PAYMENTS);
  const cleanedPayments = rawPayments.filter(
    (p) => !LEGACY_SEED_PAYMENT_IDS.has(p.id) && !removedOrderIds.has(p.orderId)
  );

  const rawCurrentCustomerId = readStorage<string | null>(STORAGE_KEYS.currentCustomerId, null);
  const cleanedCurrentCustomerId =
    rawCurrentCustomerId && cleanedCustomers.some((c) => c.id === rawCurrentCustomerId)
      ? rawCurrentCustomerId
      : null;

  return {
    customers: cleanedCustomers,
    orders: cleanedOrders,
    payments: cleanedPayments,
    currentCustomerId: cleanedCurrentCustomerId,
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialPersisted] = useState(loadCleanedPersistedState);
  const [route, setRoute] = useState<RouteView>(() =>
    isAdminLocation() ? { page: 'admin', tab: 'overview' } : { page: 'home' }
  );
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS)
  );
  const [orders, setOrders] = useState<Order[]>(() => initialPersisted.orders);
  const [payments, setPayments] = useState<PaymentRecord[]>(() => initialPersisted.payments);
  const [customers, setCustomers] = useState<CustomerAccount[]>(() => initialPersisted.customers);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(
    () => initialPersisted.currentCustomerId
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage<CartItem[]>(STORAGE_KEYS.cart, [])
  );
  const [settings, setSettings] = useState<StoreConfig>(() => {
    const saved = readStorage<Partial<StoreConfig>>(STORAGE_KEYS.settings, {});
    const upfrontOptions = STORE_CONFIG.upfrontOptions;
    const savedDefault = saved.defaultUpfrontPercentage ?? saved.depositPercentage;
    const validDefault =
      typeof savedDefault === 'number' && upfrontOptions.includes(savedDefault)
        ? savedDefault
        : STORE_CONFIG.defaultUpfrontPercentage;
    return {
      ...STORE_CONFIG,
      ...saved,
      businessName: STORE_CONFIG.businessName,
      storeEmail: STORE_CONFIG.storeEmail,
      storeAddress: STORE_CONFIG.storeAddress,
      storeInstagramHandle: STORE_CONFIG.storeInstagramHandle,
      storeInstagramUrl: STORE_CONFIG.storeInstagramUrl,
      upfrontOptions,
      defaultUpfrontPercentage: validDefault,
      depositPercentage: validDefault,
    };
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => writeStorage(STORAGE_KEYS.products, products), [products]);
  useEffect(() => writeStorage(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => writeStorage(STORAGE_KEYS.payments, payments), [payments]);
  useEffect(() => writeStorage(STORAGE_KEYS.customers, customers), [customers]);
  useEffect(() => writeStorage(STORAGE_KEYS.currentCustomerId, currentCustomerId), [currentCustomerId]);
  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(STORAGE_KEYS.settings, settings), [settings]);

  useEffect(() => {
    const syncAdminLocation = () => {
      if (isAdminLocation()) {
        setRoute({ page: 'admin', tab: 'overview' });
      }
    };
    window.addEventListener('hashchange', syncAdminLocation);
    window.addEventListener('popstate', syncAdminLocation);
    return () => {
      window.removeEventListener('hashchange', syncAdminLocation);
      window.removeEventListener('popstate', syncAdminLocation);
    };
  }, []);

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 3200);
  };

  const navigate = (next: RouteView) => {
    setRoute(next);
    if (next.page !== 'admin' && isAdminLocation()) {
      try {
        window.history.replaceState(null, '', '/');
      } catch {
        // Ignore history restrictions in sandboxed environments.
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentCustomer = useMemo(
    () => customers.find((c) => c.id === currentCustomerId) ?? null,
    [customers, currentCustomerId]
  );

  const hasAdminAccount = useMemo(
    () => customers.some((c) => c.email.toLowerCase() === ADMIN_EMAIL),
    [customers]
  );

  const isAdmin = useMemo(
    () => currentCustomer?.email.toLowerCase() === ADMIN_EMAIL,
    [currentCustomer]
  );

  const cartDetailedItems = useMemo(() => {
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

        return {
          cartKey,
          product,
          variantLabel: resolvedVariantLabel,
          unitPriceNaira,
          quantity: item.quantity,
          lineTotal: unitPriceNaira * item.quantity,
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
        } => entry !== null
      );
  }, [cart, products]);

  const cartCount = useMemo(
    () => cartDetailedItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartDetailedItems]
  );

  const cartSubtotal = useMemo(
    () => cartDetailedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartDetailedItems]
  );

  const addToCart = (productId: string, quantity = 1, variantLabel?: string) => {
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
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [...prev, { productId, variantLabel: resolvedVariantLabel, quantity }];
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

  const loginCustomer = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = customers.find((c) => c.email.toLowerCase() === cleanEmail);
    if (!found || found.password !== password) {
      return { ok: false, error: 'The email or password does not match our records.' };
    }
    setCurrentCustomerId(found.id);
    const adminMatch = found.email.toLowerCase() === ADMIN_EMAIL;
    showToast(`Welcome back, ${found.name.split(' ')[0]}.`);
    return { ok: true, isAdmin: adminMatch };
  };

  const registerCustomer = (data: {
    name: string;
    email: string;
    whatsApp: string;
    deliveryAddress: string;
    password: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (customers.some((c) => c.email.toLowerCase() === cleanEmail)) {
      return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
    }
    const newCustomer: CustomerAccount = {
      id: `cust-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      whatsApp: data.whatsApp.trim(),
      deliveryAddress: data.deliveryAddress.trim(),
      password: data.password,
      createdAt: getTodayIso(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
    setCurrentCustomerId(newCustomer.id);
    const adminMatch = cleanEmail === ADMIN_EMAIL;
    showToast(`Account created for ${newCustomer.name}.`);
    return { ok: true, isAdmin: adminMatch };
  };

  const loginAdmin = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL) {
      return { ok: false, error: 'Only the authorized store admin email can sign in here.' };
    }
    const found = customers.find((c) => c.email.toLowerCase() === ADMIN_EMAIL);
    if (!found) {
      return {
        ok: false,
        error: 'No password has been set for this admin email yet. Please set your password first.',
      };
    }
    if (found.password !== password) {
      return { ok: false, error: 'The email or password does not match our records.' };
    }
    setCurrentCustomerId(found.id);
    showToast('Signed in to store admin.');
    return { ok: true };
  };

  const setupAdminAccount = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== ADMIN_EMAIL) {
      return { ok: false, error: 'Only the authorized store admin email can sign in here.' };
    }
    if (hasAdminAccount) {
      return {
        ok: false,
        error: 'An admin password is already set. Please sign in with your password.',
      };
    }
    if (password.trim().length < 6) {
      return { ok: false, error: 'Please choose a password with at least 6 characters.' };
    }
    const adminAccount: CustomerAccount = {
      id: `admin-${Date.now()}`,
      name: 'Tabsah Store Owner',
      email: ADMIN_EMAIL,
      whatsApp: settings.storeWhatsAppNumber,
      deliveryAddress: settings.storeAddress,
      password,
      createdAt: getTodayIso(),
    };
    setCustomers((prev) => [...prev, adminAccount]);
    setCurrentCustomerId(adminAccount.id);
    showToast('Admin password saved. Welcome back.');
    return { ok: true };
  };

  const logoutCustomer = () => {
    setCurrentCustomerId(null);
    showToast('You have signed out.');
    navigate({ page: 'home' });
  };

  const updateCustomerDetails = (updates: {
    name: string;
    whatsApp: string;
    email: string;
    deliveryAddress: string;
  }) => {
    if (!currentCustomerId) return;
    const requestedEmail = updates.email.trim().toLowerCase();
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== currentCustomerId) return c;
        const nextEmail =
          requestedEmail === ADMIN_EMAIL && c.email.toLowerCase() !== ADMIN_EMAIL
            ? c.email
            : requestedEmail;
        return {
          ...c,
          name: updates.name.trim(),
          whatsApp: updates.whatsApp.trim(),
          email: nextEmail,
          deliveryAddress: updates.deliveryAddress.trim(),
        };
      })
    );
    showToast('Your account details have been saved.');
  };

  const placeOrder = (payload: CheckoutPayload) => {
    if (cartDetailedItems.length === 0) {
      return { ok: false, error: 'Your cart is empty.' };
    }
    const zone =
      settings.deliveryFees.find((z) => z.id === payload.deliveryZoneId) ??
      settings.deliveryFees[0];

    let activeCustomerId = currentCustomerId;
    const cleanEmail = payload.email.trim().toLowerCase();

    if (!activeCustomerId) {
      if (cleanEmail === ADMIN_EMAIL) {
        // Never auto-authenticate a guest checkout session into the single admin account.
        activeCustomerId = `guest-${Date.now()}`;
      } else {
        const existing = customers.find((c) => c.email.toLowerCase() === cleanEmail);
        if (existing) {
          activeCustomerId = existing.id;
          setCurrentCustomerId(existing.id);
        } else {
          const chosenPassword = (payload.password ?? '').trim();
          if (chosenPassword.length < 6) {
            return {
              ok: false,
              error: 'Please choose a password of at least 6 characters to create your account.',
            };
          }
          const created: CustomerAccount = {
            id: `cust-${Date.now()}`,
            name: payload.name.trim(),
            email: cleanEmail,
            whatsApp: payload.whatsApp.trim(),
            deliveryAddress: payload.deliveryAddress.trim(),
            password: chosenPassword,
            createdAt: getTodayIso(),
          };
          setCustomers((prev) => [...prev, created]);
          activeCustomerId = created.id;
          setCurrentCustomerId(created.id);
        }
      }
    }

    const orderItems: OrderItem[] = cartDetailedItems.map((entry) => ({
      productId: entry.product.id,
      productName: entry.product.name,
      variantLabel: entry.variantLabel,
      productImage: entry.product.image,
      unitPriceNaira: entry.unitPriceNaira,
      quantity: entry.quantity,
      expectedArrivalDate: entry.product.expectedArrivalDate,
    }));

    const latestArrival = orderItems.reduce(
      (latest, item) => (item.expectedArrivalDate > latest ? item.expectedArrivalDate : latest),
      orderItems[0].expectedArrivalDate
    );

    const subtotalNaira = cartSubtotal;
    const deliveryFeeNaira = zone ? zone.feeNaira : 0;
    const fullTotalNaira = subtotalNaira + deliveryFeeNaira;
    const appliedUpfrontPct = settings.upfrontOptions.includes(payload.upfrontPercentage)
      ? payload.upfrontPercentage
      : settings.defaultUpfrontPercentage;
    const { deposit, balance } = calculateDepositAndBalance(fullTotalNaira, appliedUpfrontPct);

    const today = getTodayIso();
    const orderSeq = 1044 + orders.length;
    const orderId = `ord-${Date.now()}`;
    const orderNumber = `TB-2026-${orderSeq}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: activeCustomerId,
      customerName: payload.name.trim(),
      customerEmail: cleanEmail,
      customerWhatsApp: payload.whatsApp.trim(),
      deliveryZoneId: zone ? zone.id : 'lagos-mainland',
      deliveryZoneLabel: zone ? zone.label : 'Standard Delivery',
      deliveryAddress: payload.deliveryAddress.trim(),
      createdAt: today,
      expectedArrivalDate: latestArrival,
      items: orderItems,
      subtotalNaira,
      deliveryFeeNaira,
      fullTotalNaira,
      depositPercentageApplied: appliedUpfrontPct,
      depositPaidNaira: deposit,
      balanceRemainingNaira: balance,
      status: balance === 0 ? 'Fully paid' : 'Deposit paid, waiting for stock',
    };

    const depositPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      reference: `PSK-TB-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      customerName: newOrder.customerName,
      type: appliedUpfrontPct === 100 ? 'Full Payment' : 'Deposit',
      amountNaira: deposit,
      date: today,
      method: 'Paystack',
      status: 'Confirmed',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setPayments((prev) => [depositPayment, ...prev]);
    clearCart();
    showToast(
      balance === 0
        ? `Order ${orderNumber} confirmed. Paid in full.`
        : `Order ${orderNumber} confirmed. ${appliedUpfrontPct}% upfront payment received.`
    );
    return { ok: true, order: newOrder };
  };

  const payOrderBalance = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return { ok: false, error: 'Order not found.' };
    if (target.balanceRemainingNaira <= 0) {
      return { ok: false, error: 'This order is already fully paid.' };
    }

    const amountPaid = target.balanceRemainingNaira;
    const today = getTodayIso();

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              balanceRemainingNaira: 0,
              status: 'Fully paid',
            }
          : o
      )
    );

    const balancePayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      reference: `PSK-TB-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: target.id,
      orderNumber: target.orderNumber,
      customerName: target.customerName,
      type: 'Balance',
      amountNaira: amountPaid,
      date: today,
      method: 'Paystack',
      status: 'Confirmed',
    };

    setPayments((prev) => [balancePayment, ...prev]);
    showToast(`Balance paid for ${target.orderNumber}. Your order is now ready for dispatch.`);
    return { ok: true };
  };

  const addProduct = (product: Omit<Product, 'id' | 'slug'>) => {
    if (!isAdmin) return;
    const cleanedGallery = (product.gallery ?? []).map((img) => img.trim()).filter(Boolean);
    const primaryImage = product.image.trim() || cleanedGallery[0] || '';
    if (!primaryImage) return;
    const finalGallery = cleanedGallery.length > 0 ? cleanedGallery : [primaryImage];

    const id = `prod-${Date.now()}`;
    const slug = `${slugify(product.name)}-${String(Date.now()).slice(-4)}`;
    const newProduct: Product = {
      ...product,
      id,
      slug,
      image: primaryImage,
      gallery: finalGallery,
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Added ${newProduct.name} to the store.`);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    if (!isAdmin) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const cleanedGallery =
          updates.gallery !== undefined
            ? updates.gallery.map((img) => img.trim()).filter(Boolean)
            : undefined;
        const nextImage =
          updates.image !== undefined ? updates.image.trim() : cleanedGallery?.[0] ?? p.image;
        if (!nextImage) return p;
        const nextGallery =
          cleanedGallery && cleanedGallery.length > 0
            ? cleanedGallery
            : updates.image && updates.image !== p.image
              ? [nextImage]
              : p.gallery;
        return {
          ...p,
          ...updates,
          image: nextImage,
          gallery: nextGallery,
        };
      })
    );
    showToast('Product updated.');
  };

  const toggleProductPreOrder = (productId: string) => {
    if (!isAdmin) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isPreOrderOpen: !p.isPreOrderOpen } : p))
    );
    showToast('Pre-order status updated.');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    if (!isAdmin) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const isSettled = status === 'Fully paid' || status === 'Shipped' || status === 'Delivered';
        return {
          ...o,
          status,
          balanceRemainingNaira: isSettled ? 0 : o.balanceRemainingNaira,
        };
      })
    );
    showToast(`Order status updated to ${status}.`);
  };

  const updateSettings = (updates: {
    defaultUpfrontPercentage: number;
    storeWhatsAppNumber: string;
    deliveryFees: DeliveryZoneFee[];
  }) => {
    if (!isAdmin) return;
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
    showToast('Store settings saved.');
  };

  const getWhatsAppUrl = (message?: string) => {
    const digits = settings.storeWhatsAppNumber.replace(/[^0-9]/g, '');
    const defaultText = message ?? 'Hello Tabsah team, I have a question about a pre-order.';
    return `https://wa.me/${digits}?text=${encodeURIComponent(defaultText)}`;
  };

  const value: StoreContextValue = {
    route,
    navigate,
    categories,
    products,
    orders,
    payments,
    customers,
    currentCustomer,
    isAdmin,
    hasAdminAccount,
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
    setupAdminAccount,
    logoutCustomer,
    updateCustomerDetails,
    placeOrder,
    payOrderBalance,
    addProduct,
    updateProduct,
    toggleProductPreOrder,
    updateOrderStatus,
    updateSettings,
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
