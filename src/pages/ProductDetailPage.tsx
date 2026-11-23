import React, {useEffect, useMemo, useState} from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {ProductCard} from '../components/ProductCard.tsx';
import {SmartImage, SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import type {Product, ProductReview} from '../types.ts';
import {formatCurrency} from '../utils/whatsapp.ts';

export function ProductDetailPage({slug}: {slug: string}) {
  const {
    products,
    navigate,
    addToCart,
    toggleWishlist,
    isWishlisted,
    recordRecentlyViewed,
    showToast,
  } = useStore();

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'warranty' | 'reviews'>('overview');

  const [revName, setRevName] = useState('');
  const [revRole, setRevRole] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSelectedImageIdx(0);
    setQuantity(1);

    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Not found'))))
      .then((data) => {
        if (!active) return;
        setDetailProduct(data.product);
        setProductReviews(data.reviews || []);
        recordRecentlyViewed(data.product.id);
      })
      .catch(() => {
        const fallback = products.find((p) => p.slug === slug || p.id === slug) || null;
        if (active) {
          setDetailProduct(fallback);
          if (fallback) recordRecentlyViewed(fallback.id);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, products, recordRecentlyViewed]);

  const relatedProducts = useMemo(() => {
    if (!detailProduct) return [];
    return products
      .filter(
        (p) =>
          p.id !== detailProduct.id &&
          (p.category_id === detailProduct.category_id || p.brand_id === detailProduct.brand_id),
      )
      .slice(0, 3);
  }, [detailProduct, products]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailProduct) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${detailProduct.id}/reviews`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          author_name: revName,
          author_role: revRole,
          rating: revRating,
          title: revTitle,
          comment: revComment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not post review.');
      } else {
        setProductReviews((prev) => [data.review, ...prev]);
        setRevName('');
        setRevRole('');
        setRevTitle('');
        setRevComment('');
        showToast('Thank you! Your review has been published.');
      }
    } catch {
      showToast('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !detailProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-600">
        Loading product specifications...
      </div>
    );
  }

  if (!detailProduct) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20">
        <div className="rounded-[28px] glass-panel p-10 text-center space-y-4">
          <h1 className="font-display font-bold text-2xl text-slate-900">Product Not Found</h1>
          <p className="text-sm text-slate-600">This item may have been updated or moved in our catalog.</p>
          <GlassButton type="button" variant="obsidian" onClick={() => navigate('shop')}>
            Return to Shop
          </GlassButton>
        </div>
      </div>
    );
  }

  const images = detailProduct.images.length
    ? detailProduct.images
    : ['/src/assets/images/product_smart_accessories_1795408033153.jpg'];
  const wishlisted = isWishlisted(detailProduct.id);
  const outOfStock = detailProduct.stock <= 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-7 sm:py-12 space-y-12 sm:space-y-16">
      {/* Breadcrumb Back */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-600">
        <GlassButton type="button" size="sm" variant="glass" onClick={() => navigate('shop')}>
          <SquircleIcon icon={ArrowLeft} size="xxs" variant="subtle" />
          <span>Catalog</span>
        </GlassButton>
        <span aria-hidden="true">/</span>
        <span>{detailProduct.category_name}</span>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
          {detailProduct.title}
        </span>
      </div>

      {/* Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left: Sticky Glass Gallery */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden glass-panel p-2">
            <div className="w-full h-full rounded-[20px] overflow-hidden bg-white/50 border border-white/70">
              <AnimatePresence mode="wait">
                <motion.div
                  key={images[selectedImageIdx]}
                  initial={{opacity: 0, scale: 0.99}}
                  animate={{opacity: 1, scale: 1}}
                  exit={{opacity: 0}}
                  transition={{duration: 0.24}}
                  className="w-full h-full"
                >
                  <SmartImage
                    priority
                    src={images[selectedImageIdx]}
                    alt={detailProduct.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <motion.button
                  key={`${img}-${idx}`}
                  whileTap={{scale: 0.95}}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 sm:w-24 aspect-[4/3] rounded-[16px] overflow-hidden p-1 transition-all shrink-0 cursor-pointer ${
                    selectedImageIdx === idx
                      ? 'glass-panel border-blue-500 ring-2 ring-blue-500/40'
                      : 'glass-surface-subtle opacity-75 hover:opacity-100'
                  }`}
                >
                  <SmartImage
                    src={img}
                    alt={`${detailProduct.title} view ${idx + 1}`}
                    className="w-full h-full object-cover rounded-[11px]"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Glass Purchase Module */}
        <div className="lg:col-span-5 rounded-[28px] glass-panel-elevated p-5 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-blue-700">{detailProduct.brand_name}</span>
              <span aria-hidden="true">·</span>
              <span>{detailProduct.category_name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">SKU {detailProduct.sku}</span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {detailProduct.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 pt-1">
              <div className="flex items-center gap-1.5">
                <SquircleIcon
                  icon={Star}
                  size="xxs"
                  variant="glass"
                  iconClassName="text-amber-500 fill-amber-500"
                />
                <span className="font-mono font-semibold text-slate-900 tabular-nums">{detailProduct.rating_avg}</span>
              </div>
              <span className="text-slate-400">·</span>
              <span className="tabular-nums">{productReviews.length || detailProduct.rating_count} reviews</span>
              <span className="text-slate-400">·</span>
              <span className={outOfStock ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                {outOfStock ? 'Out of Stock' : `In Stock (${detailProduct.stock} units)`}
              </span>
            </div>
          </div>

          {/* Glass Pricing Block */}
          <div className="p-4 rounded-[20px] glass-surface-subtle flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono font-bold text-2xl sm:text-3xl text-slate-900 tabular-nums">
                {formatCurrency(detailProduct.discount_price)}
              </span>
              {detailProduct.original_price > detailProduct.discount_price && (
                <span className="font-mono text-sm sm:text-base text-slate-500 line-through tabular-nums">
                  {formatCurrency(detailProduct.original_price)}
                </span>
              )}
            </div>
            {detailProduct.discount_percent > 0 && (
              <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                Save {detailProduct.discount_percent}% (
                {formatCurrency(detailProduct.original_price - detailProduct.discount_price)})
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{detailProduct.short_description}</p>

          {/* Quantity & Glass Actions */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex items-center gap-1.5 p-1.5 rounded-[15px] glass-surface-subtle">
                <motion.button
                  whileTap={{scale: 0.9}}
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="cursor-pointer group"
                >
                  <SquircleIcon icon={Minus} size="sm" variant="glass" />
                </motion.button>
                <span className="w-8 text-center font-mono text-sm font-bold tabular-nums">{quantity}</span>
                <motion.button
                  whileTap={{scale: 0.9}}
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, detailProduct.stock), q + 1))}
                  aria-label="Increase quantity"
                  className="cursor-pointer group"
                >
                  <SquircleIcon icon={Plus} size="sm" variant="glass" />
                </motion.button>
              </div>

              <GlassButton
                type="button"
                size="lg"
                variant="obsidian"
                disabled={outOfStock}
                onClick={() => addToCart(detailProduct, quantity, true)}
                className="flex-1"
              >
                <SquircleIcon icon={ShoppingBag} size="xs" variant="glass" />
                <span>Add to Cart</span>
              </GlassButton>

              <motion.button
                whileTap={{scale: 0.92}}
                type="button"
                onClick={() => toggleWishlist(detailProduct.id)}
                aria-label="Toggle wishlist"
                className="cursor-pointer group"
              >
                <SquircleIcon
                  icon={Heart}
                  size="lg"
                  variant={wishlisted ? 'cobalt' : 'glass'}
                  iconClassName={wishlisted ? 'fill-current' : ''}
                />
              </motion.button>
            </div>

            <GlassButton
              type="button"
              size="lg"
              variant="cobalt"
              disabled={outOfStock}
              onClick={() => {
                addToCart(detailProduct, quantity, false);
                navigate('checkout');
              }}
              className="w-full"
            >
              <SquircleIcon icon={Zap} size="xs" variant="glass" />
              <span>Buy Now · WhatsApp Checkout</span>
            </GlassButton>
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 border-t border-white/60 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2.5">
              <SquircleIcon icon={ShieldCheck} size="xs" variant="glass" />
              <span>{detailProduct.warranty}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <SquircleIcon icon={Truck} size="xs" variant="glass" />
              <span>Free insured express delivery on orders over $250</span>
            </div>
            <div className="flex items-center gap-2.5">
              <SquircleIcon icon={CheckCircle2} size="xs" variant="glass" />
              <span>Instant WhatsApp confirmation via +93703842099</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Tabs: Description, Specifications, Warranty, Reviews */}
      <section className="rounded-[28px] glass-panel p-5 sm:p-10 space-y-7">
        <div className="flex flex-wrap gap-2 border-b border-white/60 pb-4">
          {(
            [
              {id: 'overview', label: 'Overview'},
              {id: 'specs', label: 'Technical Specifications'},
              {id: 'warranty', label: 'Warranty & Care'},
              {id: 'reviews', label: `Reviews (${productReviews.length})`},
            ] as const
          ).map((tab) => (
            <GlassButton
              key={tab.id}
              type="button"
              size="sm"
              variant={activeTab === tab.id ? 'obsidian' : 'glass'}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </GlassButton>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="max-w-3xl space-y-4">
            <h2 className="font-display font-bold text-xl text-slate-900">Engineering & Design</h2>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{detailProduct.description}</p>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-slate-900">Technical Specifications</h2>
            <div className="divide-y divide-white/60 border border-white/75 rounded-[20px] overflow-hidden glass-surface-subtle">
              {detailProduct.specifications.map((spec, idx) => (
                <div
                  key={`${spec.label}-${idx}`}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">{spec.label}</span>
                  <span className="sm:col-span-2 text-xs sm:text-sm font-mono text-slate-900 tabular-nums">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'warranty' && (
          <div className="max-w-3xl space-y-4">
            <h2 className="font-display font-bold text-xl text-slate-900">Warranty & Authenticity Guarantee</h2>
            <p className="text-slate-700 leading-relaxed">{detailProduct.warranty}</p>
            <p className="text-sm text-slate-600">
              Every device dispatched by THREE BROTHERS undergoes serial-number verification and includes tamper-evident insured courier packaging.
            </p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <h2 className="font-display font-bold text-xl text-slate-900">Verified Reviews</h2>
              {productReviews.length === 0 ? (
                <p className="text-sm text-slate-600">No reviews yet. Be the first buyer to share feedback.</p>
              ) : (
                productReviews.map((r) => (
                  <div key={r.id} className="p-5 rounded-[20px] glass-surface-subtle space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900">{r.author_name}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({length: r.rating}).map((_, i) => (
                          <SquircleIcon
                            key={i}
                            icon={Star}
                            size="xxs"
                            variant="glass"
                            iconClassName="text-amber-500 fill-amber-500"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{r.author_role}</p>
                    <p className="font-semibold text-sm text-slate-900">{r.title}</p>
                    <p className="text-sm text-slate-700">{r.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="lg:col-span-5 rounded-[22px] glass-surface-subtle p-5 sm:p-6 space-y-4 h-fit"
            >
              <h3 className="font-display font-semibold text-base text-slate-900">Write a Review</h3>
              <input
                type="text"
                required
                value={revName}
                onChange={(e) => setRevName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full h-10 px-3.5 rounded-[12px] glass-input text-sm"
              />
              <input
                type="text"
                value={revRole}
                onChange={(e) => setRevRole(e.target.value)}
                placeholder="City or Role (optional)"
                className="w-full h-10 px-3.5 rounded-[12px] glass-input text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">Rating</span>
                <select
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="h-9 px-3 rounded-[11px] glass-input text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={revTitle}
                onChange={(e) => setRevTitle(e.target.value)}
                placeholder="Review Headline"
                className="w-full h-10 px-3.5 rounded-[12px] glass-input text-sm"
              />
              <textarea
                required
                rows={3}
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder="Share your experience with build quality and delivery..."
                className="w-full p-3.5 rounded-[12px] glass-input text-sm"
              />
              <GlassButton type="submit" variant="obsidian" disabled={submittingReview} className="w-full">
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </GlassButton>
            </form>
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display font-bold text-2xl text-slate-900">Related Electronics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
