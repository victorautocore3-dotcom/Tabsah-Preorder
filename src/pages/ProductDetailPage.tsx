import React, { useState } from 'react';
import { ArrowLeft, Check, MessageCircle, Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  calculateDepositAndBalance,
  formatArrivalDate,
  formatNaira,
} from '../data/storeData';
import { ProductImage } from '../components/ProductImage';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  productSlug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productSlug }) => {
  const { products, categories, navigate, addToCart, settings, getWhatsAppUrl } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const product = products.find((p) => p.slug === productSlug) ?? products[0];
  const category = categories.find((c) => c.slug === product.categorySlug);
  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.categorySlug === product.categorySlug || p.featured))
    .slice(0, 4);

  const minUpfrontPct = Math.min(...settings.upfrontOptions);
  const lineFullTotal = product.priceNaira * quantity;
  const { deposit, balance } = calculateDepositAndBalance(lineFullTotal, minUpfrontPct);

  const handleAddToCart = () => {
    if (!product.isPreOrderOpen) return;
    addToCart(product.id, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2600);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
      {/* Quiet Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-10 border-b border-[#EFE5EA]">
        <nav className="text-[13px] tracking-[0.14em] uppercase text-[#666666] flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="hover:text-[#E8005F] cursor-pointer"
          >
            Home
          </button>
          <span aria-hidden="true">/</span>
          {category && (
            <>
              <button
                type="button"
                onClick={() => navigate({ page: 'shop', categorySlug: category.slug })}
                className="hover:text-[#E8005F] cursor-pointer"
              >
                {category.name}
              </button>
              <span aria-hidden="true">/</span>
            </>
          )}
          <span className="text-[#222222] font-medium">{product.name}</span>
        </nav>

        <button
          type="button"
          onClick={() =>
            navigate({ page: 'shop', categorySlug: category ? category.slug : undefined })
          }
          className="inline-flex items-center gap-2 text-[13px] tracking-[0.13em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Catalogue</span>
        </button>
      </div>

      {/* Main Split: Large Flush Photo Left, Calm Editorial Purchase Column Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left: Generous Studio Gallery */}
        <div className="lg:col-span-7 space-y-5">
          <div className="aspect-[4/3] w-full bg-[#F8F5F7] overflow-hidden">
            <ProductImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="grid grid-cols-3 gap-5 pt-2 border-t border-[#EFE5EA] text-sm">
            <div className="pt-3">
              <p className="text-[13px] tracking-[0.14em] uppercase text-[#666666]">Batch Code</p>
              <p className="mt-1 font-medium text-[#222222] tabular-nums">{product.batchCode}</p>
            </div>
            <div className="pt-3">
              <p className="text-[13px] tracking-[0.14em] uppercase text-[#666666]">
                Expected Arrival
              </p>
              <p className="mt-1 font-medium text-[#E8005F]">
                {formatArrivalDate(product.expectedArrivalDate)}
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[13px] tracking-[0.14em] uppercase text-[#666666]">
                Inspection Hub
              </p>
              <p className="mt-1 font-medium text-[#222222]">Ikorodu, Lagos State</p>
            </div>
          </div>
        </div>

        {/* Right: Sticky Editorial Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 mb-4">
            {product.isPreOrderOpen ? (
              <span className="inline-block bg-[#52005C] text-white text-[13px] tracking-[0.14em] uppercase font-semibold px-2.5 py-1">
                Pre-Order
              </span>
            ) : (
              <span className="inline-block bg-[#222222] text-white text-[13px] tracking-[0.14em] uppercase font-medium px-2.5 py-1">
                Batch Closed
              </span>
            )}
            <span className="text-[13px] tracking-[0.14em] uppercase text-[#666666]">
              {category ? category.name : 'Curated Find'}
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-[48px] font-medium text-[#222222] leading-[1.1]">
            {product.name}
          </h1>

          <p className="mt-4 text-base text-[#555555] leading-relaxed">
            {product.shortSummary}
          </p>

          {/* Price & Calm Hairline Deposit Breakdown */}
          <div className="mt-7 pt-6 pb-6 border-t border-b border-[#F0D9E3] space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] tracking-[0.14em] uppercase text-[#666666]">Full Price</span>
              <span className="font-display text-4xl font-medium text-[#E8005F] tabular-nums">
                {formatNaira(product.priceNaira)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 text-base">
              <span className="text-[#555555]">
                Deposit from ({minUpfrontPct}%)
              </span>
              <span className="text-lg font-semibold text-[#E8005F] tabular-nums">
                {formatNaira(deposit)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4 text-base">
              <span className="text-[#555555]">Balance due before delivery (at {minUpfrontPct}%)</span>
              <span className="text-lg font-semibold text-[#52005C] tabular-nums">
                {formatNaira(balance)}
              </span>
            </div>

            <p className="text-sm text-[#555555]">
              Pay 50%, 75%, or 100% (pay in full) upfront at checkout.
            </p>

            <div className="flex items-baseline justify-between gap-4 text-base pt-2 border-t border-[#F3E7EC]">
              <span className="text-[#555555]">Expected arrival in Nigeria</span>
              <span className="font-semibold text-[#222222]">
                {formatArrivalDate(product.expectedArrivalDate)}
              </span>
            </div>
          </div>

          {/* Clear Pre-Order Notice Box */}
          <div className="mt-6 bg-[#FFF1F6] border border-[#F0D9E3] p-5 space-y-2">
            <p className="text-[13px] tracking-[0.16em] uppercase font-semibold text-[#52005C]">
              Pre-Order Notice
            </p>
            <p className="text-base text-[#3D3D3D] leading-relaxed">
              This item is a pre-order expected to arrive in Nigeria on{' '}
              <strong className="font-semibold text-[#222222]">
                {formatArrivalDate(product.expectedArrivalDate)}
              </strong>
              . Choose to pay 50%, 75%, or 100% upfront at checkout to secure your item in this
              batch. Any remaining balance is due before delivery once stock arrives in Lagos.
            </p>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="mt-7 flex flex-col sm:flex-row items-stretch gap-3">
            <div className="inline-flex items-center justify-between border border-[#F0D9E3] bg-white h-12 px-2 sm:w-32 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-8 h-8 flex items-center justify-center text-[#222222] hover:text-[#E8005F] cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base font-semibold text-[#222222] tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Increase quantity"
                className="w-8 h-8 flex items-center justify-center text-[#222222] hover:text-[#E8005F] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={!product.isPreOrderOpen}
              onClick={handleAddToCart}
              className={`flex-1 h-12 px-6 text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                product.isPreOrderOpen
                  ? 'bg-[#E8005F] hover:bg-[#C4004F] text-white'
                  : 'bg-[#F3E7EC] text-[#7A7A7A] cursor-not-allowed'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <span>
                  {product.isPreOrderOpen
                    ? `Add to Cart (${formatNaira(lineFullTotal)})`
                    : 'Pre-Order Closed'}
                </span>
              )}
            </button>
          </div>

          {justAdded && (
            <div className="mt-4 flex items-center justify-between border border-[#F0D9E3] bg-[#FFF1F6] px-4 py-3 text-base">
              <span className="text-[#222222]">Item added to your pre-order bag.</span>
              <button
                type="button"
                onClick={() => navigate({ page: 'cart' })}
                className="text-[13px] tracking-[0.13em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 whitespace-nowrap cursor-pointer"
              >
                View Cart
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#EFE5EA] flex flex-wrap items-center justify-between gap-4 text-[13px]">
            <a
              href={getWhatsAppUrl(`Hello Tabsah, I have a question about ${product.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 tracking-[0.13em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => navigate({ page: 'info', slug: 'preorder-terms' })}
              className="text-sm text-[#666666] hover:text-[#52005C] underline underline-offset-4 cursor-pointer"
            >
              Pre-Order Terms
            </button>
          </div>
        </div>
      </div>

      {/* Editorial Story & Specifications */}
      <div className="mt-20 pt-14 border-t border-[#F0D9E3] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-6">
          <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C] mb-2">
            Details
          </p>
          <h2 className="font-display text-3xl font-medium text-[#222222] mb-4">
            About this object
          </h2>
          <p className="text-base text-[#4A4A4A] leading-relaxed">{product.description}</p>
        </div>

        <div className="lg:col-span-6">
          <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C] mb-2">
            Specifications
          </p>
          <h2 className="font-display text-3xl font-medium text-[#222222] mb-4">
            Material and dimensions
          </h2>
          <dl className="divide-y divide-[#EFE5EA] border-t border-b border-[#EFE5EA]">
            {product.specifications.map((spec) => (
              <div key={spec.label} className="py-3.5 flex justify-between gap-6 text-base">
                <dt className="text-[#666666]">{spec.label}</dt>
                <dd className="text-[#222222] font-medium text-right">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Related Pre-Orders */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 pt-16 border-t border-[#F0D9E3]">
          <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
            You May Also Like
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#222222] mb-10">
            More From Our Batches
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-14">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
