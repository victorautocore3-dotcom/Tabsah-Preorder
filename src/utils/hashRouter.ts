export type InfoSlug =
  | 'preorder-terms'
  | 'refund-policy'
  | 'privacy-policy'
  | 'delivery-info'
  | 'contact';

export type AdminTabSlug = 'overview' | 'products' | 'orders' | 'payments' | 'settings';

export type RouteView =
  | { page: 'home' }
  | { page: 'shop'; categorySlug?: string; searchQuery?: string }
  | { page: 'product'; productSlug: string }
  | { page: 'cart' }
  | { page: 'checkout' }
  | { page: 'login'; redirectTo?: 'checkout' | 'account' }
  | { page: 'register'; redirectTo?: 'checkout' | 'account' }
  | { page: 'account'; tab?: 'orders' | 'details'; orderId?: string }
  | { page: 'admin'; tab?: AdminTabSlug }
  | { page: 'info'; slug: InfoSlug };

const VALID_INFO_SLUGS: InfoSlug[] = [
  'preorder-terms',
  'refund-policy',
  'privacy-policy',
  'delivery-info',
  'contact',
];

const VALID_ADMIN_TABS: AdminTabSlug[] = [
  'overview',
  'products',
  'orders',
  'payments',
  'settings',
];

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function routeToHash(route: RouteView): string {
  switch (route.page) {
    case 'home':
      return '#/';
    case 'shop': {
      const base = route.categorySlug
        ? `#/shop/${encodeURIComponent(route.categorySlug)}`
        : '#/shop';
      const q = route.searchQuery?.trim();
      return q ? `${base}?q=${encodeURIComponent(q)}` : base;
    }
    case 'product':
      return `#/product/${encodeURIComponent(route.productSlug)}`;
    case 'cart':
      return '#/cart';
    case 'checkout':
      return '#/checkout';
    case 'login':
      return route.redirectTo === 'checkout' ? '#/login?redirect=checkout' : '#/login';
    case 'register':
      return route.redirectTo === 'checkout' ? '#/register?redirect=checkout' : '#/register';
    case 'account':
      if (route.tab === 'details') return '#/account/details';
      if (route.orderId) return `#/account/orders/${encodeURIComponent(route.orderId)}`;
      return '#/account';
    case 'admin':
      if (route.tab && route.tab !== 'overview') return `#/admin/${route.tab}`;
      return '#/admin';
    case 'info':
      return `#/info/${route.slug}`;
    default:
      return '#/';
  }
}

export function hashToRoute(hash: string, pathname = '/'): RouteView {
  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;

  // Support direct /admin pathname when no hash is present
  if (!rawHash) {
    const cleanPath = pathname.replace(/\/+$/, '').toLowerCase();
    if (cleanPath === '/admin') {
      return { page: 'admin', tab: 'overview' };
    }
    return { page: 'home' };
  }

  const [pathPart, queryPart = ''] = rawHash.split('?');
  const normalizedPath = pathPart.replace(/^\/+/, '').replace(/\/+$/, '');
  const params = new URLSearchParams(queryPart);

  if (!normalizedPath) {
    return { page: 'home' };
  }

  const segments = normalizedPath.split('/').filter(Boolean);
  const first = segments[0].toLowerCase();

  if (first === 'shop') {
    const categorySlug = segments[1] ? safeDecode(segments[1]) : undefined;
    const searchQuery = params.get('q') ?? undefined;
    return {
      page: 'shop',
      categorySlug,
      searchQuery: searchQuery && searchQuery.trim() ? searchQuery : undefined,
    };
  }

  if (first === 'product') {
    const productSlug = segments[1] ? safeDecode(segments[1]) : '';
    return { page: 'product', productSlug };
  }

  if (first === 'cart') {
    return { page: 'cart' };
  }

  if (first === 'checkout') {
    return { page: 'checkout' };
  }

  if (first === 'login') {
    const redirect = params.get('redirect') === 'checkout' ? 'checkout' : undefined;
    return { page: 'login', redirectTo: redirect };
  }

  if (first === 'register') {
    const redirect = params.get('redirect') === 'checkout' ? 'checkout' : undefined;
    return { page: 'register', redirectTo: redirect };
  }

  if (first === 'account') {
    const second = segments[1]?.toLowerCase();
    if (second === 'details') {
      return { page: 'account', tab: 'details' };
    }
    if (second === 'orders' && segments[2]) {
      return { page: 'account', tab: 'orders', orderId: safeDecode(segments[2]) };
    }
    return { page: 'account', tab: 'orders' };
  }

  // Supports both #/admin (and sub-tabs) and legacy #admin
  if (first === 'admin') {
    const sub = segments[1]?.toLowerCase() as AdminTabSlug | undefined;
    const tab: AdminTabSlug = sub && VALID_ADMIN_TABS.includes(sub) ? sub : 'overview';
    return { page: 'admin', tab };
  }

  if (first === 'info' && segments[1]) {
    const candidate = segments[1].toLowerCase() as InfoSlug;
    if (VALID_INFO_SLUGS.includes(candidate)) {
      return { page: 'info', slug: candidate };
    }
  }

  return { page: 'home' };
}

export function readCurrentLocationRoute(): RouteView {
  if (typeof window === 'undefined') return { page: 'home' };
  return hashToRoute(window.location.hash, window.location.pathname);
}
