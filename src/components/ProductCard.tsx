import React from 'react';
import {Heart, ShoppingBag, Star} from 'lucide-react';
import {motion} from 'motion/react';
import {useStore} from '../context/StoreContext.tsx';
import type {Product} from '../types.ts';
import {formatCurrency} from '../utils/whatsapp.ts';
import {SmartImage, SquircleIcon} from './SquircleIcon.tsx';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({product, index = 0}: ProductCardProps) {
  const {navigate, addToCart, toggleWishlist, isWishlisted} = useStore();
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;

  return (
    <motion.article
      initial={{opacity: 0, y: 14}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-30px'}}
      transition={{duration: 0.32, delay: Math.min(index * 0.04, 0.2)}}
      whileHover={{y: -4}}
      className="group relative flex flex-col rounded-[26px] glass-panel hover:shadow-[0_24px_56px_-14px_rgba(15,23,42,0.16)] transition-shadow duration-300 overflow-hidden"
    >
      {/* Subtle Top Specular Reflection */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/35 to-transparent z-10"
      />

      {/* Product Visual Pedestal */}
      <div className="relative aspect-[4/3] bg-white/40 overflow-hidden p-2 pb-0">
        <button
          type="button"
          onClick={() => navigate('product', product.slug)}
          className="w-full h-full block rounded-[20px] overflow-hidden cursor-pointer border border-white/60"
        >
          <SmartImage
            src={product.images[0]}
            alt={product.title}
            fallbackTitle={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        </button>

        {/* Glass Top Corner Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="pointer-events-auto">
            {product.discount_percent > 0 && (
              <span className="inline-block px-2.5 py-1 rounded-[10px] glass-surface-dark text-white font-mono text-[11px] font-semibold tabular-nums">
                -{product.discount_percent}%
              </span>
            )}
          </div>
          <motion.button
            whileTap={{scale: 0.9}}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="pointer-events-auto cursor-pointer group/wish"
          >
            <SquircleIcon
              icon={Heart}
              size="sm"
              variant={wishlisted ? 'cobalt' : 'glass'}
              iconClassName={wishlisted ? 'fill-current' : ''}
            />
          </motion.button>
        </div>
      </div>

      {/* Product Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Unboxed Metadata Line */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{product.brand_name}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.category_name}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('product', product.slug)}
            className="mt-1.5 text-left block w-full cursor-pointer"
          >
            <h3 className="font-display font-semibold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-blue-700 transition-colors">
              {product.title}
            </h3>
          </button>

          <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>
        </div>

        {/* Bottom Price + Action Row */}
        <div className="pt-3 border-t border-white/60 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-slate-900 text-base tabular-nums">
                {formatCurrency(product.discount_price)}
              </span>
              {product.original_price > product.discount_price && (
                <span className="font-mono text-xs text-slate-500 line-through tabular-nums">
                  {formatCurrency(product.original_price)}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
              <SquircleIcon
                icon={Star}
                size="xxs"
                variant="glass"
                iconClassName="text-amber-500 fill-amber-500"
              />
              <span className="font-mono font-semibold text-slate-800 tabular-nums">{product.rating_avg}</span>
              <span aria-hidden="true">·</span>
              <span className={outOfStock ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                {outOfStock ? 'Out of stock' : 'In stock'}
              </span>
            </div>
          </div>

          <motion.button
            whileTap={{scale: 0.92}}
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, 1, true)}
            aria-label={`Add ${product.title} to bag`}
            className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SquircleIcon
              icon={ShoppingBag}
              size="md"
              variant={outOfStock ? 'subtle' : 'dark'}
              className={!outOfStock ? 'hover:from-blue-500 hover:to-blue-700' : ''}
            />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
