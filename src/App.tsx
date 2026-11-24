/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { InfoPages } from './pages/InfoPages';

const AppShell: React.FC = () => {
  const { route, toast } = useStore();

  const renderPage = () => {
    switch (route.page) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return (
          <ShopPage
            initialCategorySlug={route.categorySlug}
            initialSearchQuery={route.searchQuery}
          />
        );
      case 'product':
        return <ProductDetailPage productSlug={route.productSlug} />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'login':
        return <LoginPage />;
      case 'account':
        return (
          <CustomerDashboardPage
            initialTab={route.tab}
            initialOrderId={route.orderId}
          />
        );
      case 'admin':
        return <AdminDashboardPage initialTab={route.tab} />;
      case 'info':
        return <InfoPages slug={route.slug} />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#222222]">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{renderPage()}</main>
      <Footer />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#52005C] text-white border border-[#E8005F] px-5 py-3.5 text-sm tracking-[0.02em] flex items-center gap-3"
        >
          <span className="w-1.5 h-1.5 bg-[#E8005F] shrink-0" aria-hidden="true" />
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
