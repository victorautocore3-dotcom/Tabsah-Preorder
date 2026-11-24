import React from 'react';
import {
  calculateDepositAndBalance,
  formatArrivalDate,
  formatNaira,
  Product,
} from '../data/storeData';
import { useStore } from '../context/StoreContext';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { categories, navigate, addToCart, settings } = useStore();
  const category = categories.find((c) => c.slug === product.categorySlug);
  const minUpfrontPct = Math.min(...settings.upfrontOptions);
  const { deposit } = calculateDepositAndBalance(product.priceNaira, minUpfrontPct);

  return (
    <article className="group flex flex-col">
      {/* Large Borderless Editorial Photo */}
      <button
        type="button"
        onClick={() => navigate({ page: 'product', productSlug: product.slug })}
        className="relative block aspect-[4/4] w-full bg-[#F8F5F7] overflow-hidden text-left cursor-pointer"
        aria-label={`View ${product.name}`}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute top-3.5 left-3.5">
          {product.isPreOrderOpen ? (
            <span className="inline-block bg-[#52005C] text-white text-[13px] tracking-[0.12em] uppercase font-semibold px-2.5 py-1">
              Pre-Order
            </span>
          ) : (
            <span className="inline-block bg-[#222222] text-white text-[13px] tracking-[0.12em] uppercase font-medium px-2.5 py-1">
              Closed
            </span>
          )}
        </div>
      </button>

      {/* Calm Minimal Editorial Text Beneath Photo */}
      <div className="pt-4 flex flex-col flex-1">
        <p className="text-[13px] tracking-[0.12em] uppercase text-[#666666] truncate">
          {category ? category.name : 'Curated Find'}
        </p>

        <button
          type="button"
          onClick={() => navigate({ page: 'product', productSlug: product.slug })}
          className="mt-1.5 text-left cursor-pointer"
        >
          <h3 className="font-display text-2xl font-medium text-[#222222] leading-[1.2] group-hover:text-[#E8005F] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </button>

        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <span className="text-base font-semibold text-[#222222] tabular-nums">
            {formatNaira(product.priceNaira)}
          </span>
          <span className="text-sm font-medium text-[#E8005F] tabular-nums whitespace-nowrap">
            Deposit from {formatNaira(deposit)}
          </span>
        </div>

        <p className="mt-1 text-sm text-[#666666]">
          Pay 50%, 75% or 100% upfront at checkout
        </p>

        <p className="mt-0.5 text-sm text-[#666666]">
          Arrives {formatArrivalDate(product.expectedArrivalDate)}
        </p>

        <div className="mt-4 pt-3 border-t border-[#EFE5EA] flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={!product.isPreOrderOpen}
            onClick={() => addToCart(product.id, 1)}
            className={`text-[13px] tracking-[0.13em] uppercase font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              product.isPreOrderOpen
                ? 'text-[#E8005F] hover:text-[#52005C] underline underline-offset-4'
                : 'text-[#999999] cursor-not-allowed'
            }`}
          >
            {product.isPreOrderOpen ? 'Add to Cart' : 'Pre-Order Closed'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ page: 'product', productSlug: product.slug })}
            className="text-sm text-[#666666] hover:text-[#52005C] transition-colors whitespace-nowrap cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
};
