/**
 * Single data file for Pre Order With Tabsah.
 * All categories, products, customers, orders, and payment records live here
 * so this module can later be replaced cleanly by a Supabase database layer.
 */

export type OrderStatus =
  | 'Deposit paid, waiting for stock'
  | 'Balance due'
  | 'Fully paid'
  | 'Shipped'
  | 'Delivered';

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'Deposit paid, waiting for stock',
  'Balance due',
  'Fully paid',
  'Shipped',
  'Delivered',
];

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  priceNaira: number;
  expectedArrivalDate: string; // e.g. "2026-12-08"
  batchCode: string;
  isPreOrderOpen: boolean;
  featured: boolean;
  image: string;
  gallery: string[];
  shortSummary: string;
  description: string;
  specifications: { label: string; value: string }[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  unitPriceNaira: number;
  quantity: number;
  expectedArrivalDate: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerWhatsApp: string;
  deliveryZoneId: string;
  deliveryZoneLabel: string;
  deliveryAddress: string;
  createdAt: string; // ISO date string YYYY-MM-DD
  expectedArrivalDate: string; // Latest arrival date among items
  items: OrderItem[];
  subtotalNaira: number;
  deliveryFeeNaira: number;
  fullTotalNaira: number;
  depositPercentageApplied: number;
  depositPaidNaira: number;
  balanceRemainingNaira: number;
  status: OrderStatus;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  type: 'Deposit' | 'Balance' | 'Full Payment';
  amountNaira: number;
  date: string; // YYYY-MM-DD
  method: string;
  status: 'Confirmed';
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  whatsApp: string;
  deliveryAddress: string;
  password: string;
  createdAt: string;
}

export function formatNaira(amount: number): string {
  const rounded = Math.round(amount);
  return `₦${rounded.toLocaleString('en-NG')}`;
}

export function formatArrivalDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = months[monthIndex] ?? '';
  return `${day} ${monthName} ${year}`;
}

export function calculateDepositAndBalance(fullTotal: number, depositPercentage: number) {
  const clamped = Math.max(10, Math.min(100, depositPercentage));
  const deposit = Math.round((fullTotal * clamped) / 100);
  const balance = Math.max(0, fullTotal - deposit);
  return { deposit, balance };
}

