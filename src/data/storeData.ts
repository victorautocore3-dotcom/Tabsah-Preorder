/**
 * Single data file for Pre Order With Tabsah.
 * All categories, products, customers, orders, and payment records live here.
 */

import { UV_UMBRELLA_01 } from '../assets/images/uvUmbrella01';
import { UV_UMBRELLA_02 } from '../assets/images/uvUmbrella02';
import { UV_UMBRELLA_03 } from '../assets/images/uvUmbrella03';

import { WATER_FLASK_01 } from '../assets/images/waterFlask01';
import { WATER_FLASK_02 } from '../assets/images/waterFlask02';
import { WATER_FLASK_03 } from '../assets/images/waterFlask03';

import { USB_OSCILLATING_FAN_01 } from '../assets/images/usbOscillatingFan01';
import { USB_OSCILLATING_FAN_02 } from '../assets/images/usbOscillatingFan02';

import { SHOE_CABINET_01 } from '../assets/images/shoeCabinet01';

import { ERGONOMIC_CHAIR_01 } from '../assets/images/ergonomicChair01';
import { ERGONOMIC_CHAIR_02 } from '../assets/images/ergonomicChair02';
import { ERGONOMIC_CHAIR_03 } from '../assets/images/ergonomicChair03';

import { KNIT_RETRO_SHIRT_01 } from '../assets/images/knitRetroShirt01';
import { KNIT_RETRO_SHIRT_02 } from '../assets/images/knitRetroShirt02';
import { KNIT_RETRO_SHIRT_03 } from '../assets/images/knitRetroShirt03';

import { SOFA_CHAIR_COUCH_01 } from '../assets/images/sofaChairCouch01';
import { SOFA_CHAIR_COUCH_02 } from '../assets/images/sofaChairCouch02';

import { MEMORY_FOAM_MATTRESS_01 } from '../assets/images/memoryFoamMattress01';
import { MEMORY_FOAM_MATTRESS_02 } from '../assets/images/memoryFoamMattress02';
import { MEMORY_FOAM_MATTRESS_03 } from '../assets/images/memoryFoamMattress03';

import { CHANDELIER_WHITE_RINGS_01 } from '../assets/images/chandelierWhiteRings01';
import { CHANDELIER_INTERLOCKING_RINGS_01 } from '../assets/images/chandelierInterlockingRings01';
import { CHANDELIER_GOLD_WAVY_01 } from '../assets/images/chandelierGoldWavy01';

import { SPORT_HEADSET_01 } from '../assets/images/sportHeadset01';
import { SPORT_HEADSET_02 } from '../assets/images/sportHeadset02';

import { NIGHTIE_HEART_PYJAMA_01 } from '../assets/images/nightieHeartPyjama01';
import { NIGHTIE_HEART_PYJAMA_02 } from '../assets/images/nightieHeartPyjama02';
import { NIGHTIE_HEART_PYJAMA_03 } from '../assets/images/nightieHeartPyjama03';
import { NIGHTIE_HEART_PYJAMA_04 } from '../assets/images/nightieHeartPyjama04';
import { NIGHTIE_HEART_PYJAMA_05 } from '../assets/images/nightieHeartPyjama05';

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

