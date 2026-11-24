import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DeliveryZoneFee, STORE_CONFIG, StoreConfig } from '../config/storeConfig';
import {
  calculateDepositAndBalance,
  Category,
  CustomerAccount,
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
  settings: StoreConfig;
  cart: CartItem[];
  cartCount: number;
  cartDetailedItems: { product: Product; quantity: number; lineTotal: number }[];
  cartSubtotal: number;
  toast: ToastMessage | null;
  showToast: (text: string) => void;

  // Cart actions
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Auth & customer actions
  loginCustomer: (email: string, password: string) => { ok: boolean; error?: string };
  registerCustomer: (data: {
    name: string;
    email: string;
    whatsApp: string;
    deliveryAddress: string;
    password: string;
  }) => { ok: boolean; error?: string };
  logoutCustomer: () => void;
  updateCustomerDetails: (updates: {
    name: string;
    whatsApp: string;
    email: string;
    deliveryAddress: string;
  }) => void;

  // Checkout & order actions
  placeDemoOrder: (payload: CheckoutPayload) => { ok: boolean; order?: Order; error?: string };
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
  products: 'tabsah_products_v2',
  orders: 'tabsah_orders_v2',
  payments: 'tabsah_payments_v2',
  customers: 'tabsah_customers_v2',
  currentCustomerId: 'tabsah_current_customer_v2',
  cart: 'tabsah_cart_v2',
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

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<RouteView>({ page: 'home' });
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(() =>
    readStorage<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    readStorage<Order[]>(STORAGE_KEYS.orders, INITIAL_ORDERS)
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() =>
    readStorage<PaymentRecord[]>(STORAGE_KEYS.payments, INITIAL_PAYMENTS)
  );
  const [customers, setCustomers] = useState<CustomerAccount[]>(() =>
    readStorage<CustomerAccount[]>(STORAGE_KEYS.customers, INITIAL_CUSTOMERS)
  );
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(() =>
    readStorage<string | null>(STORAGE_KEYS.currentCustomerId, null)
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

  const showToast = (text: string) => {
    const id = Date.now();
    setToast({ id, text });
    window.setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 3200);
  };

  const navigate = (next: RouteView) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentCustomer = useMemo(
    () => customers.find((c) => c.id === currentCustomerId) ?? null,
    [customers, currentCustomerId]
  );

  const cartDetailedItems = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          lineTotal: product.priceNaira * item.quantity,
        };
      })
      .filter((entry): entry is { product: Product; quantity: number; lineTotal: number } => entry !== null);
  }, [cart, products]);

  const cartCount = useMemo(
    () => cartDetailedItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartDetailedItems]
  );

  const cartSubtotal = useMemo(
    () => cartDetailedItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartDetailedItems]
  );

  const addToCart = (productId: string, quantity = 1) => {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.isPreOrderOpen) {
      showToast('This item is currently closed for pre-order.');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((entry) => entry.productId === productId);
      if (existing) {
        return prev.map((entry) =>
          entry.productId === productId
            ? { ...entry, quantity: entry.quantity + quantity }
            : entry
        );
      }
      return [...prev, { productId, quantity }];
    });
    showToast(`Added ${product.name} to your cart.`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((entry) => (entry.productId === productId ? { ...entry, quantity } : entry))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((entry) => entry.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const loginCustomer = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const found = customers.find((c) => c.email.toLowerCase() === cleanEmail);
    if (!found || found.password !== password) {
      return { ok: false, error: 'The email or password does not match our records.' };
    }
    setCurrentCustomerId(found.id);
    showToast(`Welcome back, ${found.name.split(' ')[0]}.`);
    return { ok: true };
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
    showToast(`Account created for ${newCustomer.name}.`);
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
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === currentCustomerId
          ? {
              ...c,
              name: updates.name.trim(),
              whatsApp: updates.whatsApp.trim(),
              email: updates.email.trim().toLowerCase(),
              deliveryAddress: updates.deliveryAddress.trim(),
            }
          : c
      )
    );
    showToast('Your account details have been saved.');
  };

  const placeDemoOrder = (payload: CheckoutPayload) => {
    if (cartDetailedItems.length === 0) {
      return { ok: false, error: 'Your cart is empty.' };
    }
    const zone =
      settings.deliveryFees.find((z) => z.id === payload.deliveryZoneId) ??
      settings.deliveryFees[0];

    let activeCustomerId = currentCustomerId;
    const cleanEmail = payload.email.trim().toLowerCase();

    if (!activeCustomerId) {
      const existing = customers.find((c) => c.email.toLowerCase() === cleanEmail);
      if (existing) {
        activeCustomerId = existing.id;
        setCurrentCustomerId(existing.id);
      } else {
        const created: CustomerAccount = {
          id: `cust-${Date.now()}`,
          name: payload.name.trim(),
          email: cleanEmail,
          whatsApp: payload.whatsApp.trim(),
          deliveryAddress: payload.deliveryAddress.trim(),
          password: payload.password || 'tabsah2026',
          createdAt: getTodayIso(),
        };
        setCustomers((prev) => [...prev, created]);
        activeCustomerId = created.id;
        setCurrentCustomerId(created.id);
      }
    }

    const orderItems: OrderItem[] = cartDetailedItems.map((entry) => ({
      productId: entry.product.id,
      productName: entry.product.name,
      productImage: entry.product.image,
      unitPriceNaira: entry.product.priceNaira,
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
      method: 'Paystack Demo',
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
      method: 'Paystack Demo',
      status: 'Confirmed',
    };

    setPayments((prev) => [balancePayment, ...prev]);
    showToast(`Balance paid for ${target.orderNumber}. Your order is now ready for dispatch.`);
    return { ok: true };
  };

  const addProduct = (product: Omit<Product, 'id' | 'slug'>) => {
    const id = `prod-${Date.now()}`;
    const slug = `${slugify(product.name)}-${String(Date.now()).slice(-4)}`;
    const newProduct: Product = {
      ...product,
      id,
      slug,
      gallery: product.gallery.length > 0 ? product.gallery : [product.image],
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Added ${newProduct.name} to the store.`);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextImage = updates.image ?? p.image;
        return {
          ...p,
          ...updates,
          image: nextImage,
          gallery: updates.gallery ?? [nextImage],
        };
      })
    );
    showToast('Product updated.');
  };

  const toggleProductPreOrder = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isPreOrderOpen: !p.isPreOrderOpen } : p))
    );
    showToast('Pre-order status updated.');
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
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
    logoutCustomer,
    updateCustomerDetails,
    placeDemoOrder,
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
