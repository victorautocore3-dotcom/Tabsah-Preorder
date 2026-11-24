import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const LoginPage: React.FC = () => {
  const { loginCustomer, registerCustomer, navigate } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = loginCustomer(email, password);
    if (!res.ok) {
      setError(res.error ?? 'Could not sign in.');
      return;
    }
    navigate({ page: 'account', tab: 'orders' });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.trim().length < 6) {
      setError('Please choose a password with at least 6 characters.');
      return;
    }
    const res = registerCustomer({
      name,
      email,
      whatsApp,
      deliveryAddress,
      password,
    });
    if (!res.ok) {
      setError(res.error ?? 'Could not create account.');
      return;
    }
    navigate({ page: 'account', tab: 'orders' });
  };

  const handleDemoCustomerLogin = () => {
    const res = loginCustomer('amaka.okafor@example.com', 'tabsah2026');
    if (res.ok) {
      navigate({ page: 'account', tab: 'orders' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Auth Column */}
        <div className="lg:col-span-7 border border-[#F0D9E3] bg-white p-7 sm:p-10">
          <div className="flex items-center gap-6 border-b border-[#EFE5EA] mb-8">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`pb-3 text-[13px] tracking-[0.14em] uppercase font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'login'
                  ? 'border-[#E8005F] text-[#E8005F]'
                  : 'border-transparent text-[#666666] hover:text-[#222222]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`pb-3 text-[13px] tracking-[0.14em] uppercase font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'register'
                  ? 'border-[#E8005F] text-[#E8005F]'
                  : 'border-transparent text-[#666666] hover:text-[#222222]'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                  Customer Portal
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222]">
                  Sign in to your account
                </h1>
                <p className="mt-2 text-base text-[#555555] leading-relaxed">
                  Track your pre-orders, check expected arrival dates, and pay balances due.
                </p>
              </div>

              <div>
                <label
                  htmlFor="login-email"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amaka.okafor@example.com"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full h-12 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Sign In to My Orders</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-1.5">
                  New Customer
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-medium text-[#222222]">
                  Create a Tabsah account
                </h1>
                <p className="mt-2 text-base text-[#555555] leading-relaxed">
                  Save your WhatsApp contact and delivery address for quicker pre-orders.
                </p>
              </div>

              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Folake Balogun"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-whatsapp"
                    className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                  >
                    WhatsApp Number
                  </label>
                  <input
                    id="reg-whatsapp"
                    type="tel"
                    required
                    value={whatsApp}
                    onChange={(e) => setWhatsApp(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-address"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  Delivery Address
                </label>
                <input
                  id="reg-address"
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, area, city, state"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-2"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full h-12 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Side Helper Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-7 space-y-4">
            <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C]">
              Demo Access
            </p>
            <h2 className="font-display text-2xl font-medium text-[#222222]">
              Explore a sample customer account
            </h2>
            <p className="text-base text-[#4A4A4A] leading-relaxed">
              Inspect a populated dashboard with active pre-orders, a balance ready to pay, and a
              delivered Lagos order.
            </p>
            <div className="bg-white border border-[#F0D9E3] p-4 text-sm text-[#4A4A4A] space-y-1">
              <p>
                <strong className="text-[#222222]">Email:</strong> amaka.okafor@example.com
              </p>
              <p>
                <strong className="text-[#222222]">Password:</strong> tabsah2026
              </p>
            </div>
            <button
              type="button"
              onClick={handleDemoCustomerLogin}
              className="w-full py-3.5 px-4 bg-[#52005C] hover:bg-[#3D0045] text-white text-[13px] tracking-[0.14em] uppercase font-semibold transition-colors cursor-pointer"
            >
              Sign In as Amaka Okafor
            </button>
          </div>

          <div className="border border-[#F0D9E3] bg-white p-7 space-y-3">
            <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C]">
              Store Operations
            </p>
            <h2 className="font-display text-2xl font-medium text-[#222222]">
              Seller Admin Portal
            </h2>
            <p className="text-base text-[#555555] leading-relaxed">
              Manage pre-order products, open or close batches, update customer order statuses,
              review payments, and edit store settings.
            </p>
            <button
              type="button"
              onClick={() => navigate({ page: 'admin', tab: 'overview' })}
              className="pt-1 inline-flex items-center gap-2 text-[13px] tracking-[0.14em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 cursor-pointer"
            >
              <span>Open Admin Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
