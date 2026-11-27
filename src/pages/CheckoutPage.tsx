import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Clock, Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  calculateDepositAndBalance,
  formatArrivalDate,
  formatNaira,
  Order,
} from '../data/storeData';
import { BackButton } from '../components/BackButton';
import {
  cleanupFlutterwaveDom,
  loadFlutterwaveScript,
  openFlutterwaveCheckout,
  verifyFlutterwavePayment,
} from '../services/flutterwave';

type CheckoutPaymentState = 'verified' | 'pending' | 'awaiting_payment';

interface CheckoutReceiptState {
  order: Order;
  paymentState: CheckoutPaymentState;
  paymentRef: string;
  expectedPayNowNaira: number;
  notice?: string;
}

export const CheckoutPage: React.FC = () => {
  const {
    cartDetailedItems,
    cartSubtotal,
    currentCustomer,
    authLoading,
    settings,
    placeOrder,
    payOrderBalance,
    refreshOrderById,
    refreshOrdersAndPayments,
    navigate,
  } = useStore();

  const [name, setName] = useState(currentCustomer?.name ?? '');
  const [whatsApp, setWhatsApp] = useState(currentCustomer?.whatsApp ?? '');
  const [email, setEmail] = useState(currentCustomer?.email ?? '');
  const [deliveryZoneId, setDeliveryZoneId] = useState(settings.deliveryFees[0]?.id ?? 'lagos-island');
  const [deliveryAddress, setDeliveryAddress] = useState(currentCustomer?.deliveryAddress ?? '');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryState, setDeliveryState] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const firstCartUpfrontPct = cartDetailedItems[0]?.upfrontPercentage;
  const fallbackUpfrontPct = settings.upfrontOptions.includes(50)
    ? 50
    : settings.defaultUpfrontPercentage;
  const [upfrontPercentage, setUpfrontPercentage] = useState<number>(
    firstCartUpfrontPct ?? fallbackUpfrontPct
  );
  const hasUserChangedUpfrontRef = useRef(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingLabel, setSubmittingLabel] = useState('');
  const [checkoutReceipt, setCheckoutReceipt] = useState<CheckoutReceiptState | null>(null);

  useEffect(() => {
    void loadFlutterwaveScript().catch(() => {
      // Preload is best-effort; errors are surfaced when the customer clicks Pay
    });
  }, []);

  useEffect(() => {
    if (currentCustomer) {
      setName((prev) => prev || currentCustomer.name);
      setWhatsApp((prev) => prev || currentCustomer.whatsApp);
      setEmail((prev) => prev || currentCustomer.email);
      setDeliveryAddress((prev) => prev || currentCustomer.deliveryAddress);
    }
  }, [currentCustomer]);

  useEffect(() => {
    if (
      !hasUserChangedUpfrontRef.current &&
      firstCartUpfrontPct !== undefined &&
      settings.upfrontOptions.includes(firstCartUpfrontPct)
    ) {
      setUpfrontPercentage(firstCartUpfrontPct);
      return;
    }
    if (!settings.upfrontOptions.includes(upfrontPercentage)) {
      setUpfrontPercentage(fallbackUpfrontPct);
    }
  }, [fallbackUpfrontPct, firstCartUpfrontPct, settings.upfrontOptions, upfrontPercentage]);

  const selectedZone =
    settings.deliveryFees.find((z) => z.id === deliveryZoneId) ?? settings.deliveryFees[0];
  const deliveryFee = selectedZone ? selectedZone.feeNaira : 0;
  const fullTotal = cartSubtotal + deliveryFee;
  const { deposit: payNow, balance } = calculateDepositAndBalance(fullTotal, upfrontPercentage);
  const isPayInFull = upfrontPercentage === 100;

  const payButtonLabel = isPayInFull
    ? `Pay in Full with Flutterwave (${formatNaira(payNow)})`
    : `Pay ${upfrontPercentage}% Now with Flutterwave (${formatNaira(payNow)})`;

  const launchFlutterwaveForOrder = async (
    order: Order,
    paymentRef: string,
    amountNaira: number
  ) => {
    setSubmittingLabel('Opening Flutterwave...');
    const description =
      order.depositPercentageApplied === 100
        ? `Full payment for order ${order.orderNumber}`
        : `Deposit for order ${order.orderNumber}`;

    const modalOutcome = await openFlutterwaveCheckout({
      tx_ref: paymentRef,
      amount: amountNaira,
      customer: {
        email: order.customerEmail || currentCustomer?.email || '',
        name: order.customerName || currentCustomer?.name || 'Customer',
        phone: order.customerWhatsApp || currentCustomer?.whatsApp || '',
      },
      description,
    });

    if (modalOutcome.status === 'load_error') {
      setCheckoutReceipt({
        order,
        paymentState: 'awaiting_payment',
        paymentRef,
        expectedPayNowNaira: amountNaira,
        notice: modalOutcome.error,
      });
      return;
    }

    if (modalOutcome.status === 'closed') {
      await refreshOrdersAndPayments();
      setCheckoutReceipt({
        order,
        paymentState: 'awaiting_payment',
        paymentRef,
        expectedPayNowNaira: amountNaira,
      });
      return;
    }

    setSubmittingLabel('Confirming payment...');
    const verified = await verifyFlutterwavePayment({
      transaction_id: modalOutcome.transaction_id,
      reference: paymentRef,
    });

    if (verified) {
      const refreshedOrder = await refreshOrderById(order.id);
      setCheckoutReceipt({
        order: refreshedOrder ?? order,
        paymentState: 'verified',
        paymentRef,
        expectedPayNowNaira: amountNaira,
      });
      return;
    }

    await refreshOrdersAndPayments();
    setCheckoutReceipt({
      order,
      paymentState: 'pending',
      paymentRef,
      expectedPayNowNaira: amountNaira,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!currentCustomer) {
      navigate({ page: 'login', redirectTo: 'checkout' });
      return;
    }

    const missingFields: string[] = [];
    if (!name.trim()) missingFields.push('Full Name');
    if (!whatsApp.trim()) missingFields.push('WhatsApp Phone Number');
    if (!email.trim()) missingFields.push('Email Address');
    if (!deliveryAddress.trim()) missingFields.push('Full Delivery Address');
    if (!deliveryCity.trim()) missingFields.push('City / Town');
    if (!deliveryState.trim()) missingFields.push('State');

    if (missingFields.length > 0) {
      setFormError(
        missingFields.length === 1
          ? `Please enter your ${missingFields[0]} before placing your order.`
          : `Please fill in the following required fields: ${missingFields.join(', ')}.`
      );
      return;
    }
    if (!email.trim().includes('@')) {
      setFormError('Please enter a valid Email Address.');
      return;
    }
    if (!acceptedTerms) {
      setFormError('Please tick the box to accept the Pre-Order Terms before completing payment.');
      return;
    }

    setSubmitting(true);
    setSubmittingLabel('Creating order...');
    try {
      const result = await placeOrder({
        name,
        whatsApp,
        email,
        deliveryZoneId,
        deliveryAddress,
        deliveryCity,
        deliveryState,
        deliveryNote,
        upfrontPercentage,
      });

      if (!result.ok || !result.order || !result.paymentRef || result.payNowAmount === undefined) {
        setFormError(result.error ?? 'Could not create your order. Please try again.');
        return;
      }

      await launchFlutterwaveForOrder(result.order, result.paymentRef, result.payNowAmount);
    } catch (err) {
      cleanupFlutterwaveDom({ removePreload: true });
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : 'The Flutterwave payment window did not start. Please try again.'
      );
    } finally {
      setSubmitting(false);
      setSubmittingLabel('');
    }
  };

  const handleRetryAwaitingPayment = async () => {
    if (!checkoutReceipt || submitting) return;
    setSubmitting(true);
    setSubmittingLabel('Preparing Flutterwave payment...');
    try {
      const prep = await payOrderBalance(checkoutReceipt.order.id);
      if (!prep.ok || !prep.order || !prep.paymentRef || prep.amount === undefined) {
        setCheckoutReceipt((prev) =>
          prev
            ? {
                ...prev,
                notice: prep.error ?? 'Could not start payment retry. Please try again.',
              }
            : prev
        );
        return;
      }
      await launchFlutterwaveForOrder(prep.order, prep.paymentRef, prep.amount);
    } catch (err) {
      cleanupFlutterwaveDom({ removePreload: true });
      setCheckoutReceipt((prev) =>
        prev
          ? {
              ...prev,
              notice:
                err instanceof Error && err.message
                  ? err.message
                  : 'The Flutterwave payment window did not start. Please try again.',
            }
          : prev
      );
    } finally {
      setSubmitting(false);
      setSubmittingLabel('');
    }
  };

  if (checkoutReceipt) {
    const { order: receiptOrder, paymentState, paymentRef, expectedPayNowNaira, notice } =
      checkoutReceipt;
    const firstName = receiptOrder.customerName.split(' ')[0] || 'Customer';

    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="mb-5">
          <BackButton fallback={{ page: 'shop' }} />
        </div>
        <div className="border border-[#F0D9E3] bg-white p-8 sm:p-12">
          {paymentState === 'verified' ? (
            <>
              <div className="w-11 h-11 bg-[#FFF1F6] text-[#E8005F] flex items-center justify-center mb-6">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                Pre-Order Confirmed
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222] leading-tight">
                {receiptOrder.balanceRemainingNaira === 0
                  ? `Thank you, ${firstName}. Your order is paid in full.`
                  : `Thank you, ${firstName}. Your ${receiptOrder.depositPercentageApplied}% upfront payment is confirmed.`}
              </h1>
              <p className="mt-4 text-base text-[#555555] leading-relaxed">
                Order <strong className="text-[#222222]">{receiptOrder.orderNumber}</strong> is
                confirmed via Flutterwave and linked to your customer account (
                {receiptOrder.customerEmail}). We will send WhatsApp updates to{' '}
                <strong>{receiptOrder.customerWhatsApp}</strong> as your batch moves towards Lagos.
              </p>
            </>
          ) : paymentState === 'pending' ? (
            <>
              <div className="w-11 h-11 bg-[#FFF1F6] text-[#52005C] flex items-center justify-center mb-6">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                Payment Pending Verification
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222] leading-tight">
                We are confirming your payment, this can take a few minutes
              </h1>
              <p className="mt-4 text-base text-[#555555] leading-relaxed">
                Order <strong className="text-[#222222]">{receiptOrder.orderNumber}</strong> has
                been saved to your account ({receiptOrder.customerEmail}) with payment reference{' '}
                <strong className="font-mono text-[#222222]">{paymentRef}</strong>. Your payment
                status is currently <strong>Pending</strong> until Flutterwave server verification
                completes.
              </p>
            </>
          ) : (
            <>
              <div className="w-11 h-11 bg-[#FFF1F6] text-[#E8005F] flex items-center justify-center mb-6">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                Awaiting Payment
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222] leading-tight">
                Order {receiptOrder.orderNumber} is saved and awaiting payment
              </h1>
              <p className="mt-4 text-base text-[#555555] leading-relaxed">
                Your Flutterwave checkout window was closed before payment was completed. Your
                order has been kept safely in your dashboard as <strong>Awaiting payment</strong>,
                and you can retry paying now or anytime from your Customer Dashboard.
              </p>
              {notice && (
                <div
                  role="alert"
                  className="mt-4 p-4 bg-[#FEF2F2] border border-[#FECACA] text-base font-medium text-[#991B1B]"
                >
                  {notice}
                </div>
              )}
            </>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 border-t border-b border-[#F0D9E3] divide-y sm:divide-y-0 sm:divide-x divide-[#F0D9E3]">
            <div className="py-5 sm:pr-5">
              <p className="text-[13px] tracking-[0.13em] uppercase text-[#666666]">Full Total</p>
              <p className="mt-1.5 text-xl font-semibold text-[#222222] tabular-nums">
                {formatNaira(receiptOrder.fullTotalNaira)}
              </p>
            </div>
            <div className="py-5 sm:px-5">
              <p className="text-[13px] tracking-[0.13em] uppercase text-[#E8005F]">
                {paymentState === 'verified'
                  ? `Paid Upfront (${receiptOrder.depositPercentageApplied}%)`
                  : `Upfront Amount (${receiptOrder.depositPercentageApplied}%)`}
              </p>
              <p className="mt-1.5 text-xl font-semibold text-[#E8005F] tabular-nums">
                {paymentState === 'verified'
                  ? formatNaira(receiptOrder.depositPaidNaira)
                  : formatNaira(expectedPayNowNaira)}
              </p>
              {paymentState !== 'verified' && (
                <p className="mt-1 text-sm text-[#52005C]">
                  {paymentState === 'pending' ? 'Pending verification' : 'Not paid yet'}
                </p>
              )}
            </div>
            <div className="py-5 sm:pl-5">
              <p className="text-[13px] tracking-[0.13em] uppercase text-[#52005C]">
                Balance Remaining
              </p>
              <p className="mt-1.5 text-xl font-semibold text-[#52005C] tabular-nums">
                {formatNaira(receiptOrder.balanceRemainingNaira)}
              </p>
              {paymentState === 'verified' && receiptOrder.balanceRemainingNaira === 0 && (
                <p className="mt-1 text-sm font-medium text-[#52005C]">
                  Balance due ₦0 · Paid in full
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 text-base text-[#555555] space-y-1.5">
            <p>
              <strong className="text-[#222222]">Payment Reference:</strong>{' '}
              <span className="font-mono text-sm text-[#222222]">{paymentRef}</span>
            </p>
            <p>
              <strong className="text-[#222222]">Payment Provider:</strong> Flutterwave
            </p>
            <p>
              <strong className="text-[#222222]">Upfront Option:</strong>{' '}
              {receiptOrder.depositPercentageApplied === 100
                ? '100% upfront (Pay in full)'
                : `${receiptOrder.depositPercentageApplied}% upfront`}
            </p>
            <p>
              <strong className="text-[#222222]">Expected Arrival:</strong>{' '}
              {formatArrivalDate(receiptOrder.expectedArrivalDate)}
            </p>
            <p>
              <strong className="text-[#222222]">Order Status:</strong>{' '}
              {paymentState === 'pending' ? 'Pending payment confirmation' : receiptOrder.status}
            </p>
            <p>
              <strong className="text-[#222222]">Delivery Address:</strong>{' '}
              {[
                receiptOrder.deliveryAddress,
                receiptOrder.deliveryCity,
                receiptOrder.deliveryState,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
            {receiptOrder.deliveryNote && (
              <p>
                <strong className="text-[#222222]">Landmark / Delivery Note:</strong>{' '}
                {receiptOrder.deliveryNote}
              </p>
            )}
          </div>

          <div className="mt-9 flex flex-wrap gap-4">
            {paymentState === 'awaiting_payment' && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleRetryAwaitingPayment()}
                className="px-7 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {submitting
                    ? submittingLabel || 'Opening Flutterwave...'
                    : `Retry Payment with Flutterwave (${formatNaira(expectedPayNowNaira)})`}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                navigate({ page: 'account', tab: 'orders', orderId: receiptOrder.id })
              }
              className={`px-7 py-3.5 text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                paymentState === 'awaiting_payment'
                  ? 'bg-[#52005C] hover:bg-[#3D0045]'
                  : 'bg-[#E8005F] hover:bg-[#C4004F]'
              }`}
            >
              <span>View Order in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="px-7 py-3.5 border border-[#F0D9E3] hover:border-[#52005C] text-[#222222] text-[13px] tracking-[0.16em] uppercase font-semibold transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-24 text-center text-base text-[#555555]">
        Checking your account...
      </div>
    );
  }

  if (!currentCustomer) {
    return (
      <div className="max-w-xl mx-auto px-5 py-14 sm:py-16">
        <div className="mb-5">
          <BackButton fallback={{ page: 'shop' }} />
        </div>
        <div className="border border-[#F0D9E3] bg-white p-8 sm:p-10 space-y-5 text-center">
          <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C]">
            Sign In Required
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222]">
            Sign in before checking out
          </h1>
          <p className="text-base text-[#555555] leading-relaxed">
            Please sign in or create your Tabsah customer account first so your pre-order, arrival
            tracking, and balance payments are saved to your account. Your cart items will stay
            right here.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ page: 'login', redirectTo: 'checkout' })}
              className="px-7 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'cart' })}
              className="px-6 py-3.5 border border-[#F0D9E3] hover:border-[#52005C] text-[#222222] text-[13px] tracking-[0.14em] uppercase font-medium transition-colors cursor-pointer"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartDetailedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 sm:py-20">
        <div className="mb-8">
          <BackButton fallback={{ page: 'shop' }} />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl font-medium text-[#222222]">
            No items ready for checkout
          </h1>
          <p className="mt-3 text-base text-[#555555]">
            Add at least one pre-order item to your cart before checking out.
          </p>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            className="mt-7 px-7 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold transition-colors cursor-pointer"
          >
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
      <div className="mb-5">
        <BackButton fallback={{ page: 'shop' }} />
      </div>
      <div className="pb-8 mb-10 border-b border-[#F0D9E3]">
        <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
          Checkout
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
          Reserve Your Pre-Order
        </h1>
        <p className="mt-2 text-base text-[#555555]">
          Complete your delivery details and choose whether to pay 50%, 75%, or 100% upfront to
          secure your items.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
      >
        {/* Left Form */}
        <div className="lg:col-span-7 min-w-0 space-y-10">
          <section className="space-y-6 pb-8 border-b border-[#EFE5EA]">
            <div>
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-1">Step 01</p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#222222]">
                Customer and Delivery Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="co-name"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  Full Name
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chidinma Eze"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-whatsapp"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  WhatsApp Phone Number
                </label>
                <input
                  id="co-whatsapp"
                  type="tel"
                  required
                  value={whatsApp}
                  onChange={(e) => setWhatsApp(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="co-email"
                className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
              >
                Email Address
              </label>
              <input
                id="co-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="co-zone"
                className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
              >
                Delivery Zone
              </label>
              <select
                id="co-zone"
                value={deliveryZoneId}
                onChange={(e) => setDeliveryZoneId(e.target.value)}
                className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
              >
                {settings.deliveryFees.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.label} ({formatNaira(zone.feeNaira)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="co-address"
                className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
              >
                Full Delivery Address
              </label>
              <textarea
                id="co-address"
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House number, street name, estate or area"
                className="w-full p-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="co-city"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  City / Town
                </label>
                <input
                  id="co-city"
                  type="text"
                  required
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="e.g. Ikeja or Lekki"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-state"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  State
                </label>
                <input
                  id="co-state"
                  type="text"
                  required
                  value={deliveryState}
                  onChange={(e) => setDeliveryState(e.target.value)}
                  placeholder="e.g. Lagos"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="co-note"
                className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
              >
                Landmark or Delivery Note (Optional)
              </label>
              <input
                id="co-note"
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Opposite Total filling station, call at the gate"
                className="w-full h-11 px-3.5 border border-[#F0D9E3] bg-white text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
              />
            </div>
          </section>

          {/* Choose Upfront Payment Option */}
          <section className="space-y-5 pb-8 border-b border-[#EFE5EA]">
            <div>
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-1">Step 02</p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#222222]">
                Choose How Much to Pay Upfront
              </h2>
              <p className="mt-1.5 text-base text-[#555555] leading-relaxed">
                Your chosen percentage applies across the full order total (products plus delivery
                fee).
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label="Upfront payment percentage"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {settings.upfrontOptions.map((pct) => {
                const isSelected = upfrontPercentage === pct;
                const preview = calculateDepositAndBalance(fullTotal, pct);
                const labelText = pct === 100 ? '100 percent, Pay in full' : `${pct} percent`;
                return (
                  <label
                    key={pct}
                    className={`relative flex flex-col justify-between p-5 border-2 transition-colors cursor-pointer min-w-0 ${
                      isSelected
                        ? 'border-[#E8005F] bg-[#FFF1F6]'
                        : 'border-[#F0D9E3] bg-white hover:border-[#52005C]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="upfrontPercentage"
                      value={pct}
                      checked={isSelected}
                      onChange={() => {
                        hasUserChangedUpfrontRef.current = true;
                        setUpfrontPercentage(pct);
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] tracking-[0.11em] uppercase font-semibold text-[#52005C]">
                        {labelText}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-[#E8005F] bg-[#E8005F]' : 'border-[#C9B3BF] bg-white'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-[#555555]">Pay now</p>
                      <p
                        className={`font-display text-2xl font-semibold tabular-nums mt-0.5 ${
                          isSelected ? 'text-[#E8005F]' : 'text-[#222222]'
                        }`}
                      >
                        {formatNaira(preview.deposit)}
                      </p>
                      <p className="mt-2 text-sm text-[#52005C] tabular-nums">
                        {pct === 100
                          ? 'Balance due ₦0 · Paid in full'
                          : `Balance: ${formatNaira(preview.balance)}`}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="bg-[#FFF1F6] border border-[#F0D9E3] px-5 py-4 text-base text-[#222222] leading-relaxed">
              <strong className="font-semibold text-[#52005C]">Delivery payment rule:</strong>{' '}
              Nothing is delivered until the full amount is paid.
            </div>
          </section>

          {/* Signed-in Customer Account Confirmation */}
          <section className="space-y-5 pb-8 border-b border-[#EFE5EA]">
            <div>
              <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-1">Step 03</p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#222222]">
                Your Customer Account
              </h2>
            </div>

            <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-4 text-base text-[#222222] leading-relaxed">
              Signed in as <strong>{currentCustomer.name}</strong> ({currentCustomer.email}). This
              order will be saved in your Customer Dashboard so you can track arrival and settle
              any remaining balance later.
            </div>
          </section>

          {/* Terms Acceptance */}
          <section className="bg-[#FFF1F6] border border-[#F0D9E3] p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1.5 w-4 h-4 accent-[#E8005F] shrink-0"
              />
              <span className="text-base text-[#222222] leading-relaxed">
                {isPayInFull ? (
                  <>
                    I understand that these items are pre-orders with expected arrival dates in
                    November and December 2026. I agree to pay 100 percent in full today, and I
                    accept the{' '}
                  </>
                ) : (
                  <>
                    I understand that these items are pre-orders with expected arrival dates in
                    November and December 2026. I agree to pay {upfrontPercentage} percent upfront
                    today and settle the remaining balance before delivery. Nothing is delivered
                    until the full amount is paid. I accept the{' '}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => navigate({ page: 'info', slug: 'preorder-terms' })}
                  className="font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 cursor-pointer"
                >
                  Pre-Order Terms
                </button>
                .
              </span>
            </label>
          </section>

          {formError && (
            <div
              role="alert"
              className="p-4 bg-[#FEF2F2] border border-[#FECACA] text-base font-medium text-[#991B1B]"
            >
              {formError}
            </div>
          )}
        </div>

        {/* Right Summary & Pay Deposit CTA */}
        <aside className="lg:col-span-5 min-w-0 border border-[#F0D9E3] bg-white p-5 sm:p-8 space-y-6">
          <div>
            <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-1">Summary</p>
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#222222]">
              Your Pre-Order
            </h2>
          </div>

          <ul className="divide-y divide-[#F3E7EC] border-t border-b border-[#F3E7EC]">
            {cartDetailedItems.map(({ cartKey, product, variantLabel, quantity, lineTotal }) => (
              <li key={cartKey} className="py-3.5 flex items-start justify-between gap-3 text-base">
                <div>
                  <p className="font-medium text-[#222222]">
                    {product.name}{' '}
                    <span className="text-[#666666] font-normal">x {quantity}</span>
                  </p>
                  {variantLabel && (
                    <p className="text-sm font-medium text-[#52005C] mt-0.5">
                      Option: {variantLabel}
                    </p>
                  )}
                  <p className="text-sm text-[#666666] mt-0.5">
                    Arrives {formatArrivalDate(product.expectedArrivalDate)}
                  </p>
                </div>
                <span className="font-semibold text-[#222222] tabular-nums shrink-0">
                  {formatNaira(lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2.5 text-base">
            <div className="flex justify-between">
              <span className="text-[#666666]">Items Subtotal</span>
              <span className="font-medium text-[#222222] tabular-nums">
                {formatNaira(cartSubtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Delivery Fee</span>
              <span className="font-medium text-[#222222] tabular-nums">
                {formatNaira(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-[#EFE5EA] text-lg">
              <span className="font-semibold text-[#222222]">Full Order Total</span>
              <span className="font-semibold text-[#222222] tabular-nums">
                {formatNaira(fullTotal)}
              </span>
            </div>
          </div>

          <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-5 space-y-2.5">
            <div className="flex justify-between items-baseline gap-3">
              <span className="text-[13px] tracking-[0.13em] uppercase font-semibold text-[#E8005F]">
                {isPayInFull ? 'Pay Now (100%, Pay in Full)' : `Pay Now (${upfrontPercentage}%)`}
              </span>
              <span className="font-display text-3xl font-semibold text-[#E8005F] tabular-nums">
                {formatNaira(payNow)}
              </span>
            </div>
            <div className="flex justify-between items-baseline gap-3 text-base">
              <span className="text-[#52005C]">
                {isPayInFull ? 'Balance due' : 'Balance Due Before Delivery'}
              </span>
              <span className="font-semibold text-[#52005C] tabular-nums">
                {isPayInFull ? '₦0 (Paid in full)' : formatNaira(balance)}
              </span>
            </div>
            {isPayInFull ? (
              <p className="text-sm font-medium text-[#52005C] pt-1 border-t border-[#F0D9E3]">
                Balance due ₦0 · Paid in full
              </p>
            ) : (
              <p className="text-sm text-[#4A4A4A] pt-1 border-t border-[#F0D9E3]">
                Nothing is delivered until the full amount is paid.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-5 sm:px-6 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] tracking-[0.14em] sm:tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2.5 text-center transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{submitting ? submittingLabel || 'Opening Flutterwave...' : payButtonLabel}</span>
          </button>

          <div className="flex items-start gap-2.5 text-base text-[#666666] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#52005C] shrink-0 mt-1" />
            <span>
              Secured by Flutterwave. Your order and pending payment reference are saved before
              checkout opens, and payment is confirmed after server verification.
            </span>
          </div>
        </aside>
      </form>
    </div>
  );
};