export interface ProductVariant {
  label: string;
  priceNaira: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  priceNaira: number;
  variants?: ProductVariant[];
  expectedArrivalDate: string; // e.g. "2026-12-06"
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
  variantLabel?: string;
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
  status: string;
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

export function getLowestVariant(product: Product): ProductVariant | null {
  if (!product.variants || product.variants.length === 0) return null;
  return product.variants.reduce((lowest, current) =>
    current.priceNaira < lowest.priceNaira ? current : lowest
  );
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
    description: 'Compact rechargeable fans, headsets, and everyday electronics.',
    image: USB_OSCILLATING_FAN_01,
  },
  {
    id: 'cat-2',
    slug: 'fashion-and-clothing',
    name: 'Fashion and Clothing',
    description: 'Knitwear tops, pyjama sets, and everyday clothing.',
    image: KNIT_RETRO_SHIRT_03,
  },
  {
    id: 'cat-3',
    slug: 'shoes-and-footwear',
    name: 'Shoes and Footwear',
    description: 'Footwear curated for everyday comfort and style.',
    image: '/src/assets/images/shoes_suede_loafers_1795466511093.jpg',
  },
  {
    id: 'cat-4',
    slug: 'bags-and-luggage',
    name: 'Bags and Luggage',
    description: 'Everyday carry bags and travel luggage batches.',
    image: '/src/assets/images/bags_leather_tote_1795466511675.jpg',
  },
  {
    id: 'cat-5',
    slug: 'beauty-and-personal-care',
    name: 'Beauty and Personal Care',
    description: 'Personal grooming, skincare tools, and everyday beauty finds.',
    image: '/src/assets/images/beauty_vanity_mirror_1795466511435.jpg',
  },
  {
    id: 'cat-6',
    slug: 'jewellery-and-accessories',
    name: 'Jewellery and Accessories',
    description: 'Practical daily accessories and personal carry essentials.',
    image: UV_UMBRELLA_01,
  },
  {
    id: 'cat-7',
    slug: 'home-and-kitchen',
    name: 'Home and Kitchen',
    description: 'Water flasks, shoe storage, seating, mattresses, and ceiling lighting.',
    image: WATER_FLASK_01,
  },
  {
    id: 'cat-8',
    slug: 'baby-kids-and-toys',
    name: 'Baby Kids and Toys',
    description: 'Practical essentials and toys for babies and young children.',
    image: '/src/assets/images/baby_travel_stroller_1795466511201.jpg',
  },
  {
    id: 'cat-9',
    slug: 'office-and-school-supplies',
    name: 'Office and School Supplies',
    description: 'Ergonomic seating and workspace essentials for study and work.',
    image: ERGONOMIC_CHAIR_01,
  },
  {
    id: 'cat-10',
    slug: 'fitness-and-sports',
    name: 'Fitness and Sports',
    description: 'Home exercise accessories and active gear.',
    image: '/src/assets/images/fitness_yoga_kit_1795467273212.jpg',
  },
  {
    id: 'cat-11',
    slug: 'automotive-accessories',
    name: 'Automotive Accessories',
    description: 'Compact car care tools and driving accessories.',
    image: '/src/assets/images/auto_tyre_inflator_1795467272680.jpg',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1) UV Umbrella
  {
    id: 'tab-101',
    slug: 'uv-umbrella',
    name: 'UV Umbrella',
    categorySlug: 'jewellery-and-accessories',
    priceNaira: 2499,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-101',
    isPreOrderOpen: true,
    featured: true,
    image: UV_UMBRELLA_01,
    gallery: [UV_UMBRELLA_01, UV_UMBRELLA_02, UV_UMBRELLA_03],
    shortSummary: 'Compact folding UV umbrella with matching sleeve and dark inner lining.',
    description:
      'A compact folding UV umbrella featuring a dark underside lining, push-button handle, and wrist strap. Shown with a matching protective sleeve in lavender and navy blue.',
    specifications: [
      { label: 'Product Type', value: 'Folding UV Umbrella' },
      { label: 'Batch Code', value: 'TAB-101' },
    ],
  },

  // 2) 72 Hours Water Flask
  {
    id: 'tab-102',
    slug: '72-hours-water-flask',
    name: '72 Hours Water Flask',
    categorySlug: 'home-and-kitchen',
    priceNaira: 14900,
    variants: [
      { label: '3L', priceNaira: 14900 },
      { label: '4L', priceNaira: 17700 },
      { label: '5.2L', priceNaira: 20499 },
    ],
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-102',
    isPreOrderOpen: true,
    featured: true,
    image: WATER_FLASK_01,
    gallery: [WATER_FLASK_01, WATER_FLASK_02, WATER_FLASK_03],
    shortSummary: 'Large water flask with side handle, protective top and base collars, and press-button inner lid.',
    description:
      'A large-capacity 72 Hours Water Flask equipped with a side carry handle, reinforced collars at the top and base, and a press-button inner lid. Available in 3L, 4L, and 5.2L sizes.',
    specifications: [
      { label: 'Sizes Available', value: '3L, 4L, 5.2L' },
      { label: 'Batch Code', value: 'TAB-102' },
    ],
  },

