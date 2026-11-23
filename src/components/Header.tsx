import React, {useMemo, useState} from 'react';
import {
  ArrowUpRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {useStore} from '../context/StoreContext.tsx';
import type {PageRoute} from '../types.ts';
import {formatCurrency} from '../utils/whatsapp.ts';
import {GlassButton} from './GlassPrimitives.tsx';
import {SmartImage, SquircleIcon} from './SquircleIcon.tsx';

export function Header() {
  const {
    route,
    navigate,
    products,
    cartCount,
    wishlistIds,
    user,
    setIsCartOpen,
    setShopFilters,
  } = useStore();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand_name.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [query, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    setMobileMenuOpen(false);
    setShopFilters({search: query.trim(), sortBy: 'featured'});
    navigate('shop', '', {search: query.trim(), sortBy: 'featured'});
  };

  const navItems: {label: string; page: PageRoute}[] = [
    {label: 'Home', page: 'home'},
    {label: 'Shop', page: 'shop'},
    {label: 'Categories', page: 'categories'},
    {label: 'Brands', page: 'brands'},
    {label: 'Deals', page: 'deals'},
  ];

  return (
    <header className="sticky top-0 z-40 w-full px-2.5 sm:px-4 lg:px-6 pt-2 sm:pt-3 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto rounded-[20px] sm:rounded-[24px] glass-panel-elevated px-3 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigate('home')}
          className="flex items-center gap-2 sm:gap-2.5 text-left whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl cursor-pointer"
        >
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-gradient-to-br from-slate-800 to-slate-950 border border-white/25 text-white flex items-center justify-center shadow-[0_6px_16px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.28)] group-hover:from-blue-500 group-hover:to-blue-700 transition-all">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <rect x="4" y="5" width="3.5" height="14" rx="1.2" />
              <rect x="10.25" y="5" width="3.5" height="14" rx="1.2" opacity="0.85" />
              <rect x="16.5" y="5" width="3.5" height="14" rx="1.2" opacity="0.65" />
            </svg>
          </span>
          <span className="font-display font-bold tracking-tight text-slate-900 text-[13px] sm:text-base whitespace-nowrap shrink-0">
            THREE BROTHERS
          </span>
        </button>

        {/* Zone 2: Floating Glass Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-[16px] glass-surface-subtle">
          {navItems.map((item) => {
            const active = route === item.page || (item.page === 'shop' && route === 'products');
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => {
                  if (item.page === 'shop') {
                    navigate('shop', '', {sortBy: 'featured'});
                  } else {
                    navigate(item.page);
                  }
                }}
                className={`relative px-3.5 py-1.5 rounded-[12px] text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="header-nav-glass"
                    transition={{type: 'spring', stiffness: 360, damping: 30}}
                    className="absolute inset-0 rounded-[12px] bg-white/85 border border-white shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Glass Search + Squircle Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Desktop Glass Search */}
          <div className="relative hidden md:block w-52 xl:w-64">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <span className="absolute left-1.5 pointer-events-none">
                <SquircleIcon icon={Search} size="xs" variant="glass" />
              </span>
              <input
                type="text"
                value={query}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hardware..."
                aria-label="Search hardware"
                className="w-full h-10 pl-10 pr-8 rounded-[14px] glass-input text-xs sm:text-sm text-slate-900 placeholder:text-slate-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 cursor-pointer"
                >
                  <SquircleIcon icon={X} size="xxs" variant="subtle" />
                </button>
              )}
            </form>

            <AnimatePresence>
              {searchFocused && suggestions.length > 0 && (
                <motion.div
                  initial={{opacity: 0, y: 8, scale: 0.98}}
                  animate={{opacity: 1, y: 0, scale: 1}}
                  exit={{opacity: 0, y: 6, scale: 0.98}}
                  transition={{duration: 0.18}}
                  className="absolute right-0 mt-2.5 w-80 rounded-[22px] glass-panel-elevated overflow-hidden z-50"
                >
                  <div className="divide-y divide-white/50">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={() => {
                          setSearchFocused(false);
                          setQuery('');
                          navigate('product', item.slug);
                        }}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/60 transition-colors cursor-pointer group"
                      >
                        <SmartImage
                          src={item.images[0]}
                          alt={item.title}
                          className="w-11 h-11 rounded-[11px] object-cover shrink-0 bg-white/60 border border-white/80"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-600 truncate">
                            {item.brand_name} · {formatCurrency(item.discount_price)}
                          </p>
                        </div>
                        <SquircleIcon icon={ArrowUpRight} size="xs" variant="glass" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account */}
          <motion.button
            whileTap={{scale: 0.94}}
            type="button"
            onClick={() => navigate('account')}
            aria-label="Account"
            title={user ? user.name : 'Account'}
            className="relative min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center cursor-pointer group"
          >
            <SquircleIcon
              icon={User}
              size="sm"
              variant={route === 'account' ? 'cobalt' : 'glass'}
            />
          </motion.button>

          {/* Wishlist (desktop/tablet header; mobile uses floating dock) */}
          <motion.button
            whileTap={{scale: 0.94}}
            type="button"
            onClick={() => navigate('wishlist')}
            aria-label="Wishlist"
            className="hidden sm:flex relative min-w-[40px] min-h-[40px] items-center justify-center cursor-pointer group"
          >
            <SquircleIcon
              icon={Heart}
              size="sm"
              variant={route === 'wishlist' ? 'cobalt' : 'glass'}
            />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-[6px] bg-slate-900 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums shadow-sm">
                {wishlistIds.length}
              </span>
            )}
          </motion.button>

          {/* Shopping Bag */}
          <motion.button
            whileTap={{scale: 0.94}}
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Bag"
            className="relative min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center cursor-pointer group"
          >
            <SquircleIcon
              icon={ShoppingBag}
              size="sm"
              variant={cartCount > 0 ? 'dark' : 'glass'}
            />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-[6px] bg-blue-600 border border-white/50 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums shadow-sm">
                {cartCount}
              </span>
            )}
          </motion.button>

          {/* Mobile Drawer Menu Trigger */}
          <motion.button
            whileTap={{scale: 0.94}}
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="lg:hidden min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer group"
          >
            <SquircleIcon icon={mobileMenuOpen ? X : Menu} size="sm" variant="glass" />
          </motion.button>
        </div>
      </div>

      {/* Responsive Glass Mobile Menu Sheet */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{opacity: 0, y: -8, scale: 0.98}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -8, scale: 0.98}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
            className="lg:hidden max-w-7xl mx-auto mt-2 rounded-[22px] glass-panel-elevated overflow-hidden pointer-events-auto"
          >
            <div className="p-3.5 sm:p-4 space-y-3.5">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <span className="absolute left-1.5 pointer-events-none">
                  <SquircleIcon icon={Search} size="xs" variant="glass" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search smartphones, laptops, audio..."
                  className="w-full h-11 pl-10 pr-4 rounded-[14px] glass-input text-sm text-slate-900"
                />
              </form>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {label: 'Home', page: 'home'},
                    {label: 'Shop All', page: 'shop'},
                    {label: 'All Products', page: 'products'},
                    {label: 'Categories', page: 'categories'},
                    {label: 'Brands', page: 'brands'},
                    {label: 'Deals & Offers', page: 'deals'},
                    {label: 'Track Order', page: 'track-order'},
                    {label: 'About Us', page: 'about'},
                    {label: 'Contact Us', page: 'contact'},
                    {label: 'FAQ', page: 'faq'},
                  ] as {label: string; page: PageRoute}[]
                ).map((link) => (
                  <GlassButton
                    key={link.page}
                    type="button"
                    size="sm"
                    variant={route === link.page ? 'obsidian' : 'glass'}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(link.page);
                    }}
                    className="w-full justify-start h-11 px-3.5"
                  >
                    {link.label}
                  </GlassButton>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