export const HERO_IMAGE = '/src/assets/images/hero_tabsah_storefront_1795466511400.jpg';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    slug: 'gadgets-and-electronics',
    name: 'Gadgets and Electronics',
    description: 'High capacity fast charging power banks and clear noise cancelling audio.',
    image: '/src/assets/images/tech_power_bank_1795466510574.jpg',
  },
  {
    id: 'cat-2',
    slug: 'fashion-and-clothing',
    name: 'Fashion and Clothing',
    description: 'Breathable tailored linen sets and structured workwear pieces for everyday elegance.',
    image: '/src/assets/images/fashion_linen_coord_1795467274156.jpg',
  },
  {
    id: 'cat-3',
    slug: 'shoes-and-footwear',
    name: 'Shoes and Footwear',
    description: 'Supple suede loafers and breathable knit sneakers built for comfort.',
    image: '/src/assets/images/shoes_suede_loafers_1795466511093.jpg',
  },
  {
    id: 'cat-4',
    slug: 'bags-and-luggage',
    name: 'Bags and Luggage',
    description: 'Structured leather work totes and durable polycarbonate cabin suitcases.',
    image: '/src/assets/images/bags_leather_tote_1795466511675.jpg',
  },
  {
    id: 'cat-5',
    slug: 'beauty-and-personal-care',
    name: 'Beauty and Personal Care',
    description: 'LED vanity mirrors, ionic hair brushes, cordless clippers, and long lasting perfumes.',
    image: '/src/assets/images/beauty_vanity_mirror_1795466511435.jpg',
  },
  {
    id: 'cat-6',
    slug: 'jewellery-and-accessories',
    name: 'Jewellery and Accessories',
    description: 'Minimalist stainless steel wristwatches and 18k gold plated everyday necklaces.',
    image: '/src/assets/images/watch_steel_minimal_1795466511299.jpg',
  },
  {
    id: 'cat-7',
    slug: 'home-and-kitchen',
    name: 'Home and Kitchen',
    description: 'Dual basket air fryers, portable glass blenders, and rechargeable standing fans.',
    image: '/src/assets/images/kitchen_air_fryer_1795466512213.jpg',
  },
  {
    id: 'cat-8',
    slug: 'baby-kids-and-toys',
    name: 'Baby Kids and Toys',
    description: 'Lightweight travel strollers, silicone feeding sets, and Montessori wooden toys.',
    image: '/src/assets/images/baby_travel_stroller_1795466511201.jpg',
  },
  {
    id: 'cat-9',
    slug: 'office-and-school-supplies',
    name: 'Office and School Supplies',
    description: 'Ergonomic aluminum laptop stands and executive stationery gift sets.',
    image: '/src/assets/images/office_laptop_stand_1795467273862.jpg',
  },
  {
    id: 'cat-10',
    slug: 'fitness-and-sports',
    name: 'Fitness and Sports',
    description: 'Smart body composition scales and extra-thick non-slip yoga and band kits.',
    image: '/src/assets/images/fitness_yoga_kit_1795467273212.jpg',
  },
  {
    id: 'cat-11',
    slug: 'automotive-accessories',
    name: 'Automotive Accessories',
    description: 'Portable cordless car tyre inflators and handheld car vacuum cleaners.',
    image: '/src/assets/images/auto_tyre_inflator_1795467272680.jpg',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Gadgets and Electronics
  {
    id: 'prod-15',
    slug: '30000mah-65w-fast-charge-power-bank',
    name: '30000mAh 65W Fast Charge Power Bank',
    categorySlug: 'gadgets-and-electronics',
    priceNaira: 49500,
    expectedArrivalDate: '2026-12-04',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/tech_power_bank_1795466510574.jpg',
    gallery: ['/src/assets/images/tech_power_bank_1795466510574.jpg'],
    shortSummary: 'Charges smartphones up to 6 times and powers USB-C laptops on the move.',
    description:
      'Built for remote workers, students, and travellers who cannot afford a dead battery. With 65W Power Delivery output, it fast-charges laptops, tablets, and phones simultaneously, and comes with a tough braided USB-C cable in the box.',
    specifications: [
      { label: 'Capacity', value: '30,000mAh High-Density Lithium Polymer' },
      { label: 'Max Output', value: '65W USB-C PD + Dual 22.5W USB-A Ports' },
      { label: 'Included Cable', value: '100W Braided USB-C to USB-C Cable' },
      { label: 'Casing', value: 'Matte Charcoal Anodised Aluminum' },
    ],
  },
  {
    id: 'prod-16',
    slug: 'active-noise-cancelling-wireless-earbuds',
    name: 'Active Noise Cancelling Wireless Earbuds',
    categorySlug: 'gadgets-and-electronics',
    priceNaira: 36000,
    expectedArrivalDate: '2026-12-11',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/tech_wireless_earbuds_1795466510472.jpg',
    gallery: ['/src/assets/images/tech_wireless_earbuds_1795466510472.jpg'],
    shortSummary: 'Clear calls, deep bass, and 36-hour total playtime in a pearl white case.',
    description:
      'Block out generator hum and traffic noise during calls or work sessions. Four beamforming microphones keep your voice crisp on phone and WhatsApp calls, and Bluetooth 5.3 switches smoothly between phone and laptop.',
    specifications: [
      { label: 'Noise Control', value: 'Hybrid ANC up to 42dB + Transparency Mode' },
      { label: 'Battery Life', value: '8 Hours Buds + 28 Hours Charging Case' },
      { label: 'Connectivity', value: 'Bluetooth 5.3 Dual-Device Pairing' },
      { label: 'Finish', value: 'Pearl White with Brushed Gold Trim' },
    ],
  },

  // 2. Fashion and Clothing
  {
    id: 'prod-23',
    slug: 'tailored-linen-two-piece-coord-set',
    name: 'Tailored Linen Two-Piece Co-Ord Set',
    categorySlug: 'fashion-and-clothing',
    priceNaira: 54000,
    expectedArrivalDate: '2026-12-07',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/fashion_linen_coord_1795467274156.jpg',
    gallery: ['/src/assets/images/fashion_linen_coord_1795467274156.jpg'],
    shortSummary: 'Cool, breathable olive linen button shirt paired with warm cream tailored trousers.',
    description:
      'Tailored for warm Nigerian afternoons, weekend lunches, and smart casual office days. Cut from pre-washed European linen blend fabric that drapes cleanly without feeling heavy or stiff.',
    specifications: [
      { label: 'Fabric', value: '70% Breathable Linen, 30% Combed Cotton' },
      { label: 'Sizes Available', value: 'S, M, L, XL, XXL (Confirm on WhatsApp)' },
      { label: 'Set Includes', value: 'Relaxed Collar Shirt + Pleated Trousers' },
      { label: 'Colours', value: 'Olive Moss & Warm Cream' },
    ],
  },
  {
    id: 'prod-24',
    slug: 'structured-wool-blend-double-breasted-blazer',
    name: 'Structured Wool Blend Double-Breasted Blazer',
    categorySlug: 'fashion-and-clothing',
    priceNaira: 72000,
    expectedArrivalDate: '2026-12-14',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/fashion_tailored_blazer_1795467272805.jpg',
    gallery: ['/src/assets/images/fashion_tailored_blazer_1795467272805.jpg'],
    shortSummary: 'Sharp charcoal tailored blazer with antique brass buttons and silky breathable lining.',
    description:
      'An instant wardrobe anchor for client presentations, dinners, and formal occasions. Features crisp peak lapels, structured shoulders, functional flap pockets, and a lightweight lining suited to air-conditioned offices and evening events.',
    specifications: [
      { label: 'Outer Fabric', value: 'Lightweight Fine Wool & Viscose Blend' },
      { label: 'Sizes Available', value: 'UK 8 to UK 18 / S to XXL' },
      { label: 'Detailing', value: '6-Button Double-Breasted Antique Brass Front' },
      { label: 'Colour', value: 'Deep Charcoal' },
    ],
  },

  // 3. Shoes and Footwear
  {
    id: 'prod-11',
    slug: 'warm-sand-suede-penny-loafers',
    name: 'Warm Sand Suede Penny Loafers',
    categorySlug: 'shoes-and-footwear',
    priceNaira: 52000,
    expectedArrivalDate: '2026-12-09',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/shoes_suede_loafers_1795466511093.jpg',
    gallery: ['/src/assets/images/shoes_suede_loafers_1795466511093.jpg'],
    shortSummary: 'Soft brushed suede loafers with cushioned leather insole and grippy lug sole.',
    description:
      'Smart enough for office days and relaxed enough for Sunday brunch. Made with soft sand suede uppers, breathable leather lining, and a flexible rubber lug sole that handles rainy Lagos pavements comfortably.',
    specifications: [
      { label: 'Upper', value: 'Genuine Brushed Calf Suede' },
      { label: 'Sizes Available', value: 'EU 38 to EU 45 (Specify in Order Note)' },
      { label: 'Sole', value: 'Flexible Anti-Slip Rubber Lug Sole' },
      { label: 'Colour', value: 'Warm Sand Suede' },
    ],
  },
  {
    id: 'prod-12',
    slug: 'breathable-knit-everyday-running-sneakers',
    name: 'Breathable Knit Everyday Running Sneakers',
    categorySlug: 'shoes-and-footwear',
    priceNaira: 44500,
    expectedArrivalDate: '2026-12-12',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/shoes_running_sneakers_1795467273686.jpg',
    gallery: ['/src/assets/images/shoes_running_sneakers_1795467273686.jpg'],
    shortSummary: 'Featherlight airflow knit trainers with responsive foam cushioning for all-day walking.',
    description:
      'Built for morning jogs, airport days, and busy errands. The engineered mesh knit lets heat escape easily while the sculpted EVA midsole cushions every step without weighing you down.',
    specifications: [
      { label: 'Upper', value: 'Breathable Engineered Stretch Knit Mesh' },
      { label: 'Sizes Available', value: 'EU 38 to EU 46' },
      { label: 'Midsole', value: 'High-Rebound Cushioned EVA Foam' },
      { label: 'Colours', value: 'Cream White & Forest Green' },
    ],
  },

  // 4. Bags and Luggage
  {
    id: 'prod-9',
    slug: 'structured-pebbled-leather-work-tote',
    name: 'Structured Pebbled Leather Work Tote',
    categorySlug: 'bags-and-luggage',
    priceNaira: 68500,
    expectedArrivalDate: '2026-12-10',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/bags_leather_tote_1795466511675.jpg',
    gallery: ['/src/assets/images/bags_leather_tote_1795466511675.jpg'],
    shortSummary: 'Roomy cognac pebbled leather tote that holds a 15-inch laptop with ease.',
    description:
      'A polished everyday work tote that holds its upright structure from morning meetings to evening errands. Crafted from supple pebbled leather with brushed gold hardware, protective metal base feet, and a zipped inner divider for laptops and documents.',
    specifications: [
      { label: 'Material', value: 'Full-Grain Pebbled Leather' },
      { label: 'Laptop Fit', value: 'Fits up to 15-Inch Laptop + A4 Folder' },
      { label: 'Dimensions', value: '36cm W x 27cm H x 14cm D' },
      { label: 'Colour', value: 'Cognac Tan with Brushed Gold Hardware' },
    ],
  },
  {
    id: 'prod-10',
    slug: 'hardshell-carry-on-cabin-suitcase-20-inch',
    name: 'Hardshell Carry-On Cabin Suitcase 20 Inch',
    categorySlug: 'bags-and-luggage',
    priceNaira: 84000,
    expectedArrivalDate: '2026-12-12',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/bags_cabin_suitcase_1795466512382.jpg',
    gallery: ['/src/assets/images/bags_cabin_suitcase_1795466512382.jpg'],
    shortSummary: 'Scratch-resistant polycarbonate cabin luggage with silent 360 spinner wheels.',
    description:
      'Built for smooth weekend trips between Lagos, Abuja, and international flights. The ribbed polycarbonate shell resists dents, the TSA combination lock keeps belongings secure, and the champagne gold telescopic handle glides effortlessly.',
    specifications: [
      { label: 'Size', value: '20 Inch Airline Cabin Approved (55 x 36 x 23cm)' },
      { label: 'Shell', value: 'German Makrolon Polycarbonate' },
      { label: 'Security', value: 'Built-In TSA Dual Combination Lock' },
      { label: 'Colour', value: 'Deep Forest Green & Champagne Gold' },
    ],
  },

  // 5. Beauty and Personal Care
  {
    id: 'prod-5',
    slug: 'oval-led-vanity-mirror-gold-trim',
    name: 'Oval LED Vanity Mirror with Organiser Tray',
    categorySlug: 'beauty-and-personal-care',
    priceNaira: 42000,
    expectedArrivalDate: '2026-12-03',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/beauty_vanity_mirror_1795466511435.jpg',
    gallery: ['/src/assets/images/beauty_vanity_mirror_1795466511435.jpg'],
    shortSummary: 'Touch-dimmable warm and daylight LED mirror with integrated dressing tray.',
    description:
      'Get natural, shadow-free lighting for skincare and makeup application at any hour. The brushed gold rim tilts smoothly to your preferred angle, while the sturdy matte white tray keeps daily brushes, lipsticks, and jewellery neatly in reach.',
    specifications: [
      { label: 'Lighting Modes', value: 'Warm, Neutral, and Cool Daylight LED' },
      { label: 'Power', value: 'USB-C Rechargeable Battery (3 Weeks Per Charge)' },
      { label: 'Dimensions', value: '32cm Height x 22cm Base Width' },
      { label: 'Materials', value: 'Brushed Brass Rim & Matte ABS Tray' },
    ],
  },
  {
    id: 'prod-7',
    slug: 'ceramic-ionic-oval-hot-air-brush',
    name: 'Ceramic Ionic Oval Hot Air Styling Brush',
    categorySlug: 'beauty-and-personal-care',
    priceNaira: 38500,
    expectedArrivalDate: '2026-11-29',
    batchCode: 'TB-NOV-04',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/hair_hot_brush_1795466511267.jpg',
    gallery: ['/src/assets/images/hair_hot_brush_1795466511267.jpg'],
    shortSummary: 'Dry, stretch, and smooth natural hair or wigs in one simple step.',
    description:
      'Cut blow-drying time in half with an oval ceramic barrel that adds volume while keeping heat evenly distributed. Mixed nylon pin and tufted bristles detangle gently without snagging, leaving silk presses and wig refreshes smooth and shiny.',
    specifications: [
      { label: 'Heat Settings', value: 'Cool, Low, and High with Ionic Flow' },
      { label: 'Power', value: '1200W, 220V to 240V Nigerian Voltage' },
      { label: 'Cord', value: '2 Metre 360 Degree Swivel Cord' },
      { label: 'Finish', value: 'Matte Black & Champagne Gold' },
    ],
  },
  {
    id: 'prod-8',
    slug: 'cordless-pro-gold-hair-clipper-set',
    name: 'Cordless Pro Gold Hair Clipper Set',
    categorySlug: 'beauty-and-personal-care',
    priceNaira: 46000,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/hair_cordless_clipper_1795466510961.jpg',
    gallery: ['/src/assets/images/hair_cordless_clipper_1795466510961.jpg'],
    shortSummary: 'Heavy-duty brushed gold cordless clipper with charging dock and 8 guard combs.',
    description:
      'Engineered for crisp home haircuts, beard line-ups, and barbershop reliability. Equipped with self-sharpening carbon steel blades, a clear LED battery display, a weighted charging dock, and 8 snap-on guard combs.',
    specifications: [
      { label: 'Battery Life', value: '240 Minutes Continuous Use' },
      { label: 'Motor Speed', value: '6800 RPM High-Torque Rotary Motor' },
      { label: 'Included', value: 'Clipper, Dock, 8 Guards, Oil & Brush' },
      { label: 'Finish', value: 'Brushed Gold & Deep Forest Grip' },
    ],
  },
  {
    id: 'prod-21',
    slug: 'amber-oud-eau-de-parfum-100ml',
    name: 'Amber Oud Eau de Parfum 100ml',
    categorySlug: 'beauty-and-personal-care',
    priceNaira: 48000,
    expectedArrivalDate: '2026-12-08',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/fragrance_amber_oud_1795466511233.jpg',
    gallery: ['/src/assets/images/fragrance_amber_oud_1795466511233.jpg'],
    shortSummary: 'Warm resinous amber, smooth sandalwood, and spiced oud that lasts all day.',
    description:
      'A rich, confident unisex fragrance bottled in heavy clear glass with a brushed gold magnetic cap. Opens with soft saffron and bergamot before settling into warm amber, cedarwood, and smooth oud that lingers for 10+ hours.',
    specifications: [
      { label: 'Concentration', value: 'Eau de Parfum (22% Oil Concentration)' },
      { label: 'Volume', value: '100ml Full Size Atomiser' },
      { label: 'Key Notes', value: 'Saffron, Golden Amber, Sandalwood, Soft Oud' },
      { label: 'Longevity', value: '10 to 12 Hours Skin & Fabric Wear' },
    ],
  },

  // 6. Jewellery and Accessories
  {
    id: 'prod-13',
    slug: 'emerald-dial-brushed-steel-wristwatch',
    name: 'Emerald Dial Brushed Steel Wristwatch',
    categorySlug: 'jewellery-and-accessories',
    priceNaira: 64000,
    expectedArrivalDate: '2026-12-07',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/watch_steel_minimal_1795466511299.jpg',
    gallery: ['/src/assets/images/watch_steel_minimal_1795466511299.jpg'],
    shortSummary: 'Sapphire-coated glass, deep emerald sunburst dial, and solid stainless steel strap.',
    description:
      'A refined unisex timepiece with a rich emerald sunburst dial and warm gold baton markers. Powered by a dependable Japanese quartz movement with 5ATM water resistance, presented in a clean gift box with a link adjustment pin.',
    specifications: [
      { label: 'Case Diameter', value: '39mm Brushed 316L Stainless Steel' },
      { label: 'Movement', value: 'Japanese Miyota Quartz' },
      { label: 'Water Resistance', value: '5ATM (Splash & Rain Safe)' },
      { label: 'Dial', value: 'Emerald Green Sunburst with Gold Hands' },
    ],
  },
  {
    id: 'prod-14',
    slug: '18k-gold-plated-layering-necklace-set',
    name: '18k Gold Plated Layering Necklace Set',
    categorySlug: 'jewellery-and-accessories',
    priceNaira: 26500,
    expectedArrivalDate: '2026-11-28',
    batchCode: 'TB-NOV-04',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/jewellery_gold_necklaces_1795466512047.jpg',
    gallery: ['/src/assets/images/jewellery_gold_necklaces_1795466512047.jpg'],
    shortSummary: 'Tarnish-resistant PVD gold herringbone chain and hammered medallion pendant duo.',
    description:
      'Two separate chains made to be worn together or on their own. Crafted on waterproof stainless steel with thick 18k PVD gold plating so it stays radiant in humid Nigerian weather without turning skin green.',
    specifications: [
      { label: 'Material', value: '18k PVD Gold Plated 316L Stainless Steel' },
      { label: 'Lengths', value: '40cm Herringbone + 45cm Pendant (5cm Extender)' },
      { label: 'Care', value: 'Waterproof, Sweat-Proof & Tarnish-Resistant' },
      { label: 'Packaging', value: 'Soft Velvet Drawstring Gift Pouch' },
    ],
  },

  // 7. Home and Kitchen
  {
    id: 'prod-1',
    slug: 'dual-basket-digital-air-fryer-8l',
    name: 'Dual Basket Digital Air Fryer 8L',
    categorySlug: 'home-and-kitchen',
    priceNaira: 128000,
    expectedArrivalDate: '2026-12-08',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/kitchen_air_fryer_1795466512213.jpg',
    gallery: ['/src/assets/images/kitchen_air_fryer_1795466512213.jpg'],
    shortSummary: 'Cook two dishes at once with independent temperature controls and sync finish.',
    description:
      'Designed for busy family kitchens, this 8-litre dual basket air fryer lets you roast chicken in one drawer and crisp plantain or yams in the other at the same time. The brushed stainless steel front wipes clean easily, and both non-stick drawers are simple to wash.',
    specifications: [
      { label: 'Capacity', value: '8 Litres (2 x 4L Independent Baskets)' },
      { label: 'Power Rating', value: '2200W, 220V to 240V (UK 3-Pin Plug)' },
      { label: 'Temperature Range', value: '80°C to 200°C Digital Touch Panel' },
      { label: 'Finish', value: 'Matte Black & Brushed Stainless Steel' },
    ],
  },
  {
    id: 'prod-2',
    slug: 'cordless-portable-glass-blender-pro',
    name: 'Cordless Portable Glass Blender Pro',
    categorySlug: 'home-and-kitchen',
    priceNaira: 34500,
    expectedArrivalDate: '2026-11-30',
    batchCode: 'TB-NOV-04',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/kitchen_portable_blender_1795466511299.jpg',
    gallery: ['/src/assets/images/kitchen_portable_blender_1795466511299.jpg'],
    shortSummary: 'USB-C rechargeable personal smoothie blender with thick borosilicate glass jar.',
    description:
      'Make fresh fruit smoothies, zobo blends, or protein shakes at the office, gym, or home without looking for a wall socket. Six stainless steel blades crush ice and frozen fruit smoothly, and one full USB-C charge delivers up to 15 blends.',
    specifications: [
      { label: 'Jar Capacity', value: '500ml Thick Borosilicate Glass' },
      { label: 'Battery', value: '4000mAh USB-C Rechargeable' },
      { label: 'Blades', value: '6-Leaf 304 Stainless Steel' },
      { label: 'Colour', value: 'Sage Green & Brushed Steel' },
    ],
  },
  {
    id: 'prod-3',
    slug: 'cordless-rechargeable-standing-fan-16-inch',
    name: 'Cordless Rechargeable Standing Fan 16 Inch',
    categorySlug: 'home-and-kitchen',
    priceNaira: 96000,
    expectedArrivalDate: '2026-12-05',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/home_standing_fan_1795466512112.jpg',
    gallery: ['/src/assets/images/home_standing_fan_1795466512112.jpg'],
    shortSummary: 'Whisper-quiet brushless standing fan with up to 18 hours battery runtime.',
    description:
      'Stay comfortable day and night even when power goes out. Built with a quiet brushless DC motor and a high-density lithium battery, this clean matte white standing fan blends neatly into modern bedrooms and living rooms while running for up to 18 hours on low speed.',
    specifications: [
      { label: 'Runtime', value: 'Up to 18 Hours (Low) / 6 Hours (High)' },
      { label: 'Motor', value: 'Low-Noise Brushless DC Motor' },
      { label: 'Charging', value: 'AC Mains & 12V Solar Panel Input' },
      { label: 'Height', value: 'Adjustable up to 112cm' },
    ],
  },

  // 8. Baby Kids and Toys
  {
    id: 'prod-17',
    slug: 'foldable-lightweight-travel-baby-stroller',
    name: 'Foldable Lightweight Travel Baby Stroller',
    categorySlug: 'baby-kids-and-toys',
    priceNaira: 142000,
    expectedArrivalDate: '2026-12-15',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/baby_travel_stroller_1795466511201.jpg',
    gallery: ['/src/assets/images/baby_travel_stroller_1795466511201.jpg'],
    shortSummary: 'One-hand compact fold stroller that fits neatly into car boots and overhead cabins.',
    description:
      'Make outings and family flights stress-free. Weighing just 6.2kg, this sturdy oatmeal-fabric stroller folds in seconds with one hand, reclines flat for naps, and features UPF 50+ sun canopy protection and smooth front suspension.',
    specifications: [
      { label: 'Weight', value: '6.2kg Ultra-Light Aluminum Frame' },
      { label: 'Age Range', value: 'Newborn to 36 Months (Up to 22kg)' },
      { label: 'Safety', value: '5-Point Padded Harness & One-Foot Brake' },
      { label: 'Colour', value: 'Warm Oatmeal Fabric & Tan Handlebar' },
    ],
  },
  {
    id: 'prod-18',
    slug: 'silicone-baby-feeding-gift-set',
    name: 'Silicone Baby Feeding Gift Set (4 Piece)',
    categorySlug: 'baby-kids-and-toys',
    priceNaira: 22500,
    expectedArrivalDate: '2026-11-29',
    batchCode: 'TB-NOV-04',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/baby_feeding_set_1795466511165.jpg',
    gallery: ['/src/assets/images/baby_feeding_set_1795466511165.jpg'],
    shortSummary: 'BPA-free food-grade silicone suction plate, catch-all bib, sippy cup, and spoon.',
    description:
      'Thoughtfully designed for baby-led weaning with less mess. The strong suction base keeps the divided plate firmly anchored to highchair trays, and every piece is microwave, freezer, and dishwasher safe.',
    specifications: [
      { label: 'Material', value: '100% Food-Grade BPA-Free Silicone & Bamboo' },
      { label: 'Pieces', value: 'Suction Plate, Pocket Bib, Sippy Cup, Soft Spoon' },
      { label: 'Care', value: 'Dishwasher & Microwave Safe (Excl. Bamboo Handle)' },
      { label: 'Colours', value: 'Soft Sage Green & Warm Sand' },
    ],
  },
  {
    id: 'prod-25',
    slug: 'wooden-montessori-building-blocks-rainbow-set',
    name: 'Wooden Montessori Building Blocks & Rainbow Toy Set',
    categorySlug: 'baby-kids-and-toys',
    priceNaira: 28500,
    expectedArrivalDate: '2026-12-10',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/toys_wooden_blocks_1795467272562.jpg',
    gallery: ['/src/assets/images/toys_wooden_blocks_1795467272562.jpg'],
    shortSummary: 'Smooth natural beechwood blocks and non-toxic rainbow arches for creative play.',
    description:
      'Encourage screen-free learning, balance, and early spatial thinking. Sanded smooth with rounded child-safe corners and finished in water-based sage and warm mustard paints, stored neatly in a solid wooden tray.',
    specifications: [
      { label: 'Material', value: 'Natural Kiln-Dried Beechwood & Water-Based Paint' },
      { label: 'Recommended Age', value: '18 Months to 6 Years' },
      { label: 'Included', value: '24-Piece Block Tray + 7-Arch Stacking Rainbow' },
      { label: 'Safety', value: 'EN71 Child-Safe Certified, Splinter-Free' },
    ],
  },

  // 9. Office and School Supplies
  {
    id: 'prod-26',
    slug: 'ergonomic-aluminum-adjustable-laptop-stand',
    name: 'Ergonomic Aluminum Adjustable Laptop Stand',
    categorySlug: 'office-and-school-supplies',
    priceNaira: 24000,
    expectedArrivalDate: '2026-12-04',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/office_laptop_stand_1795467273862.jpg',
    gallery: ['/src/assets/images/office_laptop_stand_1795467273862.jpg'],
    shortSummary: 'Foldable 6-level height riser that improves posture and keeps laptops cool.',
    description:
      'Work or study comfortably for hours without neck strain. Crafted from solid anodised aluminum with non-slip silicone grips, it folds flat into a backpack sleeve and allows full airflow under 11-inch to 16-inch laptops.',
    specifications: [
      { label: 'Compatibility', value: 'Fits 11-Inch to 16-Inch Laptops & Tablets' },
      { label: 'Height Levels', value: '6 Adjustable Ergonomic Angles' },
      { label: 'Material', value: 'CNC Anodised Aluminum Alloy + Silicone Pads' },
      { label: 'Portability', value: 'Folds Flat with Travel Pouch Included' },
    ],
  },
  {
    id: 'prod-27',
    slug: 'executive-hardcover-notebook-brass-pen-set',
    name: 'Executive Hardcover Notebook & Brass Fountain Pen Set',
    categorySlug: 'office-and-school-supplies',
    priceNaira: 19500,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/office_notebook_set_1795467273455.jpg',
    gallery: ['/src/assets/images/office_notebook_set_1795467273455.jpg'],
    shortSummary: 'Forest green A5 lay-flat journal with brushed brass fountain pen and canvas pouch.',
    description:
      'An understated desk companion for professionals, university students, and thoughtful gifting. Includes 200 thick 120gsm cream pages that resist ink bleed, a weighted brushed brass fountain pen with refillable converter, and a matching zippered stationery pouch.',
    specifications: [
      { label: 'Notebook Size', value: 'A5 Hardcover, 200 Ruled 120gsm Pages' },
      { label: 'Pen Included', value: 'Weighted Brushed Brass Medium Nib Fountain Pen' },
      { label: 'Extras', value: 'Canvas Zippered Desk Pouch & Ink Cartridges' },
      { label: 'Colour', value: 'Deep Forest Green & Brushed Gold' },
    ],
  },

  // 10. Fitness and Sports
  {
    id: 'prod-19',
    slug: 'smart-tempered-glass-body-scale',
    name: 'Smart Tempered Glass Body Scale',
    categorySlug: 'fitness-and-sports',
    priceNaira: 29000,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TB-DEC-01',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/fitness_smart_scale_1795466510405.jpg',
    gallery: ['/src/assets/images/fitness_smart_scale_1795466510405.jpg'],
    shortSummary: 'Measures weight, BMI, muscle mass, and hydration with clean LED display.',
    description:
      'Track your health goals accurately at home. Built with thick 6mm tempered glass and high-precision sensors, this minimalist white scale syncs effortlessly with Apple Health and Android fitness apps over Bluetooth.',
    specifications: [
      { label: 'Metrics', value: '13 Body Metrics Including Weight, BMI & Muscle' },
      { label: 'Max Capacity', value: '180kg (50g High-Precision Increments)' },
      { label: 'Power', value: 'USB-C Rechargeable (Up to 6 Months Standby)' },
      { label: 'Surface', value: 'Matte White 6mm Tempered Safety Glass' },
    ],
  },
  {
    id: 'prod-20',
    slug: 'non-slip-extra-thick-yoga-mat-resistance-bands-kit',
    name: 'Non-Slip Extra-Thick Yoga Mat & Resistance Bands Kit',
    categorySlug: 'fitness-and-sports',
    priceNaira: 31500,
    expectedArrivalDate: '2026-12-13',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/fitness_yoga_kit_1795467273212.jpg',
    gallery: ['/src/assets/images/fitness_yoga_kit_1795467273212.jpg'],
    shortSummary: '8mm cushioned TPE workout mat with cotton carry strap and 3 fabric glute bands.',
    description:
      'Everything you need for home pilates, stretching, and strength sessions. The 8mm high-density textured surface protects knees on tiled floors and grips firmly even during sweaty workouts, paired with three non-roll fabric resistance bands.',
    specifications: [
      { label: 'Mat Dimensions', value: '183cm x 61cm x 8mm Eco TPE Foam' },
      { label: 'Resistance Bands', value: 'Light, Medium & Heavy Non-Slip Cotton Bands' },
      { label: 'Carry Strap', value: 'Woven Natural Cotton Shoulder Strap Included' },
      { label: 'Colour', value: 'Deep Forest Green & Natural Cream' },
    ],
  },

  // 11. Automotive Accessories
  {
    id: 'prod-28',
    slug: 'cordless-digital-car-tyre-inflator-air-compressor',
    name: 'Cordless Digital Car Tyre Inflator & Air Compressor',
    categorySlug: 'automotive-accessories',
    priceNaira: 41000,
    expectedArrivalDate: '2026-12-11',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: true,
    image: '/src/assets/images/auto_tyre_inflator_1795467272680.jpg',
    gallery: ['/src/assets/images/auto_tyre_inflator_1795467272680.jpg'],
    shortSummary: 'Auto shut-off 150 PSI rechargeable tyre pump with digital gauge and LED torch.',
    description:
      'Skip roadside vulcaniser queues and keep your car tyres at the exact recommended pressure before every trip. Set your target PSI on the bright digital screen and the compressor stops automatically once full. Includes adapters for SUVs, bicycles, and footballs.',
    specifications: [
      { label: 'Max Pressure', value: '150 PSI with Auto Shut-Off Sensor' },
      { label: 'Battery', value: '6000mAh USB-C Rechargeable + 12V Car Cord' },
      { label: 'Display', value: 'Backlit Dual Real-Time & Target PSI Screen' },
      { label: 'Extras', value: 'Emergency LED Work Light & 3 Valve Nozzles' },
    ],
  },
  {
    id: 'prod-29',
    slug: 'handheld-high-suction-cordless-car-vacuum-cleaner',
    name: 'Handheld High-Suction Cordless Car Vacuum Cleaner',
    categorySlug: 'automotive-accessories',
    priceNaira: 33000,
    expectedArrivalDate: '2026-12-16',
    batchCode: 'TB-DEC-02',
    isPreOrderOpen: true,
    featured: false,
    image: '/src/assets/images/auto_car_vacuum_1795467272505.jpg',
    gallery: ['/src/assets/images/auto_car_vacuum_1795467272505.jpg'],
    shortSummary: 'Compact 16000Pa brushless car vacuum with washable HEPA filter and crevice tools.',
    description:
      'Keep car seats, floor mats, cup holders, and boot carpets spotless between car washes. Small enough to store neatly in your glove compartment or door pocket, with powerful brushless suction and a reusable washable HEPA filter.',
    specifications: [
      { label: 'Suction Power', value: '16,000Pa Dual-Speed Brushless Motor' },
      { label: 'Runtime', value: 'Up to 35 Minutes Per USB-C Charge' },
      { label: 'Attachments', value: 'Long Crevice Nozzle & Soft Upholstery Brush' },
      { label: 'Filter', value: 'Washable Stainless Mesh + HEPA Filter' },
    ],
  },
];