  // 3) USB Rechargeable Fan with Oscillating Function
  {
    id: 'tab-103',
    slug: 'usb-rechargeable-fan-with-oscillating-function',
    name: 'USB Rechargeable Fan with Oscillating Function',
    categorySlug: 'gadgets-and-electronics',
    priceNaira: 6550,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-103',
    isPreOrderOpen: true,
    featured: false,
    image: USB_OSCILLATING_FAN_01,
    gallery: [USB_OSCILLATING_FAN_01, USB_OSCILLATING_FAN_02],
    shortSummary: 'Compact desktop USB rechargeable fan with oscillating tilting head and indicator base.',
    description:
      'A compact desktop USB rechargeable fan with an oscillating tilting head and a front indicator display on the base. Shown in cream and burgundy with a USB charging cable.',
    specifications: [
      { label: 'Power', value: 'USB Rechargeable' },
      { label: 'Function', value: 'Oscillating Head' },
      { label: 'Batch Code', value: 'TAB-103' },
    ],
  },

  // 4) Multifunctional Shoe Cabinet
  {
    id: 'tab-104',
    slug: 'multifunctional-shoe-cabinet',
    name: 'Multifunctional Shoe Cabinet',
    categorySlug: 'home-and-kitchen',
    priceNaira: 5219,
    variants: [
      { label: 'A 5 layers 80cm', priceNaira: 7789 },
      { label: 'B 4 layers 80cm', priceNaira: 6319 },
      { label: 'C 3 layers 60cm', priceNaira: 5219 },
    ],
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-104',
    isPreOrderOpen: true,
    featured: false,
    image: SHOE_CABINET_01,
    gallery: [SHOE_CABINET_01],
    shortSummary: 'Standing multi-tier shoe cabinet with two upper rows of hanging hooks.',
    description:
      'A standing shoe cabinet featuring open tiered shelves below two upper rails of hanging hooks. Available in A 5 layers 80cm, B 4 layers 80cm, and C 3 layers 60cm variants.',
    specifications: [
      { label: 'Options', value: 'A 5 layers 80cm, B 4 layers 80cm, C 3 layers 60cm' },
      { label: 'Batch Code', value: 'TAB-104' },
    ],
  },

  // 5) Ergonomic Chair for Long Sitting
  {
    id: 'tab-105',
    slug: 'ergonomic-chair-for-long-sitting',
    name: 'Ergonomic Chair for Long Sitting',
    categorySlug: 'office-and-school-supplies',
    priceNaira: 39900,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-105',
    isPreOrderOpen: true,
    featured: true,
    image: ERGONOMIC_CHAIR_01,
    gallery: [ERGONOMIC_CHAIR_01, ERGONOMIC_CHAIR_02, ERGONOMIC_CHAIR_03],
    shortSummary: 'High-back swivel chair with headrest pillow, lumbar cushion, armrests, and footrest.',
    description:
      'A high-back ergonomic swivel chair on a five-wheel base with curved armrests, a headrest pillow, a lumbar cushion, and a pull-out footrest. Shown in black and red, black and white, and pink and white.',
    specifications: [
      { label: 'Design', value: 'High-Back Ergonomic Swivel Chair' },
      { label: 'Batch Code', value: 'TAB-105' },
    ],
  },

