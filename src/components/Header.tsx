import React, { useState } from 'react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatNaira } from '../data/storeData';
import { BrandMark } from './BrandMark';

export const Header: React.FC = () => {
  const { route, navigate, cartCount, currentCustomer, products } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const liveMatches =
    searchInput.trim().length > 1
      ? products
          .filter((p) => {
            const q = searchInput.trim().toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              p.shortSummary.toLowerCase().includes(q) ||
              p.categorySlug.toLowerCase().includes(q)
            );
          })
          .slice(0, 5)
      : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    setMobileMenuOpen(false);
    navigate({ page: 'shop', searchQuery: searchInput.trim() });
  };

  const go = (next: Parameters<typeof navigate>[0]) => {
    setMobileMenuOpen(false);
    setSearchFocused(false);
    navigate(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-white text-[#222222] border-b border-[#F0D9E3]">
      <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12">
        <div className="h-[72px] flex items-center justify-between gap-5 lg:gap-10">
          {/* Editorial Serif Brand Wordmark + Pink Tag Mark */}
          <button
            type="button"
            onClick={() => go({ page: 'home' })}
            className="inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer group focus-visible:outline-2 focus-visible:outline-[#E8005F]"
          >
            <BrandMark className="h-[36px] w-auto object-contain shrink-0 block" />
            <span className="font-display text-2xl sm:text-[26px] font-medium tracking-[0.01em] text-[#222222] group-hover:text-[#E8005F] transition-colors">
              Pre Order With Tabsah
            </span>
          </button>

          {/* Desktop Search Input */}
          <div className="hidden md:block relative flex-1 max-w-sm">
            <form onSubmit={handleSearchSubmit} role="search" className="relative">
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Search catalogue..."
                aria-label="Search pre-order products"
                className="w-full h-9 pl-0 pr-8 bg-transparent border-b border-[#E5D5DC] text-[#222222] placeholder:text-[#7A7A7A] text-base focus:border-[#E8005F] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#52005C] hover:text-[#E8005F] transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[1.75]" />
              </button>
            </form>

            {searchFocused && liveMatches.length > 0 && (
              <div className="absolute left-0 right-0 top-11 bg-white text-[#222222] border border-[#F0D9E3] z-50">
                {liveMatches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => go({ page: 'product', productSlug: item.slug })}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#FFF1F6] transition-colors border-b border-[#F3E7EC] last:border-b-0 cursor-pointer"
                  >
                    <span className="text-base text-[#222222] truncate">{item.name}</span>
                    <span className="text-sm font-semibold text-[#E8005F] tabular-nums shrink-0">
                      {formatNaira(item.priceNaira)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav Links + Account & Cart */}
          <div className="flex items-center gap-5 lg:gap-8 shrink-0">
            <nav className="hidden lg:flex items-center gap-7 text-[13px] tracking-[0.13em] uppercase font-medium">
              <button
                type="button"
                onClick={() => go({ page: 'shop' })}
                className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#E8005F] hover:underline decoration-[#E8005F] underline-offset-8 ${
                  route.page === 'shop'
                    ? 'text-[#E8005F] underline'
                    : 'text-[#222222]'
                }`}
              >
                Shop
              </button>
              <button
                type="button"
                onClick={() => go({ page: 'info', slug: 'delivery-info' })}
                className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#E8005F] hover:underline decoration-[#E8005F] underline-offset-8 ${
                  route.page === 'info' && route.slug === 'delivery-info'
                    ? 'text-[#E8005F] underline'
                    : 'text-[#222222]'
                }`}
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => go({ page: 'info', slug: 'contact' })}
                className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#E8005F] hover:underline decoration-[#E8005F] underline-offset-8 ${
                  route.page === 'info' && route.slug === 'contact'
                    ? 'text-[#E8005F] underline'
                    : 'text-[#222222]'
                }`}
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => go({ page: 'admin', tab: 'overview' })}
                className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#E8005F] hover:underline decoration-[#E8005F] underline-offset-8 ${
                  route.page === 'admin'
                    ? 'text-[#E8005F] underline'
                    : 'text-[#52005C]'
                }`}
              >
                Admin
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  go(currentCustomer ? { page: 'account', tab: 'orders' } : { page: 'login' })
                }
                aria-label="Account"
                className="inline-flex items-center gap-2 py-2 text-[#222222] hover:text-[#E8005F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User className="w-[18px] h-[18px] stroke-[1.75]" />
                <span className="hidden sm:inline text-[13px] tracking-[0.11em] uppercase font-medium max-w-[110px] truncate">
                  {currentCustomer ? currentCustomer.name.split(' ')[0] : 'Account'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => go({ page: 'cart' })}
                aria-label={`Shopping cart with ${cartCount} items`}
                className="inline-flex items-center gap-2 py-2 text-[#222222] hover:text-[#E8005F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingBag className="w-[18px] h-[18px] stroke-[1.75]" />
                <span className="hidden sm:inline text-[13px] tracking-[0.11em] uppercase font-medium">
                  Bag
                </span>
                <span className="text-[13px] font-semibold text-[#E8005F] tabular-nums">
                  ({cartCount})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                className="lg:hidden inline-flex items-center justify-center w-9 h-9 text-[#52005C] hover:text-[#E8005F] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#52005C] text-white border-t border-white/15 px-5 py-6 space-y-5">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search catalogue..."
              className="w-full h-10 pl-0 pr-8 bg-transparent border-b border-white/40 text-white placeholder:text-white/70 text-base focus:border-[#E8005F] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white hover:text-[#FFB3D1]"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px] tracking-[0.13em] uppercase font-medium">
            <button
              type="button"
              onClick={() => go({ page: 'home' })}
              className="text-left py-2 border-b border-white/15 text-white hover:text-[#FFB3D1]"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => go({ page: 'shop' })}
              className="text-left py-2 border-b border-white/15 text-white hover:text-[#FFB3D1]"
            >
              Shop All
            </button>
            <button
              type="button"
              onClick={() =>
                go(currentCustomer ? { page: 'account', tab: 'orders' } : { page: 'login' })
              }
              className="text-left py-2 border-b border-white/15 text-white hover:text-[#FFB3D1]"
            >
              {currentCustomer ? 'My Orders' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => go({ page: 'admin', tab: 'overview' })}
              className="text-left py-2 border-b border-white/15 text-white hover:text-[#FFB3D1]"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => go({ page: 'info', slug: 'delivery-info' })}
              className="text-left py-2 border-b border-white/15 text-white hover:text-[#FFB3D1]"
            >
              Delivery Info
            </button>
            <button
              type="button"
              onClick={() => go({ page: 'info', slug: 'contact' })}
              className="text-left py-2 border-b border-white/15 text-white hover:text-[#FFB3D1]"
            >
              Contact
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
