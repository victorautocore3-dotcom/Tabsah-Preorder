import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandMark } from './BrandMark';

export const Footer: React.FC = () => {
  const { navigate, categories, settings, getWhatsAppUrl } = useStore();

  return (
    <footer className="bg-[#52005C] text-white mt-24 border-t border-[#3D0045]">
      <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-5">
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="text-left cursor-pointer block"
            >
              <span className="block text-[13px] tracking-[0.18em] uppercase text-[#FFB3D1] mb-2">
                Curated Nigerian Pre-Order House
              </span>
              <span className="inline-flex items-center gap-2.5">
                <BrandMark className="h-[36px] w-auto object-contain shrink-0 block" />
                <span className="font-display text-2xl sm:text-3xl font-medium tracking-[0.01em] text-white">
                  Pre Order With Tabsah
                </span>
              </span>
            </button>
            <p className="text-base text-white/80 leading-relaxed max-w-sm">
              Thoughtfully sourced home, fashion, beauty, and everyday objects delivered across
              Nigeria. Choose 50%, 75%, or 100% upfront at checkout and settle any remaining balance
              once your batch lands in Lagos.
            </p>
            <div className="pt-1">
              <a
                href={getWhatsAppUrl('Hello Pre Order With Tabsah, I would like to ask about an order.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.14em] uppercase font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-white stroke-[1.75]" />
                <span>WhatsApp Concierge</span>
              </a>
            </div>
          </div>

          {/* Departments */}
          <div className="lg:col-span-3">
            <h3 className="font-sans text-[13px] tracking-[0.18em] uppercase font-semibold text-[#FFB3D1] mb-5">
              Departments
            </h3>
            <ul className="space-y-2.5 text-[15px] text-white/80">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => navigate({ page: 'shop', categorySlug: cat.slug })}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              <li className="pt-1">
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop' })}
                  className="text-[13px] tracking-[0.13em] uppercase text-white underline underline-offset-4 hover:text-[#FFB3D1] cursor-pointer"
                >
                  All 11 Categories
                </button>
              </li>
            </ul>
          </div>

          {/* Client Care */}
          <div className="lg:col-span-2">
            <h3 className="font-sans text-[13px] tracking-[0.18em] uppercase font-semibold text-[#FFB3D1] mb-5">
              Client Care
            </h3>
            <ul className="space-y-2.5 text-[15px] text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'info', slug: 'preorder-terms' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pre-Order Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'info', slug: 'delivery-info' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Delivery Information
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'info', slug: 'refund-policy' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'info', slug: 'privacy-policy' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'info', slug: 'contact' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Account & Lagos Hub */}
          <div className="lg:col-span-3">
            <h3 className="font-sans text-[13px] tracking-[0.18em] uppercase font-semibold text-[#FFB3D1] mb-5">
              Account & Hub
            </h3>
            <ul className="space-y-2.5 text-[15px] text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'account', tab: 'orders' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Orders & Balance Payment
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'login' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Customer Login
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'admin', tab: 'overview' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Seller Admin Dashboard
                </button>
              </li>
            </ul>
            <div className="mt-6 pt-5 border-t border-white/15 text-sm text-white/75 space-y-1.5 leading-relaxed">
              <p className="text-white font-medium">{settings.businessName}</p>
              <p>{settings.storeAddress}</p>
              <p>{settings.storeWhatsAppNumber}</p>
              <p>
                <a
                  href={`mailto:${settings.storeEmail}`}
                  className="hover:text-white underline underline-offset-4 transition-colors"
                >
                  {settings.storeEmail}
                </a>
              </p>
              <p>
                Instagram:{' '}
                <a
                  href={settings.storeInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFB3D1] hover:text-white underline underline-offset-4 transition-colors"
                >
                  {settings.storeInstagramHandle}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/70">
          <p>© 2026 Pre Order With Tabsah. All rights reserved. Prices in Nigerian Naira (₦).</p>
          <p>Delivering to Lagos, Abuja, Port Harcourt, and all 36 states.</p>
        </div>
      </div>
    </footer>
  );
};