  // 6) Knit Wear Retro Shirt II
  {
    id: 'tab-106',
    slug: 'knit-wear-retro-shirt-ii',
    name: 'Knit Wear Retro Shirt II',
    categorySlug: 'fashion-and-clothing',
    priceNaira: 12999,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-106',
    isPreOrderOpen: true,
    featured: false,
    image: KNIT_RETRO_SHIRT_01,
    gallery: [KNIT_RETRO_SHIRT_01, KNIT_RETRO_SHIRT_02, KNIT_RETRO_SHIRT_03],
    shortSummary: 'Short-sleeve white collared knit shirt with half-zip front and striped sleeve cuffs.',
    description:
      'A short-sleeve white knit retro shirt with vertical ribbed detailing, a classic collar, and a front half-zip neckline. Finished with brown stripe trim along the sleeve cuffs.',
    specifications: [
      { label: 'Style', value: 'Short-Sleeve Collared Half-Zip Knit Shirt' },
      { label: 'Batch Code', value: 'TAB-106' },
    ],
  },

  // 7) Sofa Chair and Couch
  {
    id: 'tab-107',
    slug: 'sofa-chair-and-couch',
    name: 'Sofa Chair and Couch',
    categorySlug: 'home-and-kitchen',
    priceNaira: 49999,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-107',
    isPreOrderOpen: true,
    featured: false,
    image: SOFA_CHAIR_COUCH_01,
    gallery: [SOFA_CHAIR_COUCH_01, SOFA_CHAIR_COUCH_02],
    shortSummary: 'Rounded tufted lounge sofa chair paired with a matching round footstool.',
    description:
      'A low-profile rounded tufted sofa chair shown with a matching round ottoman footstool in textured upholstery. Shown in cream white and soft pink.',
    specifications: [
      { label: 'Type', value: 'Rounded Tufted Sofa Chair and Footstool' },
      { label: 'Batch Code', value: 'TAB-107' },
    ],
  },

  // 8) Memory Foam Queen Size (180x200cm)
  {
    id: 'tab-108',
    slug: 'memory-foam-queen-size-180x200cm',
    name: 'Memory Foam Queen Size (180x200cm)',
    categorySlug: 'home-and-kitchen',
    priceNaira: 48900,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-108',
    isPreOrderOpen: true,
    featured: false,
    image: MEMORY_FOAM_MATTRESS_01,
    gallery: [MEMORY_FOAM_MATTRESS_01, MEMORY_FOAM_MATTRESS_02, MEMORY_FOAM_MATTRESS_03],
    shortSummary: 'Queen-size 180x200cm quilted white memory foam mattress.',
    description:
      'A queen-size 180x200cm memory foam mattress with a quilted white top surface. Shown with green, white, and blue side border styles.',
    specifications: [
      { label: 'Size', value: 'Queen Size (180x200cm)' },
      { label: 'Batch Code', value: 'TAB-108' },
    ],
  },

  // 9) Ceiling Chandelier Light (White Rings)
  {
    id: 'tab-109',
    slug: 'ceiling-chandelier-light-white-rings',
    name: 'Ceiling Chandelier Light (White Rings)',
    categorySlug: 'home-and-kitchen',
    priceNaira: 35000,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-109',
    isPreOrderOpen: true,
    featured: false,
    image: CHANDELIER_WHITE_RINGS_01,
    gallery: [CHANDELIER_WHITE_RINGS_01],
    shortSummary: 'Suspended ceiling chandelier with looping white illuminated rings and three hanging pendants.',
    description:
      'A suspended ceiling chandelier light featuring curved white illuminated rings hung from a round ceiling canopy, paired with three vertical hanging pendant lights.',
    specifications: [
      { label: 'Style', value: 'White Rings' },
      { label: 'Batch Code', value: 'TAB-109' },
    ],
  },

