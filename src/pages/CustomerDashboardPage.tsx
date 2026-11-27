import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  CreditCard,
  LogOut,
  MessageCircle,
  Package,
  Search,
  User,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  calculateDepositAndBalance,
  formatArrivalDate,
  formatNaira,
  ORDER_STATUS_STEPS,
  Order,
} from '../data/storeData';
import { ProductImage } from '../components/ProductImage';
import { BackButton } from '../components/BackButton';
import {
  cleanupFlutterwaveDom,
  loadFlutterwaveScript,
  openFlutterwaveCheckout,
  verifyFlutterwavePayment,
} from '../services/flutterwave';

interface OrderPaymentNotice {
  orderId: string;
  tone: 'verified' | 'pending' | 'awaiting' | 'error';
  message: string;
  reference?: string;
}

interface CustomerDashboardPageProps {
  initialTab?: 'orders' | 'details';
  initialOrderId?: string;
}

export const CustomerDashboardPage: React.FC<CustomerDashboardPageProps> = ({
  initialTab = 'orders',
  initialOrderId,
}) => {
  const {
    currentCustomer,
    authLoading,
    orders,
    ordersLoading,
    navigate,
    logoutCustomer,
    payOrderBalance,
    refreshOrderById,
    refreshOrdersAndPayments,
    lookupOrderByNumber,
    updateCustomerDetails,
    getWhatsAppUrl,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'details'>(initialTab);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId ?? null);
  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<Order | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [payingLabel, setPayingLabel] = useState('');
  const [paymentNotice, setPaymentNotice] = useState<OrderPaymentNotice | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const [name, setName] = useState(currentCustomer?.name ?? '');
  const [whatsApp, setWhatsApp] = useState(currentCustomer?.whatsApp ?? '');
  const [email, setEmail] = useState(currentCustomer?.email ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState(currentCustomer?.deliveryAddress ?? '');

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    setSelectedOrderId(initialOrderId ?? null);
  }, [initialOrderId]);

  React.useEffect(() => {
    if (currentCustomer) {
      setName(currentCustomer.name);
      setWhatsApp(currentCustomer.whatsApp);
      setEmail(currentCustomer.email);
      setDeliveryAddress(currentCustomer.deliveryAddress);
      void loadFlutterwaveScript().catch(() => {
        // Preload is best-effort; errors are surfaced when the customer clicks Pay
      });
    }
  }, [currentCustomer]);

  if (authLoading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center text-base text-[#555555]">
        Loading your account...
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 sm:py-20">
        <div className="mb-8">
          <BackButton fallback={{ page: 'home' }} />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase text-[#52005C] mb-3">
            Account Access
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222]">
            Please sign in to view your dashboard
          </h1>
          <p className="mt-3 text-base text-[#555555] leading-relaxed">
            Sign in with your customer email and password to see your orders and remaining balances.
          </p>
          <button
            type="button"
            onClick={() => navigate({ page: 'login' })}
            className="mt-8 px-8 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] font-medium tracking-[0.16em] uppercase transition-colors cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const myOrders = orders.filter(
    (o) =>
      o.customerId === currentCustomer.id ||
      o.customerEmail.toLowerCase() === currentCustomer.email.toLowerCase()
  );

  const selectedOrder: Order | undefined =
    myOrders.find((o) => o.id === selectedOrderId) ??
    (lookupResult && lookupResult.id === selectedOrderId ? lookupResult : undefined);

  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookupBusy(true);
    try {
      const res = await lookupOrderByNumber(lookupInput);
      if (!res.ok || !res.order) {
        setLookupError(res.error ?? 'Order not found.');
        return;
      }
      setLookupResult(res.order);
      setSelectedOrderId(res.order.id);
      navigate({ page: 'account', tab: 'orders', orderId: res.order.id });
    } finally {
      setLookupBusy(false);
    }
  };

  const handlePayBalance = async (orderId: string) => {
    if (payingOrderId) return;
    setPayingOrderId(orderId);
    setPayingLabel('Preparing Flutterwave...');
    setPaymentNotice(null);
    try {
      const prep = await payOrderBalance(orderId);
      if (!prep.ok || !prep.order || !prep.paymentRef || prep.amount === undefined) {
        setPaymentNotice({
          orderId,
          tone: 'error',
          message: prep.error ?? 'Could not initiate Flutterwave payment. Please try again.',
        });
        return;
      }

      const targetOrder = prep.order;
      const description =
        prep.kind === 'balance'
          ? `Balance payment for order ${targetOrder.orderNumber}`
          : targetOrder.depositPercentageApplied === 100
            ? `Full payment for order ${targetOrder.orderNumber}`
            : `Deposit for order ${targetOrder.orderNumber}`;

      setPayingLabel('Opening Flutterwave...');
      const modalOutcome = await openFlutterwaveCheckout({
        tx_ref: prep.paymentRef,
        amount: prep.amount,
        customer: {
          email: targetOrder.customerEmail || currentCustomer.email,
          name: targetOrder.customerName || currentCustomer.name,
          phone: targetOrder.customerWhatsApp || currentCustomer.whatsApp,
        },
        description,
      });

      if (modalOutcome.status === 'load_error') {
        setPaymentNotice({
          orderId,
          tone: 'error',
          message: modalOutcome.error,
          reference: prep.paymentRef,
        });
        return;
      }

      if (modalOutcome.status === 'closed') {
        setPaymentNotice({
          orderId,
          tone: 'awaiting',
          message:
            prep.kind === 'balance'
              ? `Flutterwave checkout closed before completion. Your remaining balance for order ${targetOrder.orderNumber} is still awaiting payment, and you can retry anytime.`
              : `Flutterwave checkout closed before completion. Order ${targetOrder.orderNumber} is still awaiting payment, and you can retry anytime.`,
          reference: prep.paymentRef,
        });
        return;
      }

      setPayingLabel('Confirming payment...');
      const verified = await verifyFlutterwavePayment({
        transaction_id: modalOutcome.transaction_id,
        reference: prep.paymentRef,
      });

      if (verified) {
        const refreshedOrder = await refreshOrderById(orderId);
        if (refreshedOrder && lookupResult && lookupResult.id === refreshedOrder.id) {
          setLookupResult(refreshedOrder);
        }
        setSelectedOrderId(orderId);
        setPaymentNotice({
          orderId,
          tone: 'verified',
          message:
            prep.kind === 'balance'
              ? `Payment confirmed via Flutterwave for order ${targetOrder.orderNumber}. Your order receipt has been refreshed from the database.`
              : `Payment confirmed via Flutterwave for order ${targetOrder.orderNumber}. Your order status has been refreshed from the database.`,
          reference: prep.paymentRef,
        });
        return;
      }

      await refreshOrdersAndPayments();
      setSelectedOrderId(orderId);
      setPaymentNotice({
        orderId,
        tone: 'pending',
        message: 'We are confirming your payment, this can take a few minutes',
        reference: prep.paymentRef,
      });
    } catch (err) {
      cleanupFlutterwaveDom({ removePreload: true });
      setPaymentNotice({
        orderId,
        tone: 'error',
        message:
          err instanceof Error && err.message
            ? err.message
            : 'The Flutterwave payment window did not start. Your order is still awaiting payment, and you can try again.',
      });
    } finally {
      setPayingOrderId(null);
      setPayingLabel('');
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await updateCustomerDetails({ name, whatsApp, email, deliveryAddress });
    } finally {
      setSavingDetails(false);
    }
  };

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
      <div className="mb-5">
        <BackButton fallback={{ page: 'home' }} />
      </div>
      {/* Top Header */}
      <div className="bg-[#FFF1F6] border border-[#F0D9E3] px-5 sm:px-10 py-7 sm:py-10 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[13px] font-medium tracking-[0.2em] uppercase text-[#52005C] mb-2">
            Customer Account
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222] break-words">
            Welcome, {currentCustomer.name}
          </h1>
          <p className="mt-2 text-base text-[#4A4A4A] break-words">
            {currentCustomer.email} · WhatsApp {currentCustomer.whatsApp}
          </p>
        </div>

        <button
          type="button"
          onClick={logoutCustomer}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#F0D9E3] hover:border-[#E8005F] text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] whitespace-nowrap self-start sm:self-auto transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-[#E8005F]" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-b border-[#F0D9E3] mb-10">
        <button
          type="button"
          onClick={() => {
            setActiveTab('orders');
            setSelectedOrderId(null);
            navigate({ page: 'account', tab: 'orders' });
          }}
          className={`inline-flex items-center gap-2 pb-3.5 text-[13px] font-medium tracking-[0.14em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'orders'
              ? 'border-[#E8005F] text-[#E8005F]'
              : 'border-transparent text-[#666666] hover:text-[#222222]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Orders ({myOrders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('details');
            setSelectedOrderId(null);
            navigate({ page: 'account', tab: 'details' });
          }}
          className={`inline-flex items-center gap-2 pb-3.5 text-[13px] font-medium tracking-[0.14em] uppercase border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'details'
              ? 'border-[#E8005F] text-[#E8005F]'
              : 'border-transparent text-[#666666] hover:text-[#222222]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>My Details</span>
        </button>
      </div>

      {/* Tab 1: My Orders & Order Detail */}
      {activeTab === 'orders' && (
        <>
          {selectedOrder ? (
            <div className="space-y-8">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  navigate({ page: 'account', tab: 'orders' });
                }}
                className="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.13em] uppercase text-[#E8005F] hover:text-[#52005C] cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to all my orders</span>
              </button>

              {/* Order Detail Sheet */}
              <div className="bg-white border border-[#F0D9E3] p-6 sm:p-10 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#EFE5EA]">
                  <div>
                    <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C]">
                      Placed on {formatArrivalDate(selectedOrder.createdAt)}
                    </p>
                    <h2 className="font-display text-3xl font-medium text-[#222222] mt-1 tabular-nums">
                      Order {selectedOrder.orderNumber}
                    </h2>
                    <p className="mt-2.5 text-base text-[#555555] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#E8005F] shrink-0" />
                      <span>
                        Expected Arrival Date:{' '}
                        <strong className="font-medium text-[#222222]">
                          {formatArrivalDate(selectedOrder.expectedArrivalDate)}
                        </strong>
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {(() => {
                      const isAwaitingInitial =
                        selectedOrder.status === 'Awaiting payment' ||
                        selectedOrder.depositPaidNaira <= 0;
                      const retryUpfrontAmount = calculateDepositAndBalance(
                        selectedOrder.fullTotalNaira,
                        selectedOrder.depositPercentageApplied
                      ).deposit;
                      const amountDueNow = isAwaitingInitial
                        ? retryUpfrontAmount
                        : selectedOrder.balanceRemainingNaira;

                      if (amountDueNow <= 0) return null;

                      const buttonText = isAwaitingInitial
                        ? selectedOrder.depositPercentageApplied === 100
                          ? `Pay in Full with Flutterwave (${formatNaira(amountDueNow)})`
                          : `Pay ${selectedOrder.depositPercentageApplied}% with Flutterwave (${formatNaira(amountDueNow)})`
                        : `Pay Balance with Flutterwave (${formatNaira(amountDueNow)})`;

                      return (
                        <button
                          type="button"
                          disabled={payingOrderId !== null}
                          onClick={() => void handlePayBalance(selectedOrder.id)}
                          className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 max-w-full bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.14em] uppercase transition-colors text-center sm:whitespace-nowrap cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4 text-white shrink-0" />
                          <span>
                            {payingOrderId === selectedOrder.id
                              ? payingLabel || 'Opening Flutterwave...'
                              : buttonText}
                          </span>
                        </button>
                      );
                    })()}

                    <a
                      href={getWhatsAppUrl(
                        `Hello Tabsah, I am checking on my order ${selectedOrder.orderNumber}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#52005C] hover:bg-[#3D0045] text-white text-[13px] font-medium tracking-[0.14em] uppercase whitespace-nowrap transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-white" />
                      <span>Order Support</span>
                    </a>
                  </div>
                </div>

                {paymentNotice && paymentNotice.orderId === selectedOrder.id && (
                  <div
                    role="status"
                    className={`p-5 border flex items-start gap-3.5 text-base leading-relaxed ${
                      paymentNotice.tone === 'verified'
                        ? 'bg-[#FFF1F6] border-[#E8005F] text-[#222222]'
                        : paymentNotice.tone === 'error'
                          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                          : 'bg-[#FAF7F9] border-[#52005C] text-[#222222]'
                    }`}
                  >
                    {paymentNotice.tone === 'verified' ? (
                      <Check className="w-5 h-5 text-[#E8005F] shrink-0 mt-0.5" />
                    ) : paymentNotice.tone === 'pending' ? (
                      <Clock className="w-5 h-5 text-[#52005C] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-[#E8005F] shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">{paymentNotice.message}</p>
                      {paymentNotice.reference && (
                        <p className="text-sm text-[#666666]">
                          Flutterwave Reference:{' '}
                          <span className="font-mono text-[#222222]">{paymentNotice.reference}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 5-Stage Order Status Line */}
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
                    <h3 className="font-display text-2xl font-medium text-[#222222]">
                      Order Status Progress
                    </h3>
                    <span className="text-[13px] font-medium tracking-[0.11em] uppercase text-[#E8005F]">
                      Current: {selectedOrder.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 border-t border-l border-[#F0D9E3]">
                    {ORDER_STATUS_STEPS.map((stepLabel, idx) => {
                      const currentIdx = ORDER_STATUS_STEPS.indexOf(selectedOrder.status);
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={stepLabel}
                          className={`border-r border-b border-[#F0D9E3] p-4 flex flex-col gap-3 ${
                            isCurrent
                              ? 'bg-[#FFF1F6]'
                              : isCompleted
                              ? 'bg-white'
                              : 'bg-[#FAF7F9]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-medium tracking-[0.16em] uppercase text-[#666666]">
                              0{idx + 1}
                            </span>
                            <span
                              className={`w-6 h-6 flex items-center justify-center text-[13px] font-medium shrink-0 ${
                                isCompleted || isCurrent
                                  ? 'bg-[#E8005F] text-white'
                                  : 'border border-[#F0D9E3] text-[#7A7A7A]'
                              }`}
                            >
                              {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </span>
                          </div>
                          <p
                            className={`text-sm leading-snug ${
                              isCurrent
                                ? 'font-medium text-[#222222]'
                                : isCompleted
                                ? 'text-[#222222]'
                                : 'text-[#7A7A7A]'
                            }`}
                          >
                            {stepLabel}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-[#F0D9E3]">
                  <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                    <p className="text-[13px] font-medium tracking-[0.16em] uppercase text-[#666666]">
                      Full Order Total
                    </p>
                    <p className="mt-2 font-display text-3xl font-medium text-[#222222] tabular-nums">
                      {formatNaira(selectedOrder.fullTotalNaira)}
                    </p>
                    <p className="mt-1.5 text-sm text-[#666666] tabular-nums">
                      Includes {formatNaira(selectedOrder.deliveryFeeNaira)} delivery fee
                    </p>
                  </div>

                  <div className="bg-[#FFF1F6] border-r border-b border-[#F0D9E3] p-6">
                    <p className="text-[13px] font-medium tracking-[0.16em] uppercase text-[#E8005F]">
                      {selectedOrder.depositPaidNaira <= 0 ||
                      selectedOrder.status === 'Awaiting payment'
                        ? 'Paid So Far'
                        : selectedOrder.depositPercentageApplied === 100
                          ? 'Paid in Full (100%)'
                          : `Paid Upfront (${selectedOrder.depositPercentageApplied}%)`}
                    </p>
                    <p className="mt-2 font-display text-3xl font-medium text-[#E8005F] tabular-nums">
                      {formatNaira(selectedOrder.depositPaidNaira)}
                    </p>
                    <p className="mt-1.5 text-sm text-[#4A4A4A]">
                      {selectedOrder.depositPaidNaira <= 0 ||
                      selectedOrder.status === 'Awaiting payment'
                        ? 'Awaiting payment confirmation'
                        : selectedOrder.depositPercentageApplied === 100
                          ? '100% upfront (Paid in full)'
                          : `${selectedOrder.depositPercentageApplied}% upfront payment confirmed`}
                    </p>
                  </div>

                  <div className="bg-white border-r border-b border-[#F0D9E3] p-6">
                    <p className="text-[13px] font-medium tracking-[0.16em] uppercase text-[#52005C]">
                      Balance Remaining
                    </p>
                    <p className="mt-2 font-display text-3xl font-medium text-[#52005C] tabular-nums">
                      {formatNaira(selectedOrder.balanceRemainingNaira)}
                    </p>
                    <p className="mt-1.5 text-sm text-[#666666]">
                      {selectedOrder.balanceRemainingNaira === 0
                        ? 'Balance due ₦0 · Paid in full'
                        : selectedOrder.status === 'Awaiting payment'
                          ? 'Awaiting upfront payment'
                          : 'Due before dispatch'}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="font-display text-2xl font-medium text-[#222222] mb-5">
                    Items in This Order
                  </h3>
                  <div className="divide-y divide-[#EFE5EA] border-t border-b border-[#EFE5EA]">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={`${item.productId}-${item.variantLabel ?? 'default'}`}
                        className="py-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                          <div className="w-16 h-16 sm:w-18 sm:h-18 overflow-hidden bg-[#F8F5F7] shrink-0">
                            <ProductImage
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-display text-xl font-medium text-[#222222] break-words">
                              {item.productName}
                            </p>
                            {item.variantLabel && (
                              <p className="text-sm font-medium text-[#52005C] mt-0.5">
                                Option: {item.variantLabel}
                              </p>
                            )}
                            <p className="text-sm text-[#666666] mt-0.5 tabular-nums">
                              Qty {item.quantity} · {formatNaira(item.unitPriceNaira)} each
                            </p>
                            <p className="text-sm text-[#E8005F] mt-1">
                              Expected arrival: {formatArrivalDate(item.expectedArrivalDate)}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium text-base text-[#222222] tabular-nums shrink-0">
                          {formatNaira(item.unitPriceNaira * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-[#FAF7F9] border border-[#F0D9E3] p-6 text-base text-[#4A4A4A] grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[13px] font-medium tracking-[0.16em] uppercase text-[#52005C] mb-2">
                      Delivery Address
                    </p>
                    {selectedOrder.deliveryAddress ||
                    selectedOrder.deliveryCity ||
                    selectedOrder.deliveryState ||
                    selectedOrder.deliveryNote ? (
                      <div className="space-y-1">
                        {selectedOrder.deliveryAddress && (
                          <p className="leading-relaxed text-[#222222]">
                            {selectedOrder.deliveryAddress}
                          </p>
                        )}
                        {(selectedOrder.deliveryCity || selectedOrder.deliveryState) && (
                          <p className="text-sm font-medium text-[#4A4A4A]">
                            {[selectedOrder.deliveryCity, selectedOrder.deliveryState]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                        {selectedOrder.deliveryNote && (
                          <p className="text-sm text-[#666666] pt-1">
                            <strong className="font-medium text-[#222222]">
                              Landmark / Note:
                            </strong>{' '}
                            {selectedOrder.deliveryNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-[#666666]">
                        No delivery address saved for this order.
                      </p>
                    )}
                    <p className="text-sm text-[#666666] mt-2">
                      {selectedOrder.deliveryZoneLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium tracking-[0.16em] uppercase text-[#52005C] mb-2">
                      WhatsApp Contact
                    </p>
                    <p>{selectedOrder.customerWhatsApp}</p>
                    <p className="text-sm text-[#666666] mt-1.5">{selectedOrder.customerEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Order Lookup Bar */}
              <form
                onSubmit={handleLookupOrder}
                className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-[#FAF7F9] border border-[#F0D9E3] p-4"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#52005C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={lookupInput}
                    onChange={(e) => {
                      setLookupInput(e.target.value);
                      setLookupError('');
                    }}
                    placeholder="Look up an order by number (e.g. TB-2026-1044)"
                    aria-label="Look up an order by order number"
                    className="w-full h-11 pl-10 pr-4 bg-white border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base text-[#222222]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookupBusy}
                  className="px-6 h-11 bg-[#52005C] hover:bg-[#3D0045] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.14em] uppercase whitespace-nowrap transition-colors cursor-pointer"
                >
                  {lookupBusy ? 'Searching...' : 'Find Order'}
                </button>
              </form>

              {lookupError && (
                <p
                  role="alert"
                  className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3"
                >
                  {lookupError}
                </p>
              )}

              {paymentNotice && (
                <div
                  role="status"
                  className={`p-5 border flex items-start gap-3.5 text-base leading-relaxed ${
                    paymentNotice.tone === 'verified'
                      ? 'bg-[#FFF1F6] border-[#E8005F] text-[#222222]'
                      : paymentNotice.tone === 'error'
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                        : 'bg-[#FAF7F9] border-[#52005C] text-[#222222]'
                  }`}
                >
                  {paymentNotice.tone === 'verified' ? (
                    <Check className="w-5 h-5 text-[#E8005F] shrink-0 mt-0.5" />
                  ) : paymentNotice.tone === 'pending' ? (
                    <Clock className="w-5 h-5 text-[#52005C] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#E8005F] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-medium">{paymentNotice.message}</p>
                    {paymentNotice.reference && (
                      <p className="text-sm text-[#666666]">
                        Flutterwave Reference:{' '}
                        <span className="font-mono text-[#222222]">{paymentNotice.reference}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {ordersLoading ? (
                <div className="bg-[#FAF7F9] border border-[#F0D9E3] p-12 text-center text-base text-[#555555]">
                  Loading your orders...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="bg-[#FAF7F9] border border-[#F0D9E3] p-12 text-center">
                  <h2 className="font-display text-2xl font-medium text-[#222222]">
                    You have not placed a pre-order yet
                  </h2>
                  <p className="mt-2.5 text-base text-[#555555] max-w-md mx-auto leading-relaxed">
                    Once you reserve an item with a deposit, it will appear right here with live
                    arrival tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'shop' })}
                    className="mt-7 px-8 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] font-medium tracking-[0.16em] uppercase transition-colors cursor-pointer"
                  >
                    Explore Pre-Orders
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#F0D9E3] divide-y divide-[#F0D9E3]">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5 text-sm text-[#666666]">
                      <span className="font-display text-xl font-medium text-[#222222] tabular-nums">
                        {order.orderNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Placed {formatArrivalDate(order.createdAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#E8005F]">
                        Arrives {formatArrivalDate(order.expectedArrivalDate)}
                      </span>
                    </div>

                    <p className="text-base text-[#4A4A4A]">
                      {order.items
                        .map(
                          (i) =>
                            `${i.productName}${i.variantLabel ? ` [${i.variantLabel}]` : ''} (x${i.quantity})`
                        )
                        .join(', ')}
                    </p>

                    <p className="text-[13px] font-medium tracking-[0.12em] uppercase text-[#52005C]">
                      Status: {order.status} · {order.depositPercentageApplied}% upfront
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 lg:gap-8 w-full lg:w-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 text-sm w-full sm:w-auto">
                      <div>
                        <p className="text-[13px] tracking-[0.1em] uppercase text-[#666666]">
                          Full Total
                        </p>
                        <p className="mt-1 font-medium text-[#222222] text-base tabular-nums">
                          {formatNaira(order.fullTotalNaira)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] tracking-[0.1em] uppercase text-[#666666]">
                          {order.depositPaidNaira <= 0 || order.status === 'Awaiting payment'
                            ? 'Paid So Far'
                            : `Paid (${order.depositPercentageApplied}%)`}
                        </p>
                        <p className="mt-1 font-medium text-[#E8005F] text-base tabular-nums">
                          {formatNaira(order.depositPaidNaira)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] tracking-[0.1em] uppercase text-[#666666]">
                          Balance
                        </p>
                        <p className="mt-1 font-medium text-[#52005C] text-base tabular-nums">
                          {formatNaira(order.balanceRemainingNaira)}
                        </p>
                        {order.balanceRemainingNaira === 0 && (
                          <p className="text-sm text-[#52005C]">Paid in full</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      {(order.status === 'Awaiting payment' ||
                        order.depositPaidNaira <= 0 ||
                        order.balanceRemainingNaira > 0) && (
                        <button
                          type="button"
                          disabled={payingOrderId !== null}
                          onClick={() => void handlePayBalance(order.id)}
                          className="px-4 py-2.5 bg-[#52005C] hover:bg-[#3D0045] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-colors cursor-pointer"
                        >
                          {payingOrderId === order.id
                            ? payingLabel || 'Opening...'
                            : order.status === 'Awaiting payment' || order.depositPaidNaira <= 0
                              ? 'Pay with Flutterwave'
                              : 'Pay Balance'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          navigate({ page: 'account', tab: 'orders', orderId: order.id });
                        }}
                        className="px-5 py-2.5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Tab 2: My Details */}
      {activeTab === 'details' && (
        <div className="max-w-2xl bg-white border border-[#F0D9E3] p-6 sm:p-10">
          <p className="text-[13px] font-medium tracking-[0.18em] uppercase text-[#52005C] mb-2">
            Profile
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#222222] mb-2">
            My Contact and Delivery Details
          </h2>
          <p className="text-base text-[#555555] mb-8 leading-relaxed">
            Keep your WhatsApp number and Lagos or interstate delivery address up to date so we can
            reach you when your batch arrives.
          </p>

          <form onSubmit={handleSaveDetails} className="space-y-5">
            <div>
              <label
                htmlFor="det-name"
                className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-2"
              >
                Full Name
              </label>
              <input
                id="det-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="det-whatsapp"
                  className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-2"
                >
                  WhatsApp Number
                </label>
                <input
                  id="det-whatsapp"
                  type="tel"
                  required
                  value={whatsApp}
                  onChange={(e) => setWhatsApp(e.target.value)}
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                />
              </div>

              <div>
                <label
                  htmlFor="det-email"
                  className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-2"
                >
                  Email Address
                </label>
                <input
                  id="det-email"
                  type="email"
                  readOnly
                  value={email}
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-[#FAF7F9] text-[#666666] text-base focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="det-address"
                className="block text-[13px] font-medium tracking-[0.13em] uppercase text-[#222222] mb-2"
              >
                Saved Delivery Address
              </label>
              <textarea
                id="det-address"
                rows={3}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full p-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
              />
            </div>

            <button
              type="submit"
              disabled={savingDetails}
              className="px-8 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] font-medium tracking-[0.16em] uppercase transition-colors cursor-pointer"
            >
              {savingDetails ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
