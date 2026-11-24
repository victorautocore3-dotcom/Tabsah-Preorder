import React from 'react';
import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  calculateDepositAndBalance,
  formatArrivalDate,
  formatNaira,
} from '../data/storeData';
import { ProductImage } from '../components/ProductImage';

export const CartPage: React.FC = () => {
  const {
    cartDetailedItems,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    navigate,
    settings,
  } = useStore();

  const minUpfrontPct = Math.min(...settings.upfrontOptions);
  const { deposit, balance } = calculateDepositAndBalance(cartSubtotal, minUpfrontPct);

  if (cartDetailedItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-24 sm:py-32 text-center">
        <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-3">
          Shopping Bag
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
          Your pre-order bag is empty
        </h1>
        <p className="mt-4 text-base text-[#555555] max-w-md mx-auto leading-relaxed">
          Explore our November and December 2026 batches and choose to pay 50%, 75%, or 100%
          upfront at checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold transition-colors cursor-pointer"
        >
          <span>Browse Pre-Orders</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
      <div className="pb-8 mb-10 border-b border-[#F0D9E3]">
        <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
          Shopping Bag
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
          Your Pre-Order Cart
        </h1>
        <p className="mt-2 text-base text-[#555555]">
          Review your items and full total. Choose to pay 50%, 75%, or 100% upfront at checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-7 min-w-0 divide-y divide-[#EFE5EA] border-t border-b border-[#EFE5EA]">
          {cartDetailedItems.map(({ product, quantity, lineTotal }) => (
            <div key={product.id} className="py-6 flex flex-col sm:flex-row gap-6">
              <button
                type="button"
                onClick={() => navigate({ page: 'product', productSlug: product.slug })}
                className="w-full sm:w-32 aspect-[4/3] sm:aspect-square bg-[#F8F5F7] overflow-hidden shrink-0 cursor-pointer"
              >
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block bg-[#52005C] text-white text-[13px] tracking-[0.12em] uppercase font-semibold px-2.5 py-0.5 mb-2">
                      Pre-Order
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate({ page: 'product', productSlug: product.slug })}
                      className="block text-left cursor-pointer"
                    >
                      <h2 className="font-display text-2xl sm:text-[28px] font-medium text-[#222222] hover:text-[#E8005F] leading-snug">
                        {product.name}
                      </h2>
                    </button>
                    <p className="mt-1.5 text-sm text-[#666666]">
                      Expected arrival: {formatArrivalDate(product.expectedArrivalDate)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name}`}
                    className="p-2 text-[#666666] hover:text-[#E8005F] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.75]" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="inline-flex items-center border border-[#F0D9E3] bg-white h-9">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-8 h-full flex items-center justify-center text-[#222222] hover:text-[#E8005F] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-base font-medium tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-8 h-full flex items-center justify-center text-[#222222] hover:text-[#E8005F] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-[#666666] tabular-nums">
                      {formatNaira(product.priceNaira)} each
                    </p>
                    <p className="text-lg font-semibold text-[#222222] tabular-nums">
                      {formatNaira(lineTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="pt-6">
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="text-[13px] tracking-[0.14em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        {/* Summary Panel */}
        <aside className="lg:col-span-5 min-w-0 bg-[#FFF1F6] border border-[#F0D9E3] p-6 sm:p-9">
          <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C] mb-2">
            Payment Split
          </p>
          <h2 className="font-display text-3xl font-medium text-[#222222] mb-6">
            Order Summary
          </h2>

          <div className="divide-y divide-[#EBCAD8] border-t border-b border-[#EBCAD8]">
            <div className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-base font-medium text-[#222222]">Full Total</p>
                <p className="text-sm text-[#555555]">Items total before delivery fee</p>
              </div>
              <span className="text-xl font-semibold text-[#222222] tabular-nums">
                {formatNaira(cartSubtotal)}
              </span>
            </div>

            <div className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[#E8005F]">
                  Deposit From ({minUpfrontPct}%)
                </p>
                <p className="text-sm text-[#555555]">Pay 50%, 75%, or 100% upfront at checkout</p>
              </div>
              <span className="font-display text-3xl font-semibold text-[#E8005F] tabular-nums">
                {formatNaira(deposit)}
              </span>
            </div>

            <div className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[#52005C]">
                  Remaining Balance (at {minUpfrontPct}%)
                </p>
                <p className="text-sm text-[#555555]">Settled once stock arrives in Lagos</p>
              </div>
              <span className="text-xl font-semibold text-[#52005C] tabular-nums">
                {formatNaira(balance)}
              </span>
            </div>
          </div>

          <p className="mt-5 text-base text-[#4A4A4A] leading-relaxed">
            Delivery fee and your upfront payment choice (50%, 75%, or 100% pay in full) are
            selected at checkout and apply across the full order total. Nothing is delivered until
            the full amount is paid.
          </p>

          <button
            type="button"
            onClick={() => navigate({ page: 'checkout' })}
            className="mt-7 w-full py-4 px-6 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </aside>
      </div>
    </div>
  );
};
