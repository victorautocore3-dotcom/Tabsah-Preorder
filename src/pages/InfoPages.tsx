import React, { useState } from 'react';
import { Check, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatNaira } from '../data/storeData';

interface InfoPagesProps {
  slug: 'preorder-terms' | 'refund-policy' | 'privacy-policy' | 'delivery-info' | 'contact';
}

export const InfoPages: React.FC<InfoPagesProps> = ({ slug }) => {
  const { settings, navigate, getWhatsAppUrl } = useStore();
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sent, setSent] = useState(false);

  const infoLinks: { slug: InfoPagesProps['slug']; label: string }[] = [
    { slug: 'preorder-terms', label: 'Pre-Order Terms' },
    { slug: 'delivery-info', label: 'Delivery Information' },
    { slug: 'refund-policy', label: 'Refund Policy' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'contact', label: 'Contact Us' },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setContactName('');
    setContactPhone('');
    setContactMsg('');
  };

  return (
    <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Quiet Editorial Sidebar */}
        <aside className="lg:col-span-3 lg:border-r lg:border-[#EFE5EA] lg:pr-8">
          <p className="text-[13px] tracking-[0.18em] uppercase font-medium text-[#52005C] mb-4">
            Store Information
          </p>
          <nav className="flex lg:flex-col gap-4 lg:gap-1 overflow-x-auto pb-2 lg:pb-0">
            {infoLinks.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => navigate({ page: 'info', slug: item.slug })}
                className={`py-2.5 text-[13px] tracking-[0.13em] uppercase text-left whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b ${
                  slug === item.slug
                    ? 'border-[#E8005F] text-[#E8005F] font-semibold'
                    : 'border-transparent lg:border-[#F3E7EC] text-[#666666] hover:text-[#E8005F]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Body */}
        <article className="lg:col-span-9 max-w-3xl space-y-8">
          {slug === 'preorder-terms' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-2">
                  Updated November 2026
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
                  Pre-Order Terms
                </h1>
              </div>

              <div className="space-y-7 text-base text-[#4A4A4A] leading-relaxed">
                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    1. How upfront payment secures your item
                  </h2>
                  <p>
                    Every product listed on Pre Order With Tabsah is ordered specifically for our
                    batch customers. At checkout, you can choose to pay 50%, 75%, or 100% (pay in
                    full) upfront across your full order total (products plus delivery fee). Your
                    upfront payment locks in your item price in naira and reserves your unit with
                    our international supplier.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    2. Expected arrival dates
                  </h2>
                  <p>
                    Each product displays its expected arrival date at our Lagos hub (
                    {settings.businessName}, {settings.storeAddress}). Most air cargo batches
                    arrive on or before the stated date. If airline schedules or customs clearance
                    cause a short delay of 3 to 5 working days, we will notify you promptly on
                    WhatsApp and email.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    3. Paying your remaining balance
                  </h2>
                  <p>
                    If you chose 50% or 75% upfront, once your batch lands in Lagos and passes our
                    physical quality check, we update your order status to Balance due and send you
                    a WhatsApp message. You can settle the remaining balance directly inside your
                    Customer Dashboard. Nothing is delivered until the full amount is paid. Orders
                    paid 100% in full at checkout move straight to dispatch once inspected.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    4. Holding period after arrival
                  </h2>
                  <p>
                    We hold arrived pre-order items safely at our Lagos hub ({settings.storeAddress}
                    ) for up to 14 days from the arrival notification date. If you need extra time
                    because you are travelling, simply message us on WhatsApp or email{' '}
                    <a
                      href={`mailto:${settings.storeEmail}`}
                      className="font-medium text-[#E8005F] hover:text-[#52005C] underline underline-offset-4"
                    >
                      {settings.storeEmail}
                    </a>{' '}
                    so we can note it on your order.
                  </p>
                </div>
              </div>
            </>
          )}

          {slug === 'refund-policy' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-2">
                  Fair and Clear
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
                  Refund Policy
                </h1>
              </div>

              <div className="space-y-7 text-base text-[#4A4A4A] leading-relaxed">
                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    1. Supplier stock shortage or long delay
                  </h2>
                  <p>
                    If a supplier runs out of your item before shipment, or if a batch is delayed by
                    more than 14 days past its expected arrival date, you are entitled to a 100%
                    refund of your deposit back to your Nigerian bank account within 48 hours.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    2. Damaged or incorrect items
                  </h2>
                  <p>
                    We inspect every item in Lagos before sending it out. If an item arrives damaged
                    in transit or differs from what you ordered, contact us on WhatsApp within 48
                    hours of delivery with a clear photo. We will arrange a free replacement or a
                    full refund.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    3. Change of mind after ordering
                  </h2>
                  <p>
                    Because we purchase and pay overseas suppliers on your behalf as soon as a batch
                    closes, deposits cannot be refunded for change of mind once procurement has
                    started. However, if you reach out within 24 hours of placing your order, we
                    will gladly cancel and refund your deposit or move it to another item.
                  </p>
                </div>
              </div>
            </>
          )}

          {slug === 'privacy-policy' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-2">
                  Your Data, Protected
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
                  Privacy Policy
                </h1>
              </div>

              <div className="space-y-7 text-base text-[#4A4A4A] leading-relaxed">
                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    1. Information we collect
                  </h2>
                  <p>
                    When you place a pre-order or create an account, we collect your name, WhatsApp
                    phone number, email address, and delivery address. We collect only what we need
                    to keep you updated on your batch and deliver your parcel safely.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    2. How we use your details
                  </h2>
                  <p>
                    Your WhatsApp number and email are used for order confirmations, arrival
                    updates, balance reminders, and courier coordination. We never sell, rent, or
                    share your phone number or email with third-party marketers.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    3. Updating or removing your details
                  </h2>
                  <p>
                    You can update your name, WhatsApp number, email, and saved delivery address at
                    any time inside your Customer Dashboard under My Details, or email us at{' '}
                    <strong>{settings.storeEmail}</strong> for account removal.
                  </p>
                </div>
              </div>
            </>
          )}

          {slug === 'delivery-info' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-2">
                  Nationwide Logistics
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
                  Delivery Information
                </h1>
              </div>

              <p className="text-base text-[#4A4A4A] leading-relaxed">
                All pre-order batches arrive at our Lagos hub ({settings.businessName},{' '}
                {settings.storeAddress}). Nothing is delivered until the full amount is paid. As
                soon as your order is paid in full and inspected, your parcel is packed and handed
                to our dispatch riders or trusted interstate courier partners.
              </p>

              <div className="divide-y divide-[#F0D9E3] border-t border-b border-[#F0D9E3]">
                {settings.deliveryFees.map((zone) => (
                  <div
                    key={zone.id}
                    className="py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <h2 className="font-display text-2xl font-medium text-[#222222]">
                        {zone.label}
                      </h2>
                      <p className="text-base text-[#555555]">{zone.description}</p>
                      <p className="text-sm text-[#52005C]">{zone.estimatedDays}</p>
                    </div>
                    <span className="font-display text-2xl font-medium text-[#E8005F] tabular-nums shrink-0">
                      {formatNaira(zone.feeNaira)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-6 text-base text-[#3D3D3D] leading-relaxed">
                <strong className="text-[#52005C]">Hub Pickup in Ikorodu:</strong> Prefer to send
                your own rider or pick up in person at {settings.storeAddress}? Let us know on
                WhatsApp once your order is paid in full, and we will confirm your pickup slot
                (Monday to Saturday, 9:00 AM to 6:00 PM WAT).
              </div>
            </>
          )}

          {slug === 'contact' && (
            <>
              <div className="pb-6 border-b border-[#F0D9E3]">
                <p className="text-[13px] tracking-[0.18em] uppercase text-[#52005C] mb-2">
                  Client Concierge
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-medium text-[#222222]">
                  Contact Pre Order With Tabsah
                </h1>
              </div>

              <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div>
                  <h2 className="font-display text-2xl font-medium text-[#222222]">
                    Fastest way to reach us: WhatsApp
                  </h2>
                  <p className="mt-1.5 text-base text-[#4A4A4A]">
                    Chat directly with our Lagos team for batch dates, sizing, bulk requests, or
                    order updates.
                  </p>
                </div>
                <a
                  href={getWhatsAppUrl('Hello Pre Order With Tabsah, I have a question.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-white stroke-[1.75]" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-2">
                <div className="space-y-5 text-base text-[#4A4A4A]">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#E8005F] shrink-0 mt-1.5" />
                    <div>
                      <p className="font-semibold text-[#222222]">{settings.businessName}</p>
                      <p>{settings.storeAddress}</p>
                      <p className="text-sm text-[#666666] mt-1">
                        Monday to Saturday, 9:00 AM to 6:00 PM WAT
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-4 h-4 text-[#E8005F] shrink-0 mt-1.5" />
                    <div>
                      <p className="font-semibold text-[#222222]">WhatsApp Desk</p>
                      <p>{settings.storeWhatsAppNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-[#E8005F] shrink-0 mt-1.5" />
                    <div>
                      <p className="font-semibold text-[#222222]">Email</p>
                      <p>
                        <a
                          href={`mailto:${settings.storeEmail}`}
                          className="text-[#4A4A4A] hover:text-[#E8005F] underline underline-offset-4 transition-colors"
                        >
                          {settings.storeEmail}
                        </a>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Instagram className="w-4 h-4 text-[#E8005F] shrink-0 mt-1.5" />
                    <div>
                      <p className="font-semibold text-[#222222]">Instagram</p>
                      <p>
                        <a
                          href={settings.storeInstagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#E8005F] hover:text-[#52005C] font-medium underline underline-offset-4 transition-colors"
                        >
                          {settings.storeInstagramHandle}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  {sent ? (
                    <div className="bg-[#FFF1F6] border border-[#F0D9E3] p-7 text-center space-y-2.5">
                      <Check className="w-6 h-6 text-[#E8005F] mx-auto" />
                      <h3 className="font-display text-2xl font-medium text-[#222222]">
                        Message received
                      </h3>
                      <p className="text-base text-[#4A4A4A]">
                        Thank you for reaching out. Our team will respond on WhatsApp shortly.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSent(false)}
                        className="pt-2 text-[13px] tracking-[0.13em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 cursor-pointer"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <label
                          htmlFor="c-name"
                          className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-1.5"
                        >
                          Your Name
                        </label>
                        <input
                          id="c-name"
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Full name"
                          className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="c-phone"
                          className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-1.5"
                        >
                          WhatsApp Number
                        </label>
                        <input
                          id="c-phone"
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="+234 803 000 0000"
                          className="w-full h-11 px-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="c-msg"
                          className="block text-[13px] tracking-[0.11em] uppercase font-medium text-[#4A4A4A] mb-1.5"
                        >
                          How can we help?
                        </label>
                        <textarea
                          id="c-msg"
                          rows={3}
                          required
                          value={contactMsg}
                          onChange={(e) => setContactMsg(e.target.value)}
                          placeholder="Tell us the product name or order number..."
                          className="w-full p-3.5 border border-[#F0D9E3] focus:border-[#E8005F] focus:outline-none text-base"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 px-5 bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold transition-colors cursor-pointer"
                      >
                        Send Message
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
};
