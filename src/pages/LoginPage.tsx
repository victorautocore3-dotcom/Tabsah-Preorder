import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface LoginPageProps {
  redirectTo?: 'checkout' | 'account';
}

export const LoginPage: React.FC<LoginPageProps> = ({ redirectTo = 'account' }) => {
  const { loginCustomer, registerCustomer, navigate } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await loginCustomer(email, password);
      if (!res.ok) {
        setError(res.error ?? 'Could not sign in.');
        return;
      }
      if (res.isAdmin) {
        navigate({ page: 'admin', tab: 'overview' });
      } else if (redirectTo === 'checkout') {
        navigate({ page: 'checkout' });
      } else {
        navigate({ page: 'account', tab: 'orders' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    if (password.trim().length < 6) {
      setError('Please choose a password with at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await registerCustomer({
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
      if (res.needsEmailConfirmation) {
        setInfoMessage(
          res.message ??
            'Account created. Please check your email inbox to confirm your address, then sign in.'
        );
        setMode('login');
        return;
      }
      if (res.isAdmin) {
        navigate({ page: 'admin', tab: 'overview' });
      } else if (redirectTo === 'checkout') {
        navigate({ page: 'checkout' });
      } else {
        navigate({ page: 'account', tab: 'orders' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <div className="min-w-0 border border-[#F0D9E3] bg-white p-5 sm:p-10">
        {redirectTo === 'checkout' && (
          <div className="mb-6 bg-[#FFF1F6] border border-[#F0D9E3] px-4 py-3 text-base text-[#52005C]">
            Please sign in or create an account to complete your pre-order checkout. Your shopping
            bag items are saved.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-5 sm:gap-6 border-b border-[#EFE5EA] mb-8">
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
              setInfoMessage('');
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

        {infoMessage && (
          <p
            role="status"
            className="mb-6 text-base font-medium text-[#52005C] bg-[#FFF1F6] border border-[#F0D9E3] px-4 py-3"
          >
            {infoMessage}
          </p>
        )}

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
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {submitting
                  ? 'Signing In...'
                  : redirectTo === 'checkout'
                    ? 'Sign In & Continue to Checkout'
                    : 'Sign In to My Orders'}
              </span>
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
                autoComplete="name"
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
                  autoComplete="email"
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
                  autoComplete="tel"
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
                autoComplete="street-address"
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-11 px-3.5 border border-[#F0D9E3] text-base text-[#222222] focus:border-[#E8005F] focus:outline-none"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-base font-medium text-[#991B1B] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#E8005F] hover:bg-[#C4004F] disabled:opacity-60 text-white text-[13px] tracking-[0.16em] uppercase font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
