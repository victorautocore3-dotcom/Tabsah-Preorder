import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  Database,
  Edit3,
  ImagePlus,
  LayoutDashboard,
  Lock,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CatalogueImportResult, useStore } from '../context/StoreContext';
import {
  formatArrivalDate,
  formatNaira,
  ORDER_STATUS_STEPS,
  Order,
  OrderStatus,
} from '../data/storeData';
import { DbProductWithActive } from '../services/supabaseDb';
import { DeliveryZoneFee } from '../config/storeConfig';
import { ProductImage } from '../components/ProductImage';
import { PasswordInput } from '../components/PasswordInput';
import { BackButton } from '../components/BackButton';

type AdminTab = 'overview' | 'products' | 'orders' | 'payments' | 'settings';

interface AdminDashboardPageProps {
  initialTab?: AdminTab;
}

function isSafeImageSource(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const AdminLoginGate: React.FC = () => {
  const { loginAdmin, navigate } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await loginAdmin(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? 'Could not sign in.');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="mb-5">
        <BackButton fallback={{ page: 'home' }} />
      </div>
      <div className="border border-[#F0D9E3] bg-white p-6 sm:p-10 space-y-6">
        <div className="space-y-2 pb-5 border-b border-[#EFE5EA]">
          <div className="inline-flex items-center gap-2 text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C]">
            <Lock className="w-4 h-4 text-[#E8005F]" />
            <span>Authorized Access Only</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222]">
            Store Admin Sign In
          </h1>
          <p className="text-base text-[#555555] leading-relaxed">
            Sign in with your authorized store admin account to manage products, orders, payments,
            and store settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
            >
              Admin Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter authorized email"
              className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
            >
              Password
            </label>
            <PasswordInput
              id="admin-password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>{submitting ? 'Signing In...' : 'Sign In to Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-[#EFE5EA] text-center">
          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="text-[13px] tracking-[0.13em] uppercase font-medium text-[#52005C] hover:text-[#E8005F] cursor-pointer"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  initialTab = 'overview',
}) => {
  const {
    categories,
    adminProducts,
    productsLoading,
    orders,
    payments,
    settings,
    addProduct,
    updateProduct,
    setProductActive,
    toggleProductPreOrder,
    updateOrderStatus,
    updateSettings,
    importBuiltInCatalogue,
    refreshCatalogue,
    refreshOrdersAndPayments,
    logoutCustomer,
    navigate,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  // One-Time Catalogue Import State
  const [importingCatalogue, setImportingCatalogue] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [importResult, setImportResult] = useState<CatalogueImportResult | null>(null);

  // Add / Edit Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(
    categories[0]?.slug ?? 'gadgets-and-electronics'
  );
  const [prodPrice, setProdPrice] = useState('15000');
  const [prodArrival, setProdArrival] = useState('2026-12-06');
  const [prodBatch, setProdBatch] = useState('TAB-114');
  const [prodSummary, setProdSummary] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodImageUrlInput, setProdImageUrlInput] = useState('');
  const [prodImageError, setProdImageError] = useState('');
  const [prodOpen, setProdOpen] = useState(true);
  const [prodFeatured, setProdFeatured] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings Form State
  const [defaultUpfrontPct, setDefaultUpfrontPct] = useState<number>(
    settings.defaultUpfrontPercentage
  );
  const [whatsAppNumber, setWhatsAppNumber] = useState(settings.storeWhatsAppNumber);
  const [feeRows, setFeeRows] = useState<DeliveryZoneFee[]>(settings.deliveryFees);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    setDefaultUpfrontPct(settings.defaultUpfrontPercentage);
    setWhatsAppNumber(settings.storeWhatsAppNumber);
    setFeeRows(settings.deliveryFees);
  }, [settings]);

  // KPI Metrics
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysOrders = useMemo(
    () => orders.filter((o) => o.createdAt === todayIso),
    [orders, todayIso]
  );
  const totalDepositsReceived = useMemo(
    () =>
      payments
        .filter((p) => p.type === 'Deposit' || p.type === 'Full Payment')
        .reduce((sum, p) => sum + p.amountNaira, 0),
    [payments]
  );
  const totalBalancesReceived = useMemo(
    () => payments.filter((p) => p.type === 'Balance').reduce((sum, p) => sum + p.amountNaira, 0),
    [payments]
  );
  const balancesOutstanding = useMemo(
    () => orders.reduce((sum, o) => sum + o.balanceRemainingNaira, 0),
    [orders]
  );
  const waitingForStockCount = useMemo(
    () => orders.filter((o) => o.status === 'Deposit paid, waiting for stock').length,
    [orders]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return adminProducts;
    return adminProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categorySlug.toLowerCase().includes(q) ||
        p.batchCode.toLowerCase().includes(q)
    );
  }, [adminProducts, productSearch]);

  const handleImportCatalogue = async () => {
    if (importingCatalogue) return;
    setImportingCatalogue(true);
    setImportResult(null);
    setImportProgress('Starting catalogue import...');
    const result = await importBuiltInCatalogue((msg) => setImportProgress(msg));
    setImportResult(result);
    setImportingCatalogue(false);
  };

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
      if (q) {
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerWhatsApp.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  const openAddProductModal = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategory(categories[0]?.slug ?? 'gadgets-and-electronics');
    setProdPrice('15000');
    setProdArrival('2026-12-06');
    setProdBatch('TAB-114');
    setProdSummary('');
    setProdDesc('');
    setProdImages([]);
    setProdImageUrlInput('');
    setProdImageError('');
    setProdOpen(true);
    setProdFeatured(false);
    setProductModalOpen(true);
  };

  const openEditProductModal = (product: DbProductWithActive) => {
    setEditingProductId(product.id);
    setProdName(product.name);
    setProdCategory(product.categorySlug);
    setProdPrice(String(product.priceNaira));
    setProdArrival(product.expectedArrivalDate);
    setProdBatch(product.batchCode);
    setProdSummary(product.shortSummary);
    setProdDesc(product.description);
    const existingImages = (
      product.gallery && product.gallery.length > 0
        ? product.gallery
        : product.image
          ? [product.image]
          : []
    ).filter((img) => img.trim().length > 0);
    setProdImages(existingImages);
    setProdImageUrlInput('');
    setProdImageError('');
    setProdOpen(product.isPreOrderOpen);
    setProdFeatured(product.featured);
    setProductModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setProdImageError('Please select valid image files only (JPG, PNG, or WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          setProdImages((prev) => [...prev, reader.result as string]);
          setProdImageError('');
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = prodImageUrlInput.trim();
    if (!trimmed) return;
    if (!isSafeImageSource(trimmed)) {
      setProdImageError('Please enter a valid image URL starting with https://, http://, or /.');
      return;
    }
    setProdImages((prev) => [...prev, trimmed]);
    setProdImageUrlInput('');
    setProdImageError('');
  };

  const handleRemoveImage = (index: number) => {
    setProdImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedImages = prodImages.map((img) => img.trim()).filter(isSafeImageSource);
    if (cleanedImages.length === 0) {
      setProdImageError('Please add at least one product picture before saving this product.');
      return;
    }

    setProdImageError('');
    setSavingProduct(true);
    const numericPrice = Math.max(1000, Number(prodPrice) || 1000);

    const res = editingProductId
      ? await updateProduct(editingProductId, {
          name: prodName.trim(),
          categorySlug: prodCategory,
          priceNaira: numericPrice,
          expectedArrivalDate: prodArrival,
          batchCode: prodBatch.trim() || 'TAB-114',
          shortSummary: prodSummary.trim(),
          description: prodDesc.trim(),
          image: cleanedImages[0],
          gallery: cleanedImages,
          isPreOrderOpen: prodOpen,
          featured: prodFeatured,
        })
      : await addProduct({
          name: prodName.trim(),
          categorySlug: prodCategory,
          priceNaira: numericPrice,
          expectedArrivalDate: prodArrival,
          batchCode: prodBatch.trim() || 'TAB-114',
          shortSummary: prodSummary.trim() || 'Curated pre-order batch item.',
          description:
            prodDesc.trim() ||
            'Sourced directly for Pre Order With Tabsah customers with quality inspection in Lagos.',
          image: cleanedImages[0],
          gallery: cleanedImages,
          isPreOrderOpen: prodOpen,
          featured: prodFeatured,
          specifications: [
            { label: 'Batch Code', value: prodBatch.trim() || 'TAB-114' },
            { label: 'Expected Arrival', value: formatArrivalDate(prodArrival) },
          ],
        });

    setSavingProduct(false);
    if (!res.ok) {
      setProdImageError(res.error ?? 'Could not save this product. Please try again.');
      return;
    }

    setProductModalOpen(false);
  };

  const handleFeeChange = (zoneId: string, value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setFeeRows((prev) => prev.map((z) => (z.id === zoneId ? { ...z, feeNaira: num } : z)));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    await updateSettings({
      defaultUpfrontPercentage: defaultUpfrontPct,
      storeWhatsAppNumber: whatsAppNumber,
      deliveryFees: feeRows,
    });
    setSavingSettings(false);
  };

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
      <div className="mb-5">
        <BackButton fallback={{ page: 'admin', tab: 'overview' }} />
      </div>
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 min-w-0 bg-white border border-[#F0D9E3] p-5">
          <div className="pb-4 mb-4 border-b border-[#EFE5EA]">
            <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C]">
              Seller Portal
            </p>
            <h1 className="font-display text-2xl font-medium text-[#222222] mt-0.5">
              Tabsah Admin
            </h1>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    navigate({ page: 'admin', tab: item.id });
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-medium tracking-[0.13em] uppercase transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#E8005F] text-white'
                      : 'text-[#4A4A4A] hover:bg-[#FFF1F6] hover:text-[#E8005F]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 lg:mt-8 pt-4 lg:pt-5 border-t border-[#EFE5EA] flex flex-wrap lg:flex-col items-center lg:items-start gap-4">
            <button
              type="button"
              onClick={() => {
                void refreshCatalogue();
                void refreshOrdersAndPayments();
              }}
              className="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.13em] uppercase text-[#52005C] hover:text-[#E8005F] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#E8005F] hover:text-[#52005C] cursor-pointer"
            >
              Return to Storefront
            </button>
            <button
              type="button"
              onClick={() => void logoutCustomer()}
              className="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.13em] uppercase text-[#52005C] hover:text-[#E8005F] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-8">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#F0D9E3]">
                <div>
                  <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                    Daily Ledger
                  </p>
                  <h2 className="font-display text-3xl font-medium text-[#222222]">
                    Store Overview
                  </h2>
                  <p className="mt-1.5 text-base text-[#555555]">
                    Live pre-order snapshot across today&apos;s bookings, deposits, and incoming
                    batches.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('products');
                    navigate({ page: 'admin', tab: 'products' });
                    openAddProductModal();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] font-medium tracking-[0.14em] uppercase whitespace-nowrap self-start sm:self-auto transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Pre-Order Product</span>
                </button>
              </div>

              {/* One-Time Catalogue Import Banner when DB products table is empty */}
              {(!productsLoading && adminProducts.length === 0) || importResult ? (
                <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.16em] uppercase text-[#52005C]">
                        <Database className="w-4 h-4 text-[#E8005F]" />
                        <span>Catalogue Setup</span>
                      </p>
                      <h3 className="font-display text-2xl font-medium text-[#222222]">
                        {adminProducts.length === 0
                          ? 'Your database catalogue is currently empty'
                          : 'Catalogue Import Summary'}
                      </h3>
                      <p className="text-base text-[#4A4A4A] leading-relaxed">
                        {adminProducts.length === 0
                          ? 'Upload the 13 built-in products, their photos, and variant prices into Supabase Storage and the products table in one click. Safe to run more than once.'
                          : 'Products have been loaded into the database. Already-imported items are automatically skipped if run again.'}
                      </p>
                    </div>
                    {adminProducts.length === 0 && (
                      <button
                        type="button"
                        disabled={importingCatalogue}
                        onClick={() => void handleImportCatalogue()}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-[#52005C] hover:bg-[#3D0045] disabled:opacity-60 text-white text-[13px] font-semibold tracking-[0.14em] uppercase whitespace-nowrap self-start sm:self-center transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {importingCatalogue ? 'Importing...' : 'Import current catalogue'}
                        </span>
                      </button>
                    )}
                  </div>

                  {importProgress && (
                    <p className="text-base font-medium text-[#52005C] bg-white border border-[#F0D9E3] px-4 py-3">
                      {importProgress}
                    </p>
                  )}

                  {importResult && (
                    <div className="space-y-2">
                      <p
                        className={`text-base font-medium px-4 py-3 border ${
                          importResult.ok
                            ? 'bg-white border-[#F0D9E3] text-[#222222]'
                            : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                        }`}
                      >
                        Imported {importResult.importedCount} products, skipped{' '}
                        {importResult.skippedCount}.
                        {importResult.errors.length > 0
                          ? ` ${importResult.errors.length} error(s) occurred.`
                          : ''}
                      </p>
                      {importResult.errors.length > 0 && (
                        <ul className="bg-[#FEF2F2] border border-[#FECACA] p-4 space-y-1 text-sm text-[#991B1B]">
                          {importResult.errors.map((errMsg, idx) => (
                            <li key={idx}>{errMsg}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* 4 KPI Cells */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t border-l border-[#F0D9E3]">
                <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#666666]">
                    Today&apos;s Orders
                  </p>
                  <p className="mt-3 font-display text-4xl font-medium text-[#222222] tabular-nums">
                    {todaysOrders.length}
                  </p>
                  <p className="mt-2 text-sm text-[#E8005F] tabular-nums">
                    {formatNaira(todaysOrders.reduce((s, o) => s + o.fullTotalNaira, 0))} total
                    value
                  </p>
                </div>

                <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#666666]">
                    Upfront Payments Received
                  </p>
                  <p className="mt-3 font-display text-3xl font-medium text-[#E8005F] tabular-nums">
                    {formatNaira(totalDepositsReceived)}
                  </p>
                  <p className="mt-2 text-sm text-[#666666]">Recorded deposits and full payments</p>
                </div>

                <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#666666]">
                    Balances Outstanding
                  </p>
                  <p className="mt-3 font-display text-3xl font-medium text-[#52005C] tabular-nums">
                    {formatNaira(balancesOutstanding)}
                  </p>
                  <p className="mt-2 text-sm text-[#666666]">Due before batch dispatch</p>
                </div>

                <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#666666]">
                    Waiting for Stock
                  </p>
                  <p className="mt-3 font-display text-4xl font-medium text-[#222222] tabular-nums">
                    {waitingForStockCount}
                  </p>
                  <p className="mt-2 text-sm text-[#666666]">Active inbound batches</p>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="bg-white border border-[#F0D9E3] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#EFE5EA] flex items-center justify-between gap-4">
                  <h3 className="font-display text-xl font-medium text-[#222222]">
                    Recent Pre-Orders
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('orders');
                      navigate({ page: 'admin', tab: 'orders' });
                    }}
                    className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#E8005F] hover:text-[#52005C] cursor-pointer"
                  >
                    Manage all orders
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF7F9] text-[13px] font-medium tracking-[0.11em] uppercase text-[#666666] border-b border-[#F0D9E3]">
                      <tr>
                        <th className="px-6 py-3.5">Order</th>
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-6 py-3.5">Arrival</th>
                        <th className="px-6 py-3.5 text-right">Paid Upfront</th>
                        <th className="px-6 py-3.5 text-right">Balance</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE5EA]">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-base text-[#555555]">
                            No customer pre-orders have been recorded yet.
                          </td>
                        </tr>
                      ) : (
                        orders.slice(0, 6).map((order) => (
                          <tr key={order.id} className="hover:bg-[#FFF1F6]/50">
                            <td className="px-6 py-4 font-medium text-[#222222] tabular-nums whitespace-nowrap">
                              {order.orderNumber}
                            </td>
                            <td className="px-6 py-4 text-[#4A4A4A] whitespace-nowrap">
                              {order.customerName}
                            </td>
                            <td className="px-6 py-4 text-[#666666] whitespace-nowrap">
                              {formatArrivalDate(order.expectedArrivalDate)}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <p className="text-base font-medium text-[#E8005F] tabular-nums">
                                {formatNaira(order.depositPaidNaira)}
                              </p>
                              <p className="text-sm text-[#666666]">
                                {order.depositPercentageApplied}% upfront
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <p className="text-base font-medium text-[#52005C] tabular-nums">
                                {formatNaira(order.balanceRemainingNaira)}
                              </p>
                              {order.balanceRemainingNaira === 0 && (
                                <p className="text-sm text-[#52005C]">Paid in full</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#222222] whitespace-nowrap">
                              {order.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* PRODUCTS MANAGER TAB */}
          {activeTab === 'products' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#F0D9E3]">
                <div>
                  <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                    Catalogue
                  </p>
                  <h2 className="font-display text-3xl font-medium text-[#222222]">
                    Products Manager ({adminProducts.length})
                  </h2>
                  <p className="mt-1.5 text-base text-[#555555]">
                    Add products, upload photos, update naira pricing or expected arrival dates,
                    and open, close, or deactivate items.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                  {adminProducts.length === 0 && (
                    <button
                      type="button"
                      disabled={importingCatalogue}
                      onClick={() => void handleImportCatalogue()}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-[#52005C] hover:bg-[#3D0045] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.14em] uppercase whitespace-nowrap transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {importingCatalogue ? 'Importing...' : 'Import current catalogue'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={openAddProductModal}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] font-medium tracking-[0.14em] uppercase whitespace-nowrap transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product</span>
                  </button>
                </div>
              </div>

              {(importProgress || importResult) && (
                <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-5 space-y-2.5">
                  {importProgress && (
                    <p className="text-base font-medium text-[#52005C]">{importProgress}</p>
                  )}
                  {importResult && (
                    <>
                      <p
                        className={`text-base font-medium ${
                          importResult.ok ? 'text-[#222222]' : 'text-[#991B1B]'
                        }`}
                      >
                        Imported {importResult.importedCount} products, skipped{' '}
                        {importResult.skippedCount}.
                        {importResult.errors.length > 0
                          ? ` ${importResult.errors.length} error(s) occurred.`
                          : ''}
                      </p>
                      {importResult.errors.length > 0 && (
                        <ul className="bg-[#FEF2F2] border border-[#FECACA] p-3.5 space-y-1 text-sm text-[#991B1B]">
                          {importResult.errors.map((errMsg, idx) => (
                            <li key={idx}>{errMsg}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="relative max-w-sm">
                <Search className="w-4 h-4 text-[#52005C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products or batch..."
                  className="w-full h-11 pl-10 pr-4 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none bg-white text-base"
                />
              </div>

              <div className="bg-white border border-[#F0D9E3] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF7F9] text-[13px] font-medium tracking-[0.11em] uppercase text-[#666666] border-b border-[#F0D9E3]">
                      <tr>
                        <th className="px-6 py-3.5">Product</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5 text-right">Price</th>
                        <th className="px-6 py-3.5">Expected Arrival</th>
                        <th className="px-6 py-3.5">Pre-Order</th>
                        <th className="px-6 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE5EA]">
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-base text-[#555555]">
                            {adminProducts.length === 0
                              ? 'No products are in the database yet. Click "Import current catalogue" above or add a new product.'
                              : 'No products match your search.'}
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => {
                          const cat = categories.find((c) => c.slug === product.categorySlug);
                          return (
                            <tr
                              key={product.id}
                              className={`hover:bg-[#FFF1F6]/50 ${
                                product.active ? '' : 'opacity-65 bg-[#FAF7F9]'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3.5 min-w-[220px]">
                                  <div className="w-12 h-12 overflow-hidden bg-[#F8F5F7] shrink-0">
                                    <ProductImage
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-base font-medium text-[#222222] leading-snug">
                                        {product.name}
                                      </p>
                                      {!product.active && (
                                        <span className="px-2 py-0.5 bg-[#EFE5EA] text-[#52005C] text-[12px] font-semibold uppercase tracking-[0.08em]">
                                          Inactive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-[#666666] mt-0.5">
                                      {product.batchCode}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-[#555555] whitespace-nowrap">
                                {cat ? cat.name : product.categorySlug}
                              </td>
                              <td className="px-6 py-4 text-right text-base font-medium text-[#222222] tabular-nums whitespace-nowrap">
                                {product.variants && product.variants.length > 0
                                  ? `From ${formatNaira(product.priceNaira)}`
                                  : formatNaira(product.priceNaira)}
                              </td>
                              <td className="px-6 py-4 text-sm text-[#4A4A4A] whitespace-nowrap">
                                {formatArrivalDate(product.expectedArrivalDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => void toggleProductPreOrder(product.id)}
                                  className={`px-3 py-1.5 text-[13px] font-medium tracking-[0.06em] uppercase border transition-colors cursor-pointer ${
                                    product.isPreOrderOpen
                                      ? 'bg-[#FFF1F6] border-[#F0D9E3] text-[#E8005F] hover:bg-[#FFE3EE]'
                                      : 'bg-[#F5F5F5] border-[#E0E0E0] text-[#666666] hover:bg-[#EAEAEA]'
                                  }`}
                                >
                                  {product.isPreOrderOpen
                                    ? 'Open (Click to Close)'
                                    : 'Closed (Click to Open)'}
                                </button>
                              </td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditProductModal(product)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#F0D9E3] hover:border-[#E8005F] text-[13px] font-medium tracking-[0.1em] uppercase text-[#222222] transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#E8005F]" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void setProductActive(product.id, !product.active)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#F0D9E3] hover:border-[#52005C] text-[13px] font-medium tracking-[0.1em] uppercase text-[#52005C] transition-colors cursor-pointer"
                                  >
                                    <span>{product.active ? 'Deactivate' : 'Reactivate'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ORDERS MANAGER TAB */}
          {activeTab === 'orders' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                  Fulfilment
                </p>
                <h2 className="font-display text-3xl font-medium text-[#222222]">
                  Orders Manager ({orders.length})
                </h2>
                <p className="mt-1.5 text-base text-[#555555]">
                  Update order statuses as stock arrives, balances are settled, and deliveries go
                  out.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#52005C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order number or customer..."
                    className="w-full h-11 pl-10 pr-4 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none bg-white text-base"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  aria-label="Filter orders by status"
                  className="h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none bg-white text-base text-[#222222]"
                >
                  <option value="all">All Statuses</option>
                  {ORDER_STATUS_STEPS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white border border-[#F0D9E3] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF7F9] text-[13px] font-medium tracking-[0.11em] uppercase text-[#666666] border-b border-[#F0D9E3]">
                      <tr>
                        <th className="px-6 py-3.5">Order and Date</th>
                        <th className="px-6 py-3.5">Customer and WhatsApp</th>
                        <th className="px-6 py-3.5 text-right">Full Total</th>
                        <th className="px-6 py-3.5 text-right">Paid Upfront</th>
                        <th className="px-6 py-3.5 text-right">Balance Due</th>
                        <th className="px-6 py-3.5">Status Control</th>
                        <th className="px-6 py-3.5 text-right">Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE5EA]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-base text-[#555555]">
                            No orders match the current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-[#FFF1F6]/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-medium text-[#222222] tabular-nums">
                                {order.orderNumber}
                              </p>
                              <p className="text-sm text-[#666666]">
                                {formatArrivalDate(order.createdAt)}
                              </p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="font-medium text-[#222222]">{order.customerName}</p>
                              <p className="text-sm text-[#666666]">{order.customerWhatsApp}</p>
                            </td>
                            <td className="px-6 py-4 text-right text-base font-medium text-[#222222] tabular-nums whitespace-nowrap">
                              {formatNaira(order.fullTotalNaira)}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <p className="text-base font-medium text-[#E8005F] tabular-nums">
                                {formatNaira(order.depositPaidNaira)}
                              </p>
                              <p className="text-sm text-[#666666]">
                                {order.depositPercentageApplied}% upfront
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <p className="text-base font-medium text-[#52005C] tabular-nums">
                                {formatNaira(order.balanceRemainingNaira)}
                              </p>
                              {order.balanceRemainingNaira === 0 && (
                                <p className="text-sm text-[#52005C]">Paid in full</p>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                aria-label={`Change status for ${order.orderNumber}`}
                                value={order.status}
                                onChange={(e) =>
                                  void updateOrderStatus(order.id, e.target.value as OrderStatus)
                                }
                                className="h-9 px-2.5 border border-[#F0D9E3] bg-white text-sm text-[#222222] focus:border-[#E8005F] focus:outline-none"
                              >
                                {ORDER_STATUS_STEPS.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setInspectingOrder(order)}
                                className="text-[13px] font-medium tracking-[0.1em] uppercase text-[#E8005F] hover:text-[#52005C] cursor-pointer"
                              >
                                View ({order.items.length})
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* PAYMENTS LIST TAB */}
          {activeTab === 'payments' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                  Accounts
                </p>
                <h2 className="font-display text-3xl font-medium text-[#222222]">
                  Payments Ledger
                </h2>
                <p className="mt-1.5 text-base text-[#555555]">
                  Every deposit and balance payment recorded per pre-order.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-[#F0D9E3]">
                <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#666666]">
                    Total Upfront Collected
                  </p>
                  <p className="mt-2 font-display text-3xl font-medium text-[#E8005F] tabular-nums">
                    {formatNaira(totalDepositsReceived)}
                  </p>
                </div>
                <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#666666]">
                    Total Balances Collected
                  </p>
                  <p className="mt-2 font-display text-3xl font-medium text-[#52005C] tabular-nums">
                    {formatNaira(totalBalancesReceived)}
                  </p>
                </div>
                <div className="bg-[#FFF1F6] border-r border-b border-[#F0D9E3] p-6">
                  <p className="text-[13px] font-medium tracking-[0.13em] uppercase text-[#E8005F]">
                    Total Revenue Received
                  </p>
                  <p className="mt-2 font-display text-3xl font-medium text-[#222222] tabular-nums">
                    {formatNaira(totalDepositsReceived + totalBalancesReceived)}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#F0D9E3] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF7F9] text-[13px] font-medium tracking-[0.11em] uppercase text-[#666666] border-b border-[#F0D9E3]">
                      <tr>
                        <th className="px-6 py-3.5">Reference</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Order</th>
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-6 py-3.5">Payment Type</th>
                        <th className="px-6 py-3.5 text-right">Amount</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE5EA]">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-base text-[#555555]">
                            No payment records have been logged yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-[#FFF1F6]/50">
                            <td className="px-6 py-4 font-mono text-sm text-[#4A4A4A] whitespace-nowrap">
                              {pay.reference}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#666666] whitespace-nowrap">
                              {formatArrivalDate(pay.date)}
                            </td>
                            <td className="px-6 py-4 font-medium text-[#222222] tabular-nums whitespace-nowrap">
                              {pay.orderNumber}
                            </td>
                            <td className="px-6 py-4 text-[#4A4A4A] whitespace-nowrap">
                              {pay.customerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-sm font-medium ${
                                  pay.type === 'Balance' ? 'text-[#52005C]' : 'text-[#E8005F]'
                                }`}
                              >
                                {pay.type === 'Full Payment' ? 'Full Payment' : `${pay.type} Payment`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-base font-medium text-[#222222] tabular-nums whitespace-nowrap">
                              {formatNaira(pay.amountNaira)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-[#52005C] whitespace-nowrap capitalize">
                              {pay.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-[#F0D9E3] p-6 sm:p-10 max-w-3xl">
              <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                Configuration
              </p>
              <h2 className="font-display text-3xl font-medium text-[#222222] mb-2">
                Store Settings
              </h2>
              <p className="text-base text-[#555555] mb-8 leading-relaxed">
                Adjust the default upfront payment option, Nigerian delivery zone fees, and your
                official WhatsApp support number. Changes update the storefront immediately.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <p className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-2">
                      Default Upfront Payment Option
                    </p>
                    <div
                      role="radiogroup"
                      aria-label="Default upfront payment option"
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {settings.upfrontOptions.map((pct) => {
                        const selected = defaultUpfrontPct === pct;
                        return (
                          <label
                            key={pct}
                            className={`flex items-center justify-between gap-2 px-4 py-3 border-2 transition-colors cursor-pointer ${
                              selected
                                ? 'border-[#E8005F] bg-[#FFF1F6] text-[#E8005F]'
                                : 'border-[#F0D9E3] bg-white text-[#222222] hover:border-[#52005C]'
                            }`}
                          >
                            <input
                              type="radio"
                              name="defaultUpfrontPct"
                              value={pct}
                              checked={selected}
                              onChange={() => setDefaultUpfrontPct(pct)}
                              className="sr-only"
                            />
                            <span className="text-base font-medium">
                              {pct === 100 ? '100% (Pay in full)' : `${pct}% upfront`}
                            </span>
                            <span
                              aria-hidden="true"
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                selected
                                  ? 'border-[#E8005F] bg-[#E8005F]'
                                  : 'border-[#C9B3BF] bg-white'
                              }`}
                            >
                              {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-sm text-[#666666]">
                      Customers can choose 50%, 75%, or 100% (Pay in full) at checkout. Default is
                      50 percent.
                    </p>
                  </div>

                  <div className="max-w-sm">
                    <label
                      htmlFor="set-whatsapp"
                      className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-2"
                    >
                      Store WhatsApp Number
                    </label>
                    <input
                      id="set-whatsapp"
                      type="text"
                      required
                      value={whatsAppNumber}
                      onChange={(e) => setWhatsAppNumber(e.target.value)}
                      className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                    />
                    <p className="mt-1.5 text-sm text-[#666666]">Include country code, e.g. +234.</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#EFE5EA]">
                  <h3 className="font-display text-xl font-medium text-[#222222] mb-4">
                    Delivery Fees by Zone (₦)
                  </h3>
                  <div className="divide-y divide-[#EFE5EA] border border-[#F0D9E3]">
                    {feeRows.map((zone) => (
                      <div
                        key={zone.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF7F9]"
                      >
                        <div>
                          <p className="text-base font-medium text-[#222222]">{zone.label}</p>
                          <p className="text-sm text-[#666666] mt-0.5">{zone.estimatedDays}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-base font-medium text-[#666666]">₦</span>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            aria-label={`Delivery fee for ${zone.label}`}
                            value={zone.feeNaira}
                            onChange={(e) => handleFeeChange(zone.id, e.target.value)}
                            className="w-28 h-10 px-3 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none bg-white text-base font-medium text-[#222222] tabular-nums"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-5 text-base text-[#4A4A4A] leading-relaxed">
                  <strong className="font-medium text-[#52005C]">Payment Records Note:</strong>{' '}
                  Upfront payment options ({settings.upfrontOptions.join('%, ')}%) are read from
                  your Supabase store settings table. Checkout payments are currently saved as
                  simulated payment records until live payment verification is connected.
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-8 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.16em] uppercase transition-colors cursor-pointer"
                >
                  {savingSettings ? 'Saving Settings...' : 'Save Store Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#222222]/55 flex items-center justify-center p-4">
          <div className="bg-white border border-[#F0D9E3] w-full max-w-xl max-h-[90vh] overflow-y-auto p-7">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EFE5EA]">
              <h3 className="font-display text-2xl font-medium text-[#222222]">
                {editingProductId ? 'Edit Pre-Order Product' : 'Add New Pre-Order Product'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 hover:bg-[#FFF1F6] text-[#666666] hover:text-[#E8005F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-6 space-y-5">
              <div>
                <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. Digital Rice Cooker 5L"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                    Category
                  </label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full h-11 px-3 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none bg-white text-base"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                    Price in Naira (₦)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                    Expected Arrival Date
                  </label>
                  <input
                    type="date"
                    required
                    value={prodArrival}
                    onChange={(e) => setProdArrival(e.target.value)}
                    className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    value={prodBatch}
                    onChange={(e) => setProdBatch(e.target.value)}
                    placeholder="TAB-114"
                    className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                  Short Summary
                </label>
                <input
                  type="text"
                  value={prodSummary}
                  onChange={(e) => setProdSummary(e.target.value)}
                  placeholder="One clean sentence describing the item"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-1.5">
                  Full Description
                </label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full p-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                />
              </div>

              {/* Product Pictures (Required) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222]">
                    Product Pictures <span className="text-[#E8005F]">*</span>
                  </label>
                  <span className="text-sm text-[#666666]">
                    {prodImages.length} {prodImages.length === 1 ? 'picture' : 'pictures'} attached
                  </span>
                </div>

                <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileInputRef}
                      id="product-picture-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileUpload}
                      className="sr-only"
                    />
                    <label
                      htmlFor="product-picture-upload"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#52005C] hover:bg-[#3D0045] text-white text-[13px] font-medium tracking-[0.12em] uppercase transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Picture</span>
                    </label>
                    <span className="text-sm text-[#555555]">
                      JPG, PNG, or WebP. At least one picture is required.
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={prodImageUrlInput}
                      onChange={(e) => setProdImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddImageUrl();
                        }
                      }}
                      placeholder="Or paste an image URL (https://...)"
                      className="flex-1 h-10 px-3 bg-white border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-sm text-[#222222]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="inline-flex items-center justify-center gap-1.5 px-4 h-10 border border-[#52005C] text-[#52005C] hover:bg-[#52005C] hover:text-white text-[13px] font-medium tracking-[0.1em] uppercase transition-colors cursor-pointer shrink-0"
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>Add URL</span>
                    </button>
                  </div>

                  {prodImages.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-1">
                      {prodImages.map((imgSrc, idx) => (
                        <div
                          key={`${idx}-${imgSrc.slice(0, 32)}`}
                          className="relative group aspect-square bg-white border border-[#F0D9E3] overflow-hidden"
                        >
                          <ProductImage
                            src={imgSrc}
                            alt={`Product picture ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 0 && (
                            <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 bg-[#E8005F] text-white text-[11px] font-semibold uppercase tracking-[0.08em]">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            aria-label={`Remove picture ${idx + 1}`}
                            className="absolute right-1.5 top-1.5 w-7 h-7 bg-[#222222]/80 hover:bg-[#E8005F] text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#52005C] font-medium">
                      No product pictures attached yet. Upload a photo or add an image URL to save
                      this product.
                    </p>
                  )}
                </div>

                {prodImageError && (
                  <p
                    role="alert"
                    className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3"
                  >
                    {prodImageError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-base text-[#222222] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodOpen}
                    onChange={(e) => setProdOpen(e.target.checked)}
                    className="w-4 h-4 accent-[#E8005F]"
                  />
                  <span>Pre-Order Open</span>
                </label>

                <label className="inline-flex items-center gap-2 text-base text-[#222222] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#E8005F]"
                  />
                  <span>Feature on Home Page</span>
                </label>
              </div>

              <div className="pt-5 border-t border-[#EFE5EA] flex justify-end gap-3">
                <button
                  type="button"
                  disabled={savingProduct}
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 border border-[#F0D9E3] hover:border-[#52005C] disabled:opacity-60 text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.13em] uppercase cursor-pointer"
                >
                  {savingProduct
                    ? 'Saving & Uploading...'
                    : editingProductId
                      ? 'Save Changes'
                      : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Order Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-[#222222]/55 flex items-center justify-center p-4">
          <div className="bg-white border border-[#F0D9E3] w-full max-w-lg max-h-[85vh] overflow-y-auto p-7 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE5EA]">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#222222] tabular-nums">
                  Order {inspectingOrder.orderNumber}
                </h3>
                <p className="text-sm text-[#666666] mt-0.5">
                  {inspectingOrder.customerName} · {inspectingOrder.customerWhatsApp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                aria-label="Close order detail"
                className="p-1.5 hover:bg-[#FFF1F6] text-[#666666] hover:text-[#E8005F] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF7F9] border border-[#F0D9E3] p-4 space-y-1.5">
              <p className="text-[12px] font-semibold tracking-[0.16em] uppercase text-[#52005C]">
                Delivery Address
              </p>
              {inspectingOrder.deliveryAddress ||
              inspectingOrder.deliveryCity ||
              inspectingOrder.deliveryState ||
              inspectingOrder.deliveryNote ? (
                <div className="text-base text-[#222222] space-y-1">
                  {inspectingOrder.deliveryAddress && (
                    <p className="leading-relaxed">{inspectingOrder.deliveryAddress}</p>
                  )}
                  {(inspectingOrder.deliveryCity || inspectingOrder.deliveryState) && (
                    <p className="text-sm font-medium text-[#4A4A4A]">
                      {[inspectingOrder.deliveryCity, inspectingOrder.deliveryState]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {inspectingOrder.deliveryNote && (
                    <p className="text-sm text-[#666666] pt-1 border-t border-[#EFE5EA]">
                      <strong className="font-medium text-[#222222]">Landmark / Note:</strong>{' '}
                      {inspectingOrder.deliveryNote}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#666666]">
                  No delivery address saved for this order.
                </p>
              )}
            </div>

            <div className="text-base space-y-1.5 text-[#4A4A4A]">
              <p>
                <strong className="font-medium text-[#222222]">Upfront Option:</strong>{' '}
                {inspectingOrder.depositPercentageApplied === 100
                  ? '100% upfront (Paid in full)'
                  : `${inspectingOrder.depositPercentageApplied}% upfront`}
              </p>
              <p>
                <strong className="font-medium text-[#222222]">Expected Arrival:</strong>{' '}
                {formatArrivalDate(inspectingOrder.expectedArrivalDate)}
              </p>
              <p>
                <strong className="font-medium text-[#222222]">Status:</strong>{' '}
                {inspectingOrder.status}
              </p>
            </div>

            <ul className="divide-y divide-[#EFE5EA] border-t border-b border-[#EFE5EA]">
              {inspectingOrder.items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantLabel ?? 'default'}`}
                  className="py-3 flex items-center justify-between gap-3 text-base"
                >
                  <span className="text-[#222222]">
                    {item.productName}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''} x {item.quantity}
                  </span>
                  <span className="font-medium text-[#222222] tabular-nums shrink-0">
                    {formatNaira(item.unitPriceNaira * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-[#F0D9E3] text-sm">
              <div className="bg-white border-r border-b border-[#F0D9E3] p-3.5">
                <p className="text-[13px] tracking-[0.08em] uppercase text-[#666666]">Full Total</p>
                <p className="mt-1 font-medium text-base text-[#222222] tabular-nums">
                  {formatNaira(inspectingOrder.fullTotalNaira)}
                </p>
              </div>
              <div className="bg-[#FFF1F6] border-r border-b border-[#F0D9E3] p-3.5">
                <p className="text-[13px] tracking-[0.08em] uppercase text-[#E8005F]">
                  Paid ({inspectingOrder.depositPercentageApplied}%)
                </p>
                <p className="mt-1 font-medium text-base text-[#E8005F] tabular-nums">
                  {formatNaira(inspectingOrder.depositPaidNaira)}
                </p>
              </div>
              <div className="bg-white border-r border-b border-[#F0D9E3] p-3.5">
                <p className="text-[13px] tracking-[0.08em] uppercase text-[#52005C]">
                  Balance Due
                </p>
                <p className="mt-1 font-medium text-base text-[#52005C] tabular-nums">
                  {formatNaira(inspectingOrder.balanceRemainingNaira)}
                </p>
                {inspectingOrder.balanceRemainingNaira === 0 && (
                  <p className="mt-0.5 text-sm text-[#52005C]">Paid in full</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
