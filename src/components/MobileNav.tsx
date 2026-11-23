import React from 'react';
import {Grid2X2, Heart, Home, ShoppingBag, Store} from 'lucide-react';
import {motion} from 'motion/react';
import {useStore} from '../context/StoreContext.tsx';
import type {PageRoute} from '../types.ts';
import {SquircleIcon} from './SquircleIcon.tsx';

export function MobileNav() {
  const {route, navigate, cartCount, wishlistIds, setIsCartOpen} = useStore();

  const items: {
    id: string;
    label: string;
    icon: typeof Home;
    page?: PageRoute;
    badge?: number;
    onClick: () => void;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      page: 'home',
      onClick: () => navigate('home'),
    },
    {
      id: 'shop',
      label: 'Shop',
      icon: Store,
      page: 'shop',
      onClick: () => navigate('shop', '', {sortBy: 'featured'}),
    },
    {
      id: 'categories',
      label: 'Explore',
      icon: Grid2X2,
      page: 'categories',
      onClick: () => navigate('categories'),
    },
    {
      id: 'wishlist',
      label: 'Saved',
      icon: Heart,
      page: 'wishlist',
      badge: wishlistIds.length,
      onClick: () => navigate('wishlist'),
    },
    {
      id: 'cart',
      label: 'Bag',
      icon: ShoppingBag,
      badge: cartCount,
      onClick: () => setIsCartOpen(true),
    },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-2.5 left-2.5 right-2.5 z-40 h-[58px] rounded-[20px] glass-panel-elevated px-1.5"
    >
      <div className="grid grid-cols-5 h-full items-center">
        {items.map((item) => {
          const active = item.page ? route === item.page : false;
          return (
            <motion.button
              key={item.id}
              whileTap={{scale: 0.92}}
              type="button"
              onClick={item.onClick}
              className="relative min-h-[44px] flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
            >
              <div className="relative">
                <SquircleIcon
                  icon={item.icon}
                  size="xs"
                  variant={active ? 'cobalt' : 'glass'}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-[5px] bg-slate-900 border border-white/60 text-white text-[9px] font-mono font-bold flex items-center justify-center tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight leading-none ${
                  active ? 'font-bold text-blue-700' : 'font-medium text-slate-700'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
