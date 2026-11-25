import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {
  Banner,
  Brand,
  CartItem,
  Category,
  PageRoute,
  Product,
  ProductReview,
  UserProfile,
} from '../types.ts';
import {playCartSound, playTapSound} from '../utils/sound.ts';

export interface ShopFilterState {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  onlyDeals?: boolean;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

interface StoreContextValue {
  categories: Category[];
  brands: Brand[];
  products: Product[];
  banners: Banner[];
  reviews: ProductReview[];
  loading: boolean;
  refreshStorefront: () => Promise<void>;

  route: PageRoute;
  routeParam: string;
  shopFilters: ShopFilterState;
  setShopFilters: React.Dispatch<React.SetStateAction<ShopFilterState>>;
  navigate: (page: PageRoute, param?: string, filters?: ShopFilterState) => void;

  cart: CartItem[];
  addToCart: (product: Product, qty?: number, openDrawer?: boolean) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  cartDelivery: number;
  cartGrandTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  recentlyViewedIds: string[];
  recordRecentlyViewed: (productId: string) => void;

  userToken: string | null;
  user: UserProfile | null;
  setUserSession: (token: string | null, user: UserProfile | null) => void;

  adminToken: string | null;
  setAdminToken: (token: string | null) => void;

  soundEnabled: boolean;
  toggleSound: () => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const VALID_PAGES: PageRoute[] = [
  'home',
  'shop',
  'products',
  'product',
  'categories',
  'brands',
  'deals',
  'wishlist',
  'cart',
  'checkout',
  'about',
  'contact',
  'faq',
  'track-order',
  'privacy-policy',
  'terms-and-conditions',
  'account',
  'admin',
];

function parsePath(pathname: string): {page: PageRoute; param: string} {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return {page: 'home', param: ''};
  const parts = clean.split('/');
  const first = parts[0] as PageRoute;
  if (VALID_PAGES.includes(first)) {
    return {page: first, param: parts[1] ? decodeURIComponent(parts[1]) : ''};
  }
  return {page: 'home', param: ''};
}

export function StoreProvider({children}: {children: React.ReactNode}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  const initialParsed = parsePath(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [route, setRoute] = useState<PageRoute>(initialParsed.page);
  const [routeParam, setRouteParam] = useState<string>(initialParsed.param);
  const [shopFilters, setShopFilters] = useState<ShopFilterState>({sortBy: 'featured'});

  const [rawCart, setRawCart] = useState<{productId: string; quantity: number}[]>(() => {
    try {
      const saved = localStorage.getItem('tb_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tb_wishlist_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tb_recent_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const refreshStorefront = useCallback(async () => {
    try {
      const res = await fetch('/api/storefront');
      if (!res.ok) throw new Error('Failed to load catalog');
      const data = await res.json();
      setCategories(data.categories || []);
      setBrands(data.brands || []);
      setProducts(data.products || []);
      setBanners(data.banners || []);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorefront();
  }, [refreshStorefront]);

  useEffect(() => {
    try {
      localStorage.setItem('tb_cart_v1', JSON.stringify(rawCart));
    } catch {
      // Ignore storage error
    }
  }, [rawCart]);

  useEffect(() => {
    try {
      localStorage.setItem('tb_wishlist_v1', JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage error
    }
  }, [wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem('tb_recent_v1', JSON.stringify(recentlyViewedIds));
    } catch {
      // Ignore storage error
    }
  }, [recentlyViewedIds]);

  // Sync user cart/wishlist to backend when signed in
  useEffect(() => {
    if (!userToken) return;
    fetch('/api/auth/state', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({cart: rawCart, wishlist: wishlistIds}),
    }).catch(() => undefined);
  }, [userToken, rawCart, wishlistIds]);

  useEffect(() => {
    const onPopState = () => {
      const parsed = parsePath(window.location.pathname);
      setRoute(parsed.page);
      setRouteParam(parsed.param);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback(
    (page: PageRoute, param = '', filters?: ShopFilterState) => {
      playTapSound(soundEnabled);
      setRoute(page);
      setRouteParam(param);
      if (filters) {
        setShopFilters(filters);
      } else if (page === 'shop' && !filters) {
        // Preserve filters unless explicitly replaced
      }
      const nextUrl = page === 'home' ? '/' : param ? `/${page}/${encodeURIComponent(param)}` : `/${page}`;
      if (window.location.pathname !== nextUrl) {
        window.history.pushState({}, '', nextUrl);
      }
      window.scrollTo({top: 0, behavior: 'smooth'});
    },
    [soundEnabled],
  );

  const cart: CartItem[] = useMemo(() => {
    if (products.length === 0) return [];
    const productMap = new Map(products.map((p) => [p.id, p]));
    return rawCart
      .map((entry) => {
        const prod = productMap.get(entry.productId);
        if (!prod) return null;
        return {product: prod, quantity: Math.max(1, Math.min(entry.quantity, Math.max(1, prod.stock)))};
      })
      .filter((x): x is CartItem => Boolean(x));
  }, [rawCart, products]);

  const addToCart = useCallback(
    (product: Product, qty = 1, openDrawer = true) => {
      if (product.stock <= 0) {
        showToast(`${product.title} is currently out of stock.`);
        return;
      }
      playCartSound(soundEnabled);
      setRawCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? {...i, quantity: Math.min(product.stock, i.quantity + qty)} : i,
          );
        }
        return [...prev, {productId: product.id, quantity: Math.min(product.stock, Math.max(1, qty))}];
      });
      showToast(`Added ${product.title} to your bag.`);
      if (openDrawer) setIsCartOpen(true);
    },
    [soundEnabled, showToast],
  );

  const updateCartQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setRawCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setRawCart((prev) => prev.map((i) => (i.productId === productId ? {...i, quantity: qty} : i)));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setRawCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setRawCart([]);
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const cartSubtotal = useMemo(
    () => Number(cart.reduce((sum, item) => sum + item.product.original_price * item.quantity, 0).toFixed(2)),
    [cart],
  );

  const discountedItemsTotal = useMemo(
    () => Number(cart.reduce((sum, item) => sum + item.product.discount_price * item.quantity, 0).toFixed(2)),
    [cart],
  );

  const cartDiscount = useMemo(
    () => Number(Math.max(0, cartSubtotal - discountedItemsTotal).toFixed(2)),
    [cartSubtotal, discountedItemsTotal],
  );

  const cartDelivery = useMemo(() => {
    if (cart.length === 0) return 0;
    return discountedItemsTotal >= 70000 ? 0 : 2500;
  }, [cart.length, discountedItemsTotal]);

  const cartGrandTotal = useMemo(
    () => Number((discountedItemsTotal + cartDelivery).toFixed(2)),
    [discountedItemsTotal, cartDelivery],
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      playTapSound(soundEnabled);
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
        showToast(exists ? 'Removed from wishlist.' : 'Saved to wishlist.');
        return next;
      });
    },
    [soundEnabled, showToast],
  );

  const isWishlisted = useCallback((productId: string) => wishlistIds.includes(productId), [wishlistIds]);

  const recordRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewedIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  }, []);

  const setUserSession = useCallback((token: string | null, profile: UserProfile | null) => {
    setUserToken(token);
    setUser(profile);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const value: StoreContextValue = {
    categories,
    brands,
    products,
    banners,
    reviews,
    loading,
    refreshStorefront,
    route,
    routeParam,
    shopFilters,
    setShopFilters,
    navigate,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal,
    cartDiscount,
    cartDelivery,
    cartGrandTotal,
    isCartOpen,
    setIsCartOpen,
    wishlistIds,
    toggleWishlist,
    isWishlisted,
    recentlyViewedIds,
    recordRecentlyViewed,
    userToken,
    user,
    setUserSession,
    adminToken,
    setAdminToken,
    soundEnabled,
    toggleSound,
    toastMessage,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
