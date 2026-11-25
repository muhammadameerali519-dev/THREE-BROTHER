import React from 'react';
import {ArrowRight, Minus, Plus, ShoppingBag, Trash2, X} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {useStore} from '../context/StoreContext.tsx';
import {formatCurrency} from '../utils/whatsapp.ts';
import {GlassButton} from './GlassPrimitives.tsx';
import {SmartImage, SquircleIcon} from './SquircleIcon.tsx';

export function CartDrawer() {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartDelivery,
    cartGrandTotal,
    navigate,
  } = useStore();

  const discountedItemsTotal = cartSubtotal - cartDiscount;
  const freeShippingRemaining = Math.max(0, 70000 - discountedItemsTotal);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end p-0 sm:p-3">
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-sm"
          />

          <motion.aside
            initial={{x: '100%', opacity: 0.7}}
            animate={{x: 0, opacity: 1}}
            exit={{x: '100%', opacity: 0.7}}
            transition={{type: 'spring', damping: 28, stiffness: 280}}
            className="relative w-full max-w-md h-full sm:rounded-[28px] glass-panel-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SquircleIcon icon={ShoppingBag} size="sm" variant="dark" />
                <div>
                  <h2 className="font-display font-semibold text-slate-900 text-base">Shopping Bag</h2>
                  <p className="text-xs text-slate-600 tabular-nums">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items selected
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{scale: 0.92}}
                type="button"
                onClick={() => setIsCartOpen(false)}
                aria-label="Close bag"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer group"
              >
                <SquircleIcon icon={X} size="sm" variant="glass" />
              </motion.button>
            </div>

            {/* Free Delivery Meter */}
            {cart.length > 0 && (
              <div className="px-5 py-3 glass-surface-subtle border-b border-white/60">
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className="text-slate-700 font-medium">
                    {freeShippingRemaining === 0
                      ? 'Complimentary Express Delivery unlocked'
                      : `Add ${formatCurrency(freeShippingRemaining)} more for free express delivery`}
                  </span>
                  <span className="font-mono text-slate-900 font-semibold tabular-nums shrink-0">
                    {Math.min(100, Math.round((discountedItemsTotal / 70000) * 100))}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/60 overflow-hidden border border-white/70">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                    style={{width: `${Math.min(100, (discountedItemsTotal / 70000) * 100)}%`}}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <SquircleIcon icon={ShoppingBag} size="xl" variant="glass" />
                  <h3 className="mt-4 font-display font-semibold text-slate-900 text-lg">Your bag is empty</h3>
                  <p className="mt-1.5 text-sm text-slate-600 max-w-xs">
                    Explore flagship smartphones, studio audio, and precision hardware curated by THREE BROTHERS.
                  </p>
                  <GlassButton
                    type="button"
                    variant="obsidian"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('shop');
                    }}
                    className="mt-6"
                  >
                    Explore Catalog
                  </GlassButton>
                </div>
              ) : (
                cart.map(({product, quantity}) => (
                  <div
                    key={product.id}
                    className="flex gap-3.5 p-3 rounded-[20px] glass-surface-subtle"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        navigate('product', product.slug);
                      }}
                      className="w-20 h-20 rounded-[14px] overflow-hidden bg-white/70 shrink-0 border border-white/80 cursor-pointer"
                    >
                      <SmartImage
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-slate-600 truncate">{product.brand_name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCartOpen(false);
                            navigate('product', product.slug);
                          }}
                          className="text-sm font-semibold text-slate-900 hover:text-blue-700 text-left line-clamp-1 cursor-pointer"
                        >
                          {product.title}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileTap={{scale: 0.9}}
                            type="button"
                            onClick={() => updateCartQty(product.id, quantity - 1)}
                            aria-label="Decrease quantity"
                            className="cursor-pointer group"
                          >
                            <SquircleIcon icon={Minus} size="xs" variant="glass" />
                          </motion.button>
                          <span className="w-6 text-center font-mono text-xs font-semibold tabular-nums">
                            {quantity}
                          </span>
                          <motion.button
                            whileTap={{scale: 0.9}}
                            type="button"
                            onClick={() => updateCartQty(product.id, Math.min(product.stock, quantity + 1))}
                            aria-label="Increase quantity"
                            className="cursor-pointer group"
                          >
                            <SquircleIcon icon={Plus} size="xs" variant="glass" />
                          </motion.button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                            {formatCurrency(product.discount_price * quantity)}
                          </span>
                          <motion.button
                            whileTap={{scale: 0.9}}
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            aria-label="Remove item"
                            className="cursor-pointer text-slate-500 hover:text-rose-600 transition-colors group"
                          >
                            <SquircleIcon icon={Trash2} size="xs" variant="glass" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/65 glass-surface-subtle space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {cartDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Member Discount</span>
                      <span className="font-mono tabular-nums">-{formatCurrency(cartDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Express Delivery</span>
                    <span className="font-mono tabular-nums">
                      {cartDelivery === 0 ? 'FREE' : formatCurrency(cartDelivery)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/70 flex justify-between font-display font-bold text-slate-900 text-base">
                    <span>Grand Total</span>
                    <span className="font-mono tabular-nums">{formatCurrency(cartGrandTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <GlassButton
                    type="button"
                    variant="glass"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('cart');
                    }}
                  >
                    View Bag
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="cobalt"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate('checkout');
                    }}
                  >
                    <span>Checkout</span>
                    <SquircleIcon icon={ArrowRight} size="xxs" variant="glass" />
                  </GlassButton>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
