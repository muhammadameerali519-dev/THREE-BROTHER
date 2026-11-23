import React, {useEffect, useMemo, useState} from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {motion} from 'motion/react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {ProductCard} from '../components/ProductCard.tsx';
import {SmartImage, SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import type {Order} from '../types.ts';
import {playSuccessSound} from '../utils/sound.ts';
import {buildWhatsAppOrderMessage, buildWhatsAppOrderUrl, formatCurrency} from '../utils/whatsapp.ts';

export function WishlistPage() {
  const {products, wishlistIds, navigate} = useStore();
  const savedProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id)),
    [products, wishlistIds],
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8">
        <p className="text-xs font-semibold text-blue-700 mb-1">Saved Hardware · {savedProducts.length} items</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Your Wishlist</h1>
      </div>

      {savedProducts.length === 0 ? (
        <div className="rounded-[28px] glass-panel p-12 sm:p-14 text-center space-y-4">
          <div className="flex justify-center">
            <SquircleIcon icon={Heart} size="xl" variant="glass" />
          </div>
          <h2 className="font-display font-semibold text-xl text-slate-900">No saved devices yet</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Tap the heart squircle on any product card to curate your personal hardware shortlist.
          </p>
          <GlassButton type="button" variant="obsidian" onClick={() => navigate('shop')}>
            Browse Electronics
          </GlassButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {savedProducts.map((p, idx) => (
            <ProductCard key={p.id} product={p} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CartPage() {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    cartSubtotal,
    cartDiscount,
    cartDelivery,
    cartGrandTotal,
    navigate,
  } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8">
        <p className="text-xs font-semibold text-blue-700 mb-1">THREE BROTHERS Bag</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Shopping Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-[28px] glass-panel p-12 sm:p-14 text-center space-y-4">
          <div className="flex justify-center">
            <SquircleIcon icon={ShoppingBag} size="xl" variant="glass" />
          </div>
          <h2 className="font-display font-semibold text-xl text-slate-900">Your shopping cart is empty</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Add smartphones, studio laptops, or precision accessories to proceed to WhatsApp checkout.
          </p>
          <GlassButton type="button" variant="obsidian" onClick={() => navigate('shop')}>
            Start Shopping
          </GlassButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          <div className="lg:col-span-8 space-y-4">
            {cart.map(({product, quantity}) => (
              <div
                key={product.id}
                className="rounded-[24px] glass-panel p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
              >
                <button
                  type="button"
                  onClick={() => navigate('product', product.slug)}
                  className="w-full sm:w-28 aspect-[4/3] rounded-[16px] overflow-hidden bg-white/60 border border-white/80 shrink-0 cursor-pointer"
                >
                  <SmartImage src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs text-slate-600">
                    {product.brand_name} · {product.category_name}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('product', product.slug)}
                    className="font-display font-semibold text-slate-900 text-base hover:text-blue-700 text-left cursor-pointer"
                  >
                    {product.title}
                  </button>
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {formatCurrency(product.discount_price)}
                    </span>
                    {product.original_price > product.discount_price && (
                      <span className="font-mono text-xs text-slate-500 line-through tabular-nums">
                        {formatCurrency(product.original_price)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5 p-1 rounded-[13px] glass-surface-subtle">
                    <motion.button
                      whileTap={{scale: 0.9}}
                      type="button"
                      onClick={() => updateCartQty(product.id, quantity - 1)}
                      aria-label="Decrease"
                      className="cursor-pointer"
                    >
                      <SquircleIcon icon={Minus} size="xs" variant="glass" />
                    </motion.button>
                    <span className="w-7 text-center font-mono text-xs font-bold tabular-nums">{quantity}</span>
                    <motion.button
                      whileTap={{scale: 0.9}}
                      type="button"
                      onClick={() => updateCartQty(product.id, Math.min(product.stock, quantity + 1))}
                      aria-label="Increase"
                      className="cursor-pointer"
                    >
                      <SquircleIcon icon={Plus} size="xs" variant="glass" />
                    </motion.button>
                  </div>

                  <span className="font-mono font-bold text-slate-900 text-base tabular-nums min-w-[72px] text-right">
                    {formatCurrency(product.discount_price * quantity)}
                  </span>

                  <motion.button
                    whileTap={{scale: 0.9}}
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    aria-label="Remove item"
                    className="cursor-pointer"
                  >
                    <SquircleIcon icon={Trash2} size="sm" variant="glass" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:col-span-4 rounded-[26px] glass-panel-elevated p-6 space-y-4 lg:sticky lg:top-24">
            <h2 className="font-display font-bold text-lg text-slate-900">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(cartSubtotal)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount Savings</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(cartDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>Delivery Charges</span>
                <span className="font-mono tabular-nums">
                  {cartDelivery === 0 ? 'FREE' : formatCurrency(cartDelivery)}
                </span>
              </div>
              <div className="pt-3 border-t border-white/70 flex justify-between font-display font-bold text-lg text-slate-900">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">{formatCurrency(cartGrandTotal)}</span>
              </div>
            </div>
            <GlassButton
              type="button"
              size="lg"
              variant="cobalt"
              onClick={() => navigate('checkout')}
              className="w-full"
            >
              <span>Proceed to Checkout</span>
              <SquircleIcon icon={ArrowRight} size="xxs" variant="glass" />
            </GlassButton>
          </aside>
        </div>
      )}
    </div>
  );
}

export function CheckoutPage() {
  const {
    cart,
    cartSubtotal,
    cartDiscount,
    cartDelivery,
    cartGrandTotal,
    clearCart,
    refreshStorefront,
    user,
    userToken,
    soundEnabled,
    showToast,
    navigate,
  } = useStore();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');
  const [address, setAddress] = useState(user?.address || '');
  const [instructions, setInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setFullName((v) => v || user.name);
      setPhone((v) => v || user.phone);
      setCountry((v) => v || user.country);
      setCity((v) => v || user.city);
      setAddress((v) => v || user.address);
    }
  }, [user]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer_name: fullName.trim(),
          customer_phone: phone.trim(),
          country: country.trim(),
          city: city.trim(),
          address: address.trim(),
          instructions: instructions.trim(),
          items: cart.map((c) => ({product_id: c.product.id, quantity: c.quantity})),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not place order.');
      } else {
        playSuccessSound(soundEnabled);
        setConfirmedOrder(data.order);
        clearCart();
        refreshStorefront();
        showToast(`Order ${data.order.order_number} created. Confirm on WhatsApp.`);
      }
    } catch {
      showToast('Network error submitting order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const whatsappUrl = buildWhatsAppOrderUrl(confirmedOrder);
    const whatsappMsg = buildWhatsAppOrderMessage(confirmedOrder);

    return (
      <div className="max-w-3xl mx-auto px-3 sm:px-6 py-10 sm:py-12 space-y-6">
        <div className="rounded-[28px] glass-panel-elevated p-5 sm:p-10 space-y-6">
          <div className="flex items-start gap-4">
            <SquircleIcon icon={PackageCheck} size="xl" variant="cobalt" />
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold text-blue-700">
                Reference: {confirmedOrder.order_number}
              </p>
              <h1 className="font-display font-bold text-xl sm:text-3xl text-slate-900 mt-1">
                Order Ready for WhatsApp Confirmation
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Your order has been logged in our system. Tap the button below to send your complete order dispatch directly to our WhatsApp desk (+93703842099).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.a
              whileHover={{y: -1}}
              whileTap={{scale: 0.98}}
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 h-14 px-5 rounded-[16px] glass-btn-emerald text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-3"
            >
              <SquircleIcon icon={MessageCircle} size="xs" variant="glass" />
              <span>CONFIRM ORDER VIA WHATSAPP</span>
            </motion.a>

            <GlassButton
              type="button"
              size="lg"
              variant="glass"
              onClick={() => {
                navigator.clipboard?.writeText(whatsappMsg);
                showToast('Formatted order message copied to clipboard.');
              }}
              className="!h-14"
            >
              <SquircleIcon icon={Copy} size="xs" variant="subtle" />
              <span>Copy Text</span>
            </GlassButton>
          </div>

          <div className="rounded-[20px] glass-surface-dark text-slate-100 p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto">
            {whatsappMsg}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/60">
            <GlassButton
              type="button"
              size="sm"
              variant="glass"
              onClick={() => navigate('track-order', confirmedOrder.order_number)}
            >
              <SquircleIcon icon={CheckCircle2} size="xxs" variant="cobalt" />
              <span>Track Order {confirmedOrder.order_number}</span>
            </GlassButton>
            <GlassButton type="button" size="sm" variant="glass" onClick={() => navigate('shop')}>
              Continue Shopping
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="rounded-[28px] glass-panel p-10 text-center space-y-4">
          <div className="flex justify-center">
            <SquircleIcon icon={ShoppingBag} size="xl" variant="glass" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Your Bag Is Empty</h1>
          <p className="text-sm text-slate-600">Add electronics to your bag before checking out.</p>
          <GlassButton type="button" variant="obsidian" onClick={() => navigate('shop')}>
            Explore Storefront
          </GlassButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8">
        <p className="text-xs font-semibold text-blue-700 mb-1">Direct Concierge Dispatch · +93703842099</p>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">WhatsApp Express Checkout</h1>
      </div>

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <div className="lg:col-span-7 rounded-[26px] glass-panel p-5 sm:p-8 space-y-5">
          <h2 className="font-display font-semibold text-lg text-slate-900">Customer & Delivery Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Customer Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tariq Mansoor"
                className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Phone Number (WhatsApp) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+93 70 000 0000"
                className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Country *</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Afghanistan / UAE / International"
                className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kabul / Dubai / Herat"
                className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Complete Delivery Address *</label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, District, Building / House Number, Landmark"
              className="w-full p-3.5 rounded-[13px] glass-input text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Additional Instructions (Optional)</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Preferred delivery window, gift note, or color preference"
              className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[26px] glass-panel-elevated p-5 sm:p-8 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display font-semibold text-lg text-slate-900">Order Review</h2>

          <div className="divide-y divide-white/60 max-h-72 overflow-y-auto pr-1">
            {cart.map(({product, quantity}) => (
              <div key={product.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <SmartImage
                    src={product.images[0]}
                    alt={product.title}
                    className="w-12 h-12 rounded-[12px] object-cover shrink-0 bg-white/60 border border-white/80"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{product.title}</p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {product.brand_name} · Qty {quantity}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {formatCurrency(product.discount_price * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/65 space-y-2 text-sm">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatCurrency(cartSubtotal)}</span>
            </div>
            {cartDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount</span>
                <span className="font-mono tabular-nums">-{formatCurrency(cartDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>Delivery Charges</span>
              <span className="font-mono tabular-nums">
                {cartDelivery === 0 ? 'FREE ($0)' : formatCurrency(cartDelivery)}
              </span>
            </div>
            <div className="pt-2 border-t border-white/65 flex justify-between font-display font-bold text-lg text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums">{formatCurrency(cartGrandTotal)}</span>
            </div>
          </div>

          <GlassButton type="submit" size="lg" variant="emerald" disabled={submitting} className="w-full !h-13">
            <SquircleIcon icon={MessageCircle} size="xs" variant="glass" />
            <span>{submitting ? 'Generating Order...' : 'CONFIRM ORDER VIA WHATSAPP'}</span>
          </GlassButton>

          <p className="text-xs text-slate-600 text-center">
            Orders are verified in real time with our concierge team at +93703842099.
          </p>
        </div>
      </form>
    </div>
  );
}
