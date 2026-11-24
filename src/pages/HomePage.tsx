import React, { useEffect, useState } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { ProductImage } from '../components/ProductImage';
import { RevealSection } from '../components/RevealSection';

const EDITORIAL_HERO_IMAGE = '/src/assets/images/editorial_hero_boutique_1795468832034.jpg';
const HERO_SLIDE_BAGS_IMAGE = '/src/assets/images/bags_cabin_suitcase_1795466512382.jpg';
const HERO_SLIDE_KITCHEN_IMAGE = '/src/assets/images/kitchen_air_fryer_1795466512213.jpg';
const HERO_SLIDE_FASHION_IMAGE = '/src/assets/images/fashion_linen_coord_1795467274156.jpg';

const EDITORIAL_STORY_CURATION = '/src/assets/images/editorial_story_curation_1795468831428.jpg';
const EDITORIAL_STORY_LIVING = '/src/assets/images/editorial_story_living_1795468832033.jpg';

const HERO_INTERVAL_MS = 6000;

export const HomePage: React.FC = () => {
  const { categories, products, navigate, getWhatsAppUrl } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [timerResetKey, setTimerResetKey] = useState(0);

  const heroSlides = [
    {
      id: 'slide-1',
      image: EDITORIAL_HERO_IMAGE,
      alt: 'Curated home objects, cognac leather tote, brass lamp, and folded linen on a travertine bench',
      kicker: 'November and December 2026 Batches',
      headline: 'Good objects, ordered with intention.',
      subline:
        'Pre-order curated home, fashion, beauty, and everyday finds for Nigeria with flexible 50%, 75%, or 100% upfront payment and clear arrival dates.',
      ctaLabel: 'Explore Pre-Orders',
      onAction: () => navigate({ page: 'shop' }),
    },
    {
      id: 'slide-2',
      image: HERO_SLIDE_BAGS_IMAGE,
      alt: 'Hardshell carry-on cabin suitcase with brushed metallic handle',
      kicker: 'Bags and Luggage',
      headline: 'Made for Lagos weekdays and Abuja weekends.',
      subline:
        'Polycarbonate cabin luggage and structured pebbled leather totes, reserved with 50%, 75%, or 100% upfront payment.',
      ctaLabel: 'Shop Bags and Luggage',
      onAction: () => navigate({ page: 'shop', categorySlug: 'bags-and-luggage' }),
    },
    {
      id: 'slide-3',
      image: HERO_SLIDE_KITCHEN_IMAGE,
      alt: 'Dual basket digital air fryer in matte black and brushed stainless steel',
      kicker: 'Home and Kitchen',
      headline: 'Thoughtful appliances for calmer kitchens.',
      subline:
        'Dual basket air fryers, portable glass blenders, and rechargeable standing fans checked for Nigerian voltage.',
      ctaLabel: 'Shop Home and Kitchen',
      onAction: () => navigate({ page: 'shop', categorySlug: 'home-and-kitchen' }),
    },
    {
      id: 'slide-4',
      image: HERO_SLIDE_FASHION_IMAGE,
      alt: 'Tailored linen shirt paired with warm cream pleated trousers',
      kicker: 'Fashion and Clothing',
      headline: 'Easy tailoring built for warm afternoons.',
      subline:
        'Breathable linen co-ord sets and structured blazers arriving in our December Lagos batch.',
      ctaLabel: 'Shop Fashion and Clothing',
      onAction: () => navigate({ page: 'shop', categorySlug: 'fashion-and-clothing' }),
    },
  ];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, HERO_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [heroSlides.length, timerResetKey]);

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index);
    setTimerResetKey((prev) => prev + 1);
  };

  const featuredProducts = products.filter((p) => p.featured);
  const firstRowFeatured = featuredProducts.slice(0, 4);
  const secondRowFeatured = featuredProducts.slice(4, 8);

  const steps = [
    {
      num: '01',
      title: 'Pay a deposit',
      body: 'Pay 50 percent, 75 percent or the full amount upfront to reserve your chosen piece. Your naira price is fixed the moment you order.',
    },
    {
      num: '02',
      title: 'We order and ship your item',
      body: 'We source directly from verified international suppliers and bring your batch safely into our Lagos hub.',
    },
    {
      num: '03',
      title: 'Pay the balance and get delivery',
      body: 'Once your items land and pass inspection, settle any remaining balance and receive doorstep delivery anywhere in Nigeria.',
    },
  ];

  const trustPoints = [
    {
      kicker: 'TRANSPARENT DATES',
      title: 'Clear Arrival Windows',
      body: 'Every product displays its expected Lagos arrival date upfront, before you commit a deposit.',
    },
    {
      kicker: 'PROTECTED SPLIT',
      title: 'Deposit First, Balance Later',
      body: 'Choose 50%, 75%, or 100% upfront at checkout, and settle any remaining balance only when stock arrives.',
    },
    {
      kicker: 'HUMAN UPDATES',
      title: 'Direct WhatsApp Care',
      body: 'Receive calm, real updates on WhatsApp from supplier confirmation through customs clearance to dispatch.',
    },
    {
      kicker: 'NATIONWIDE REACH',
      title: 'Lagos to All 36 States',
      body: 'Doorstep riders across Lagos and tracked interstate delivery to Abuja, Port Harcourt, and nationwide.',
    },
  ];

  return (
    <div className="bg-white w-full max-w-full overflow-x-clip">
      {/* Full-Bleed 4-Slide Rotating Crossfade Hero */}
      <section
        aria-roledescription="carousel"
        aria-label="Featured pre-order collections"
        className="relative w-full max-w-full min-h-[580px] sm:min-h-[76vh] lg:min-h-[84vh] overflow-hidden bg-[#222222]"
      >
        {heroSlides.map((slide, idx) => {
          const isActive = idx === activeSlide;
          return (
            <div
              key={slide.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <ProductImage
                src={slide.image}
                alt={slide.alt}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {/* Flat non-gradient scrim for crisp centered white typography */}
              <div className="absolute inset-0 bg-[#1C0020]/50" aria-hidden="true" />

              <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-10 pt-14 pb-20 sm:py-28 lg:py-32 text-center flex flex-col items-center justify-center min-w-0">
                <p className="text-[13px] tracking-[0.18em] sm:tracking-[0.22em] uppercase font-medium text-[#FFB3D1] mb-4 sm:mb-5 max-w-full">
                  {slide.kicker}
                </p>
                {idx === 0 ? (
                  <h1 className="font-display text-[clamp(1.9rem,8vw,4.25rem)] font-normal text-white leading-[1.08] sm:leading-[1.06] text-balance w-full max-w-3xl break-words">
                    {slide.headline}
                  </h1>
                ) : (
                  <h2 className="font-display text-[clamp(1.9rem,8vw,4.25rem)] font-normal text-white leading-[1.08] sm:leading-[1.06] text-balance w-full max-w-3xl break-words">
                    {slide.headline}
                  </h2>
                )}
                <p className="mt-5 sm:mt-6 text-base sm:text-lg text-white/90 leading-relaxed w-full max-w-xl font-normal break-words">
                  {slide.subline}
                </p>
                <div className="mt-8 sm:mt-10 w-full flex justify-center">
                  <button
                    type="button"
                    tabIndex={isActive ? 0 : -1}
                    onClick={slide.onAction}
                    className="inline-flex items-center justify-center gap-2.5 sm:gap-3 px-5 sm:px-8 py-3.5 sm:py-4 max-w-full bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.14em] sm:tracking-[0.18em] uppercase font-semibold transition-colors text-center sm:whitespace-nowrap cursor-pointer"
                  >
                    <span>{slide.ctaLabel}</span>
                    <ArrowRight className="w-4 h-4 stroke-[1.75] shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* 4 Centered Pagination Dots Only (Current Dot Hollow Hot Pink, Others Filled White) */}
        <div
          role="group"
          aria-label="Slide controls"
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
        >
          {heroSlides.map((slide, idx) => {
            const isCurrent = idx === activeSlide;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => handleSelectSlide(idx)}
                aria-label={`Load slide ${idx + 1} of ${heroSlides.length}`}
                aria-current={isCurrent ? 'true' : undefined}
                className="p-2 flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-[#E8005F]"
              >
                <span
                  aria-hidden="true"
                  className={`block w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    isCurrent
                      ? 'bg-transparent border-[2px] border-[#E8005F]'
                      : 'bg-white/85 hover:bg-[#FFB3D1] border border-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* 3-Step Editorial How Pre-Order Works Strip */}
      <RevealSection>
        <section id="how-it-works" className="border-b border-[#F0D9E3] bg-white">
          <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#EFE5EA]">
              <div>
                <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                  How Pre-Order Works
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#222222]">
                  Three calm steps from order to doorstep.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate({ page: 'info', slug: 'preorder-terms' })}
                className="text-[13px] tracking-[0.14em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                Read Pre-Order Terms
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EFE5EA] pt-2">
              {steps.map((step, index) => (
                <div
                  key={step.num}
                  className={`py-7 md:py-8 ${
                    index === 0
                      ? 'md:pr-10'
                      : index === 1
                      ? 'md:px-10'
                      : 'md:pl-10'
                  }`}
                >
                  <span className="font-display text-3xl font-normal text-[#E8005F] tabular-nums block mb-3">
                    {step.num}
                  </span>
                  <h3 className="font-display text-2xl font-medium text-[#222222] mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-base text-[#555555] leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Featured Pre-Orders: First Editorial Row */}
      <RevealSection>
        <section className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                Curated Selection
              </p>
              <h2 className="font-display text-3xl sm:text-[42px] font-medium text-[#222222] leading-tight">
                Featured Pre-Orders
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className="inline-flex items-center gap-2 text-[13px] tracking-[0.14em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 whitespace-nowrap self-start sm:self-auto cursor-pointer"
            >
              <span>View Full Catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-14">
            {firstRowFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </RevealSection>

      {/* Story-Led Section 1: The Curation and Inspection Story (Full-Bleed Background Photo) */}
      <RevealSection>
        <section className="relative w-full max-w-full min-h-[500px] sm:min-h-[540px] lg:min-h-[640px] flex items-center overflow-hidden bg-[#222222]">
          <ProductImage
            src={EDITORIAL_STORY_CURATION}
            alt="Inspected linen, wristwatch, glass fragrance, and twine-tied parcel on a sunlit travertine table"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Flat non-gradient scrim for crisp white editorial type */}
          <div className="absolute inset-0 bg-[#1C0020]/55" aria-hidden="true" />

          <div className="relative z-10 w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-32 min-w-0">
            <div className="max-w-2xl space-y-6 min-w-0">
              <p className="text-[13px] tracking-[0.22em] uppercase font-medium text-[#FFB3D1]">
                Our Standard
              </p>
              <h2 className="font-display text-[clamp(1.85rem,7.5vw,3.5rem)] font-normal text-white leading-[1.08] text-balance break-words">
                Inspected in Lagos before your balance is due.
              </h2>
              <p className="text-base text-white/90 leading-relaxed max-w-xl">
                Every Tabsah batch begins with careful supplier selection, voltage checks for
                Nigerian homes, and direct air cargo tracking. Nothing is drop-shipped blindly.
              </p>
              <p className="text-base text-white/90 leading-relaxed max-w-xl">
                When your batch lands at our Lagos hub in Ikorodu, our team opens, inspects, and
                packs every order by hand before sending your balance invoice on WhatsApp.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', categorySlug: 'home-and-kitchen' })}
                  className="inline-flex items-center gap-2.5 text-[13px] tracking-[0.18em] uppercase font-semibold text-white hover:text-[#FFB3D1] underline underline-offset-8 transition-colors cursor-pointer"
                >
                  <span>Explore Home and Kitchen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* All 11 Categories Editorial Gallery */}
      <RevealSection>
        <section className="bg-[#FFF1F6]">
          <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                  Shop by Department
                </p>
                <h2 className="font-display text-3xl sm:text-[42px] font-medium text-[#222222] leading-tight">
                  All Eleven Categories
                </h2>
              </div>
              <p className="text-base text-[#4A4A4A] max-w-md leading-relaxed">
                From kitchen essentials and tailored linen to travel luggage and automotive care,
                grouped cleanly for easy pre-ordering.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-10">
              {categories.map((cat) => {
                const count = products.filter((p) => p.categorySlug === cat.slug).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => navigate({ page: 'shop', categorySlug: cat.slug })}
                    className="group flex flex-col text-left cursor-pointer min-w-0"
                  >
                    <div className="aspect-[4/3] w-full bg-white overflow-hidden">
                      <ProductImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="pt-3.5 flex items-baseline justify-between gap-2 border-b border-[#EBCAD8] pb-3 min-w-0">
                      <h3 className="font-display text-lg sm:text-[22px] font-medium text-[#222222] group-hover:text-[#E8005F] transition-colors leading-snug min-w-0 break-words">
                        {cat.name}
                      </h3>
                      <span className="text-sm font-medium text-[#52005C] tabular-nums shrink-0">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Calm 12th editorial index tile in Deep Purple */}
              <button
                type="button"
                onClick={() => navigate({ page: 'shop' })}
                className="group flex flex-col justify-between bg-[#52005C] hover:bg-[#E8005F] text-white p-4 sm:p-8 text-left transition-colors cursor-pointer min-w-0"
              >
                <div className="min-w-0">
                  <p className="text-[13px] tracking-[0.16em] sm:tracking-[0.2em] uppercase text-[#FFB3D1] mb-2 sm:mb-3">
                    Full Index
                  </p>
                  <h3 className="font-display text-xl sm:text-3xl font-normal text-white leading-snug break-words">
                    View all {products.length} open pre-orders
                  </h3>
                </div>
                <div className="mt-6 sm:mt-8 inline-flex items-center gap-2 text-[13px] tracking-[0.14em] uppercase font-semibold text-white">
                  <span>Browse All</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FFB3D1] shrink-0" />
                </div>
              </button>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Featured Pre-Orders: Second Editorial Row */}
      {secondRowFeatured.length > 0 && (
        <RevealSection>
          <section className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <p className="text-[13px] tracking-[0.2em] uppercase font-medium text-[#52005C] mb-2">
                  Arriving This Season
                </p>
                <h2 className="font-display text-3xl sm:text-[42px] font-medium text-[#222222] leading-tight">
                  December Batch Highlights
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate({ page: 'shop' })}
                className="inline-flex items-center gap-2 text-[13px] tracking-[0.14em] uppercase font-semibold text-[#E8005F] hover:text-[#52005C] underline underline-offset-4 whitespace-nowrap self-start sm:self-auto cursor-pointer"
              >
                <span>See All Arrivals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-14">
              {secondRowFeatured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </RevealSection>
      )}

      {/* Story-Led Section 2: Travel and Everyday Wardrobe (Full-Bleed Background Photo) */}
      <RevealSection>
        <section className="relative w-full max-w-full min-h-[500px] sm:min-h-[540px] lg:min-h-[640px] flex items-center overflow-hidden bg-[#222222]">
          <ProductImage
            src={EDITORIAL_STORY_LIVING}
            alt="Hardshell carry-on suitcase, cognac leather tote bag, and sand suede loafers in sunlit studio"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Flat non-gradient scrim for crisp white editorial type */}
          <div className="absolute inset-0 bg-[#1C0020]/55" aria-hidden="true" />

          <div className="relative z-10 w-full max-w-[1380px] mx-auto px-4 sm:px-8 lg:px-12 py-20 sm:py-32 min-w-0">
            <div className="max-w-2xl space-y-6 min-w-0">
              <p className="text-[13px] tracking-[0.22em] uppercase font-medium text-[#FFB3D1]">
                The Travel and Wardrobe Edit
              </p>
              <h2 className="font-display text-[clamp(1.85rem,7.5vw,3.5rem)] font-normal text-white leading-[1.08] text-balance break-words">
                Made for Lagos weekdays and Abuja weekends.
              </h2>
              <p className="text-base text-white/90 leading-relaxed max-w-xl">
                From full-grain pebbled leather totes and polycarbonate cabin luggage to brushed
                suede loafers and breathable linen sets, we pick pieces that travel lightly and
                age gracefully in Nigerian weather.
              </p>
              <div className="pt-3 flex flex-wrap items-center gap-8">
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', categorySlug: 'bags-and-luggage' })}
                  className="inline-flex items-center gap-2.5 text-[13px] tracking-[0.18em] uppercase font-semibold text-white hover:text-[#FFB3D1] underline underline-offset-8 transition-colors cursor-pointer"
                >
                  <span>Bags and Luggage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', categorySlug: 'fashion-and-clothing' })}
                  className="inline-flex items-center gap-2.5 text-[13px] tracking-[0.18em] uppercase font-semibold text-white/90 hover:text-[#FFB3D1] underline underline-offset-8 transition-colors cursor-pointer"
                >
                  <span>Fashion and Clothing</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Press-Style Editorial Quote Strip */}
      <RevealSection>
        <section className="border-t border-b border-[#F0D9E3] bg-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
            <p className="text-[13px] tracking-[0.22em] uppercase font-medium text-[#52005C] mb-6">
              Shopper Notes
            </p>
            <blockquote className="font-display italic text-2xl sm:text-4xl font-normal text-[#222222] leading-[1.3] text-balance">
              &ldquo;Clear arrival dates, honest naira prices, and real WhatsApp updates from
              checkout to Lekki dispatch. Pre-ordering finally feels calm.&rdquo;
            </blockquote>
            <p className="mt-6 text-[13px] tracking-[0.16em] uppercase text-[#666666]">
              Amaka Okafor, Lekki Phase 1, Lagos
            </p>

            <div className="mt-12 pt-10 border-t border-[#EFE5EA] grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div>
                <p className="text-base text-[#4A4A4A] leading-relaxed">
                  &ldquo;My dual basket air fryer arrived two days ahead of schedule and came with
                  the exact UK plug promised.&rdquo;
                </p>
                <p className="mt-3 text-[13px] tracking-[0.13em] uppercase text-[#666666]">
                  Tunde Adeyemi, Ikeja
                </p>
              </div>
              <div>
                <p className="text-base text-[#4A4A4A] leading-relaxed">
                  &ldquo;Paying half upfront made budgeting easy. Dispatch to Wuse 2 took two days
                  after I settled my balance.&rdquo;
                </p>
                <p className="mt-3 text-[13px] tracking-[0.13em] uppercase text-[#666666]">
                  Zainab Bello, Abuja
                </p>
              </div>
              <div>
                <p className="text-base text-[#4A4A4A] leading-relaxed">
                  &ldquo;The leather work tote feels substantial and well stitched. Easily the most
                  transparent pre-order store I have used.&rdquo;
                </p>
                <p className="mt-3 text-[13px] tracking-[0.13em] uppercase text-[#666666]">
                  Ngozi Nwosu, Port Harcourt
                </p>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Calm Trust Commitments Band */}
      <RevealSection>
        <section className="bg-[#FFF1F6]">
          <div className="max-w-[1380px] mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
              {trustPoints.map((point) => (
                <div key={point.title} className="border-t border-[#E6C5D4] pt-5">
                  <p className="text-[13px] tracking-[0.18em] uppercase font-semibold text-[#52005C] mb-2">
                    {point.kicker}
                  </p>
                  <h3 className="font-display text-2xl font-medium text-[#222222] mb-2">
                    {point.title}
                  </h3>
                  <p className="text-base text-[#4A4A4A] leading-relaxed">{point.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-[#EBCAD8] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <p className="font-display text-2xl text-[#222222] min-w-0 break-words">
                Questions about sizing, voltage, or upcoming batches?
              </p>
              <a
                href={getWhatsAppUrl('Hello Tabsah, I would like help choosing a pre-order item.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 max-w-full bg-[#E8005F] hover:bg-[#C4004F] text-white text-[13px] tracking-[0.16em] uppercase font-semibold transition-colors text-center sm:whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 text-white stroke-[1.75] shrink-0" />
                <span>Message on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </RevealSection>
    </div>
  );
};
