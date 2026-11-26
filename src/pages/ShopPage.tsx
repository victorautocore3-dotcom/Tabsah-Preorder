import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { BackButton } from '../components/BackButton';

interface ShopPageProps {
  initialCategorySlug?: string;
  initialSearchQuery?: string;
}

type SortOption = 'featured' | 'arrival-soonest' | 'price-low' | 'price-high';

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategorySlug,
  initialSearchQuery = '',
}) => {
  const { categories, products, productsLoading, productsError, navigate } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug ?? 'all');
  const [searchText, setSearchText] = useState<string>(initialSearchQuery);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [openOnly, setOpenOnly] = useState<boolean>(false);

  React.useEffect(() => {
    setSelectedCategory(initialCategorySlug ?? 'all');
  }, [initialCategorySlug]);

  React.useEffect(() => {
    setSearchText(initialSearchQuery);
  }, [initialSearchQuery]);

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = products.filter((p) => {
      if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory) return false;
      if (openOnly && !p.isPreOrderOpen) return false;
      if (q) {
        const match =
          p.name.toLowerCase().includes(q) ||
          p.shortSummary.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'arrival-soonest') {
      sorted.sort((a, b) => a.expectedArrivalDate.localeCompare(b.expectedArrivalDate));
    } else if (sortBy === 'price-low') {
      sorted.sort((a, b) => a.priceNaira - b.priceNaira);
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => b.priceNaira - a.priceNaira);
    } else {
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [products, selectedCategory, searchText, sortBy, openOnly]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    navigate({
      page: 'shop',
      categorySlug: slug === 'all' ? undefined : slug,
      searchQuery: searchText.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
      {/* Calm Editorial Page Header */}
      <div className="pb-10 mb-10 border-b border-[#F0D9E3]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <nav className="text-[13px] tracking-[0.16em] uppercase text-[#666666] flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="hover:text-[#E8005F] cursor-pointer"
            >
              Home
            </button>
            <span aria-hidden="true">/</span>
            <span className="text-[#52005C] font-medium">
              {activeCategoryObj ? activeCategoryObj.name : 'Catalogue'}
            </span>
          </nav>

          <BackButton fallback={{ page: 'home' }} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222] leading-tight">
              {activeCategoryObj ? activeCategoryObj.name : 'All Pre-Order Products'}
            </h1>
            <p className="mt-3 text-base text-[#555555] leading-relaxed">
              {activeCategoryObj
                ? activeCategoryObj.description
                : 'Explore all eleven curated departments. Every piece lists its full naira price, deposit amount, and expected arrival date in Nigeria.'}
            </p>
          </div>

          <p className="text-[13px] tracking-[0.15em] uppercase text-[#52005C] font-medium tabular-nums shrink-0">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'object' : 'objects'}
          </p>
        </div>
      </div>

      {/* Clean Architectural Category Filter Bar */}
      <div className="mb-8 pb-6 border-b border-[#EFE5EA]">
        <div className="flex flex-wrap gap-x-5 sm:gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`pb-1.5 text-[13px] tracking-[0.11em] uppercase transition-colors text-left sm:whitespace-nowrap cursor-pointer border-b-2 ${
              selectedCategory === 'all'
                ? 'border-[#E8005F] text-[#E8005F] font-semibold'
                : 'border-transparent text-[#555555] hover:text-[#E8005F]'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categorySlug === cat.slug).length;
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.slug)}
                className={`pb-1.5 text-[13px] tracking-[0.11em] uppercase transition-colors text-left sm:whitespace-nowrap cursor-pointer border-b-2 ${
                  active
                    ? 'border-[#E8005F] text-[#E8005F] font-semibold'
                    : 'border-transparent text-[#555555] hover:text-[#E8005F]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiet Search & Sort Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5 mb-12">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#52005C] absolute left-0 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter by product name..."
            aria-label="Filter products by name"
            className="w-full h-10 pl-7 pr-8 border-b border-[#F0D9E3] bg-transparent text-base text-[#222222] placeholder:text-[#7A7A7A] focus:border-[#E8005F] focus:outline-none"
          />
          {searchText && (
            <button
              type="button"
              onClick={() => {
                setSearchText('');
                navigate({
                  page: 'shop',
                  categorySlug: selectedCategory === 'all' ? undefined : selectedCategory,
                });
              }}
              aria-label="Clear search filter"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#E8005F] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-[13px] tracking-[0.11em] uppercase text-[#4A4A4A] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4 accent-[#E8005F]"
            />
            <span>Open pre-orders only</span>
          </label>

          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="text-[13px] tracking-[0.11em] uppercase text-[#666666]">
              Sort
            </label>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 pl-2 pr-6 border-b border-[#F0D9E3] bg-transparent text-base font-medium text-[#222222] focus:border-[#E8005F] focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="arrival-soonest">Earliest Arrival</option>
              <option value="price-low">Price Low to High</option>
              <option value="price-high">Price High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spacious 3-Column Editorial Product Grid */}
      {productsLoading ? (
        <div className="border-t border-b border-[#F0D9E3] py-16 text-center">
          <p className="text-base text-[#555555]">Loading pre-order catalogue...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="border-t border-b border-[#F0D9E3] py-16 text-center max-w-2xl mx-auto">
          <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C] mb-2">
            Catalogue Updating
          </p>
          <h2 className="font-display text-3xl font-medium text-[#222222]">
            Our next pre-order batch is being prepared
          </h2>
          <p className="mt-3 text-base text-[#555555] leading-relaxed">
            No pre-order items are published in the catalogue yet. Please check back shortly or
            reach out on WhatsApp for upcoming arrival dates.
          </p>
          {productsError && (
            <p className="mt-4 text-sm text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-2.5 inline-block">
              Database read notice: {productsError}
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-b border-[#F0D9E3] py-16 text-center">
          <h2 className="font-display text-2xl font-medium text-[#222222]">
            No matching pre-order objects found
          </h2>
          <p className="mt-2 text-base text-[#555555]">
            Try clearing your search term or returning to all eleven categories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchText('');
              setOpenOnly(false);
              setSelectedCategory('all');
              navigate({ page: 'shop' });
            }}
            className="mt-6 px-6 py-3 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