export const INITIAL_CUSTOMERS: CustomerAccount[] = [
  {
    id: 'cust-1',
    name: 'Amaka Okafor',
    email: 'amaka.okafor@example.com',
    whatsApp: '+2348035421980',
    deliveryAddress: '18 Fola Osibo Street, Lekki Phase 1, Lagos',
    password: 'tabsah2026',
    createdAt: '2026-10-14',
  },
  {
    id: 'cust-2',
    name: 'Tunde Adeyemi',
    email: 'tunde.adeyemi@example.com',
    whatsApp: '+2348067183304',
    deliveryAddress: '42 Allen Avenue, Ikeja, Lagos',
    password: 'tabsah2026',
    createdAt: '2026-11-02',
  },
  {
    id: 'cust-3',
    name: 'Zainab Bello',
    email: 'zainab.bello@example.com',
    whatsApp: '+2348092345611',
    deliveryAddress: 'Plot 7 Aminu Kano Crescent, Wuse 2, Abuja',
    password: 'tabsah2026',
    createdAt: '2026-11-12',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'TB-2026-1041',
    customerId: 'cust-1',
    customerName: 'Amaka Okafor',
    customerEmail: 'amaka.okafor@example.com',
    customerWhatsApp: '+2348035421980',
    deliveryZoneId: 'lagos-island',
    deliveryZoneLabel: 'Lagos Island (Lekki, VI, Ikoyi, Ajah)',
    deliveryAddress: '18 Fola Osibo Street, Lekki Phase 1, Lagos',
    createdAt: '2026-11-10',
    expectedArrivalDate: '2026-11-28',
    items: [
      {
        productId: 'prod-14',
        productName: '18k Gold Plated Layering Necklace Set',
        productImage: '/src/assets/images/jewellery_gold_necklaces_1795466512047.jpg',
        unitPriceNaira: 26500,
        quantity: 1,
        expectedArrivalDate: '2026-11-28',
      },
      {
        productId: 'prod-5',
        productName: 'Oval LED Vanity Mirror with Organiser Tray',
        productImage: '/src/assets/images/beauty_vanity_mirror_1795466511435.jpg',
        unitPriceNaira: 42000,
        quantity: 1,
        expectedArrivalDate: '2026-12-03',
      },
    ],
    subtotalNaira: 68500,
    deliveryFeeNaira: 4500,
    fullTotalNaira: 73000,
    depositPercentageApplied: 50,
    depositPaidNaira: 36500,
    balanceRemainingNaira: 36500,
    status: 'Balance due',
  },
  {
    id: 'ord-1002',
    orderNumber: 'TB-2026-1042',
    customerId: 'cust-1',
    customerName: 'Amaka Okafor',
    customerEmail: 'amaka.okafor@example.com',
    customerWhatsApp: '+2348035421980',
    deliveryZoneId: 'lagos-island',
    deliveryZoneLabel: 'Lagos Island (Lekki, VI, Ikoyi, Ajah)',
    deliveryAddress: '18 Fola Osibo Street, Lekki Phase 1, Lagos',
    createdAt: '2026-11-23',
    expectedArrivalDate: '2026-12-08',
    items: [
      {
        productId: 'prod-1',
        productName: 'Dual Basket Digital Air Fryer 8L',
        productImage: '/src/assets/images/kitchen_air_fryer_1795466512213.jpg',
        unitPriceNaira: 128000,
        quantity: 1,
        expectedArrivalDate: '2026-12-08',
      },
    ],
    subtotalNaira: 128000,
    deliveryFeeNaira: 4500,
    fullTotalNaira: 132500,
    depositPercentageApplied: 50,
    depositPaidNaira: 66250,
    balanceRemainingNaira: 66250,
    status: 'Deposit paid, waiting for stock',
  },
  {
    id: 'ord-1003',
    orderNumber: 'TB-2026-1043',
    customerId: 'cust-2',
    customerName: 'Tunde Adeyemi',
    customerEmail: 'tunde.adeyemi@example.com',
    customerWhatsApp: '+2348067183304',
    deliveryZoneId: 'lagos-mainland',
    deliveryZoneLabel: 'Lagos Mainland (Ikeja, Surulere, Yaba, Gbagada)',
    deliveryAddress: '42 Allen Avenue, Ikeja, Lagos',
    createdAt: '2026-11-23',
    expectedArrivalDate: '2026-12-05',
    items: [
      {
        productId: 'prod-3',
        productName: 'Cordless Rechargeable Standing Fan 16 Inch',
        productImage: '/src/assets/images/home_standing_fan_1795466512112.jpg',
        unitPriceNaira: 96000,
        quantity: 1,
        expectedArrivalDate: '2026-12-05',
      },
      {
        productId: 'prod-15',
        productName: '30000mAh 65W Fast Charge Power Bank',
        productImage: '/src/assets/images/tech_power_bank_1795466510574.jpg',
        unitPriceNaira: 49500,
        quantity: 1,
        expectedArrivalDate: '2026-12-04',
      },
    ],
    subtotalNaira: 145500,
    deliveryFeeNaira: 3500,
    fullTotalNaira: 149000,
    depositPercentageApplied: 50,
    depositPaidNaira: 74500,
    balanceRemainingNaira: 74500,
    status: 'Deposit paid, waiting for stock',
  },
  {
    id: 'ord-1004',
    orderNumber: 'TB-2026-1038',
    customerId: 'cust-3',
    customerName: 'Zainab Bello',
    customerEmail: 'zainab.bello@example.com',
    customerWhatsApp: '+2348092345611',
    deliveryZoneId: 'abuja-ph',
    deliveryZoneLabel: 'Abuja & Port Harcourt',
    deliveryAddress: 'Plot 7 Aminu Kano Crescent, Wuse 2, Abuja',
    createdAt: '2026-11-04',
    expectedArrivalDate: '2026-11-25',
    items: [
      {
        productId: 'prod-9',
        productName: 'Structured Pebbled Leather Work Tote',
        productImage: '/src/assets/images/bags_leather_tote_1795466511675.jpg',
        unitPriceNaira: 68500,
        quantity: 1,
        expectedArrivalDate: '2026-11-25',
      },
    ],
    subtotalNaira: 68500,
    deliveryFeeNaira: 6500,
    fullTotalNaira: 75000,
    depositPercentageApplied: 50,
    depositPaidNaira: 37500,
    balanceRemainingNaira: 0,
    status: 'Shipped',
  },
  {
    id: 'ord-1005',
    orderNumber: 'TB-2026-1035',
    customerId: 'cust-1',
    customerName: 'Amaka Okafor',
    customerEmail: 'amaka.okafor@example.com',
    customerWhatsApp: '+2348035421980',
    deliveryZoneId: 'lagos-island',
    deliveryZoneLabel: 'Lagos Island (Lekki, VI, Ikoyi, Ajah)',
    deliveryAddress: '18 Fola Osibo Street, Lekki Phase 1, Lagos',
    createdAt: '2026-10-22',
    expectedArrivalDate: '2026-11-16',
    items: [
      {
        productId: 'prod-21',
        productName: 'Amber Oud Eau de Parfum 100ml',
        productImage: '/src/assets/images/fragrance_amber_oud_1795466511233.jpg',
        unitPriceNaira: 48000,
        quantity: 1,
        expectedArrivalDate: '2026-11-16',
      },
    ],
    subtotalNaira: 48000,
    deliveryFeeNaira: 4500,
    fullTotalNaira: 52500,
    depositPercentageApplied: 50,
    depositPaidNaira: 26250,
    balanceRemainingNaira: 0,
    status: 'Delivered',
  },
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    reference: 'PSK-TB-882101',
    orderId: 'ord-1005',
    orderNumber: 'TB-2026-1035',
    customerName: 'Amaka Okafor',
    type: 'Deposit',
    amountNaira: 26250,
    date: '2026-10-22',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
  {
    id: 'pay-2',
    reference: 'PSK-TB-882198',
    orderId: 'ord-1005',
    orderNumber: 'TB-2026-1035',
    customerName: 'Amaka Okafor',
    type: 'Balance',
    amountNaira: 26250,
    date: '2026-11-14',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
  {
    id: 'pay-3',
    reference: 'PSK-TB-883044',
    orderId: 'ord-1004',
    orderNumber: 'TB-2026-1038',
    customerName: 'Zainab Bello',
    type: 'Deposit',
    amountNaira: 37500,
    date: '2026-11-04',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
  {
    id: 'pay-4',
    reference: 'PSK-TB-883712',
    orderId: 'ord-1004',
    orderNumber: 'TB-2026-1038',
    customerName: 'Zainab Bello',
    type: 'Balance',
    amountNaira: 37500,
    date: '2026-11-21',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
  {
    id: 'pay-5',
    reference: 'PSK-TB-884110',
    orderId: 'ord-1001',
    orderNumber: 'TB-2026-1041',
    customerName: 'Amaka Okafor',
    type: 'Deposit',
    amountNaira: 36500,
    date: '2026-11-10',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
  {
    id: 'pay-6',
    reference: 'PSK-TB-884920',
    orderId: 'ord-1002',
    orderNumber: 'TB-2026-1042',
    customerName: 'Amaka Okafor',
    type: 'Deposit',
    amountNaira: 66250,
    date: '2026-11-23',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
  {
    id: 'pay-7',
    reference: 'PSK-TB-884955',
    orderId: 'ord-1003',
    orderNumber: 'TB-2026-1043',
    customerName: 'Tunde Adeyemi',
    type: 'Deposit',
    amountNaira: 74500,
    date: '2026-11-23',
    method: 'Paystack Demo',
    status: 'Confirmed',
  },
];