  // 10) Ceiling Chandelier Light (Interlocking Rings)
  {
    id: 'tab-110',
    slug: 'ceiling-chandelier-light-interlocking-rings',
    name: 'Ceiling Chandelier Light (Interlocking Rings)',
    categorySlug: 'home-and-kitchen',
    priceNaira: 21000,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-110',
    isPreOrderOpen: true,
    featured: false,
    image: CHANDELIER_INTERLOCKING_RINGS_01,
    gallery: [CHANDELIER_INTERLOCKING_RINGS_01],
    shortSummary: 'Suspended ceiling chandelier with interlocking illuminated rings and three centre globe lights.',
    description:
      'A suspended ceiling chandelier light with interlocking dark-framed illuminated rings hanging from a round black canopy, accented by three spherical globe lights at the centre.',
    specifications: [
      { label: 'Style', value: 'Interlocking Rings' },
      { label: 'Batch Code', value: 'TAB-110' },
    ],
  },

  // 11) Ceiling Chandelier Light (Gold Wavy)
  {
    id: 'tab-111',
    slug: 'ceiling-chandelier-light-gold-wavy',
    name: 'Ceiling Chandelier Light (Gold Wavy)',
    categorySlug: 'home-and-kitchen',
    priceNaira: 37000,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-111',
    isPreOrderOpen: true,
    featured: false,
    image: CHANDELIER_GOLD_WAVY_01,
    gallery: [CHANDELIER_GOLD_WAVY_01],
    shortSummary: 'Suspended gold wavy ceiling chandelier with three globe pendant lights in the centre.',
    description:
      'A suspended ceiling chandelier light designed with wavy gold illuminated loops hung from a round gold canopy, surrounding three central globe lights.',
    specifications: [
      { label: 'Style', value: 'Gold Wavy' },
      { label: 'Batch Code', value: 'TAB-111' },
    ],
  },

  // 12) Sport Headset
  {
    id: 'tab-112',
    slug: 'sport-headset',
    name: 'Sport Headset',
    categorySlug: 'gadgets-and-electronics',
    priceNaira: 3950,
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-112',
    isPreOrderOpen: true,
    featured: false,
    image: SPORT_HEADSET_01,
    gallery: [SPORT_HEADSET_01, SPORT_HEADSET_02],
    shortSummary: 'Over-ear sport headset with cushioned ear cups and built-in side buttons.',
    description:
      'An over-ear sport headset featuring padded ear cushions, a smooth arched headband, and control buttons along the ear cup edge. Shown in peach and silver-white.',
    specifications: [
      { label: 'Design', value: 'Over-Ear Headset' },
      { label: 'Batch Code', value: 'TAB-112' },
    ],
  },

  // 13) Nightie (Heart Print Pyjama Set)
  {
    id: 'tab-113',
    slug: 'nightie-heart-print-pyjama-set',
    name: 'Nightie (Heart Print Pyjama Set)',
    categorySlug: 'fashion-and-clothing',
    priceNaira: 2999,
    variants: [
      { label: 'Long', priceNaira: 3999 },
      { label: 'Short', priceNaira: 2999 },
    ],
    expectedArrivalDate: '2026-12-06',
    batchCode: 'TAB-113',
    isPreOrderOpen: true,
    featured: false,
    image: NIGHTIE_HEART_PYJAMA_01,
    gallery: [
      NIGHTIE_HEART_PYJAMA_01,
      NIGHTIE_HEART_PYJAMA_02,
      NIGHTIE_HEART_PYJAMA_03,
      NIGHTIE_HEART_PYJAMA_04,
      NIGHTIE_HEART_PYJAMA_05,
    ],
    shortSummary: 'Two-piece ribbed white heart-print camisole pyjama set in Long or Short variants.',
    description:
      'A two-piece ribbed white camisole pyjama set featuring all-over heart prints and wavy lettuce-edge hems. Available in Long and Short variants, shown in red, blue, and black heart prints.',
    specifications: [
      { label: 'Variants', value: 'Long, Short' },
      { label: 'Batch Code', value: 'TAB-113' },
    ],
  },
];

export const INITIAL_CUSTOMERS: CustomerAccount[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

