import React, {useMemo, useRef, useState} from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import {motion, useScroll, useTransform} from 'motion/react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {ProductCard} from '../components/ProductCard.tsx';
import {getCategoryIcon, SmartImage, SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import {formatCurrency} from '../utils/whatsapp.ts';

export function HomePage() {
  const {categories, brands, products, banners, reviews, navigate, showToast} = useStore();
  const [collectionTab, setCollectionTab] = useState<'trending' | 'bestsellers' | 'new'>('trending');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const {scrollYProgress} = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroMediaY = useTransform(scrollYProgress, [0, 1], [0, 26]);

  const heroBanner = useMemo(
    () =>
      banners.find((b) => b.placement === 'hero' && b.active) || {
        headline: 'TECHNOLOGY THAT MOVES YOU.',
        description:
          'Discover the latest electronics, innovative gadgets, and premium technology products at THREE BROTHERS.',
        cta_text: 'SHOP NOW',
        cta_target: 'shop',
        image: '/src/assets/images/hero_flagship_tech_1795408033150.jpg',
        subtitle: 'Flagship Collection 2026',
      },
    [banners],
  );

  const promoBanner = useMemo(
    () => banners.find((b) => b.placement === 'promo' && b.active),
    [banners],
  );

  const featuredCategories = useMemo(() => categories.filter((c) => c.featured).slice(0, 8), [categories]);

  const curatedProducts = useMemo(() => {
    if (collectionTab === 'trending') {
      return products.filter((p) => p.is_trending).slice(0, 6);
    }
    if (collectionTab === 'bestsellers') {
      return products.filter((p) => p.is_bestseller).slice(0, 6);
    }
    return products.filter((p) => p.is_new_arrival).slice(0, 6);
  }, [products, collectionTab]);

  const exclusiveDeals = useMemo(
    () => products.filter((p) => p.is_featured_deal || p.discount_percent >= 10).slice(0, 3),
    [products],
  );

  const popularBrands = useMemo(() => brands.filter((b) => b.featured).slice(0, 6), [brands]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: newsletterEmail.trim()}),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not subscribe.');
      } else {
        showToast(data.message || 'Subscribed successfully.');
        setNewsletterEmail('');
      }
    } catch {
      showToast('Network error while subscribing.');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="space-y-14 sm:space-y-20 pb-12 pt-3 sm:pt-5">
      {/* 1. SPATIAL GLASS HERO SECTION */}
      <section ref={heroRef} className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="relative rounded-[28px] sm:rounded-[36px] glass-surface-dark text-white overflow-hidden p-5 sm:p-10 lg:p-14">
          {/* Atmospheric Internal Glass Refraction */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(59,130,246,0.28),transparent_55%),radial-gradient(circle_at_15%_85%,rgba(148,163,184,0.14),transparent_48%)] pointer-events-none"
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Copy */}
            <motion.div
              initial={{opacity: 0, y: 18}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
              className="lg:col-span-6 space-y-5 sm:space-y-6 min-w-0"
            >
              <p className="text-xs sm:text-sm font-medium tracking-wide text-blue-300">
                {heroBanner.subtitle || 'THREE BROTHERS Flagship Electronics'}
              </p>

              <h1
                className="font-display font-bold tracking-tight text-white leading-[1.06]"
                style={{fontSize: 'clamp(1.95rem, 4.3vw, 3.85rem)', textWrap: 'balance'}}
              >
                {heroBanner.headline}
              </h1>

              <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {heroBanner.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <GlassButton
                  type="button"
                  size="lg"
                  variant="cobalt"
                  onClick={() => navigate(heroBanner.cta_target === 'deals' ? 'deals' : 'shop')}
                >
                  <span>{heroBanner.cta_text || 'SHOP NOW'}</span>
                  <SquircleIcon icon={ArrowRight} size="xxs" variant="glass" />
                </GlassButton>

                <GlassButton
                  type="button"
                  size="lg"
                  variant="glass"
                  onClick={() => navigate('categories')}
                  className="!bg-white/15 !text-white !border-white/25 hover:!bg-white/25"
                >
                  EXPLORE COLLECTION
                </GlassButton>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300/90 border-t border-white/15">
                <span>Factory Sealed</span>
                <span aria-hidden="true">·</span>
                <span>Official Global Warranties</span>
                <span aria-hidden="true">·</span>
                <span>Instant WhatsApp Concierge</span>
              </div>
            </motion.div>

            {/* Hero Visual Showcase with Subtle GPU Parallax */}
            <motion.div
              style={{y: heroMediaY}}
              initial={{opacity: 0, scale: 0.97}}
              animate={{opacity: 1, scale: 1}}
              transition={{duration: 0.6, ease: [0.16, 1, 0.3, 1]}}
              className="lg:col-span-6 relative min-w-0"
            >
              <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden border border-white/20 shadow-[0_28px_80px_rgba(0,0,0,0.55)] aspect-[16/10] bg-slate-900">
                <SmartImage
                  priority
                  src={heroBanner.image}
                  alt="THREE BROTHERS flagship electronics collection"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent pointer-events-none" />

                {/* Floating Glass Hardware Callout */}
                {products[0] && (
                  <motion.button
                    whileHover={{y: -2}}
                    whileTap={{scale: 0.98}}
                    type="button"
                    onClick={() => navigate('product', products[0].slug)}
                    className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-auto sm:w-80 p-3 sm:p-3.5 rounded-[18px] glass-surface-dark border border-white/25 flex items-center justify-between gap-3 text-left hover:border-blue-400/60 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SquircleIcon icon={Sparkles} size="sm" variant="cobalt" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-blue-300 font-medium truncate">
                          {products[0].brand_name} Flagship
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">{products[0].title}</p>
                      </div>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-bold text-white shrink-0 tabular-nums">
                      {formatCurrency(products[0].discount_price)}
                    </span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">Curated Hardware Lines</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Featured Categories
            </h2>
          </div>
          <GlassButton type="button" size="sm" variant="glass" onClick={() => navigate('categories')}>
            <span>All 16 Categories</span>
            <SquircleIcon icon={ArrowRight} size="xxs" variant="subtle" />
          </GlassButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
          {featuredCategories.map((cat, idx) => {
            const CatIcon = getCategoryIcon(cat.icon_name);
            return (
              <motion.button
                key={cat.id}
                type="button"
                initial={{opacity: 0, y: 12}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true}}
                transition={{duration: 0.28, delay: idx * 0.03}}
                whileHover={{y: -3}}
                whileTap={{scale: 0.98}}
                onClick={() => navigate('shop', '', {categorySlug: cat.slug, sortBy: 'featured'})}
                className="group relative rounded-[24px] glass-panel p-3 sm:p-4 text-left hover:shadow-[0_20px_44px_-12px_rgba(15,23,42,0.14)] transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="aspect-[4/3] rounded-[16px] overflow-hidden bg-white/50 border border-white/70 mb-3 relative">
                  <SmartImage
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2">
                    <SquircleIcon icon={CatIcon} size="sm" variant="glass" />
                  </div>
                </div>
                <h3 className="font-display font-semibold text-slate-900 text-xs sm:text-base truncate group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 tabular-nums">
                  {cat.product_count ?? 0} devices
                </p>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 3. TRENDING / BEST SELLERS / NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">Precision Selection</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Curated Storefront Picks
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 p-1.5 rounded-[18px] glass-panel self-start max-w-full overflow-x-auto">
            {(
              [
                {id: 'trending', label: 'Trending'},
                {id: 'bestsellers', label: 'Best Sellers'},
                {id: 'new', label: 'New Arrivals'},
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCollectionTab(tab.id)}
                className={`relative px-3.5 sm:px-4 py-2 rounded-[13px] text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  collectionTab === tab.id ? 'text-slate-950 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {collectionTab === tab.id && (
                  <motion.span
                    layoutId="home-collection-tab"
                    transition={{type: 'spring', stiffness: 360, damping: 28}}
                    className="absolute inset-0 rounded-[13px] bg-white/90 border border-white shadow-sm"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {curatedProducts.map((prod, idx) => (
            <ProductCard key={prod.id} product={prod} index={idx} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <GlassButton type="button" size="lg" variant="obsidian" onClick={() => navigate('products')}>
            <span>View All Products</span>
            <SquircleIcon icon={ArrowRight} size="xxs" variant="glass" />
          </GlassButton>
        </div>
      </section>

      {/* 4. EXCLUSIVE DEALS GLASS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="rounded-[28px] sm:rounded-[34px] glass-surface-dark text-white p-5 sm:p-10 lg:p-12 overflow-hidden relative">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
          />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4 sm:space-y-5">
              <p className="text-xs font-semibold text-blue-300">
                {promoBanner?.subtitle || 'Limited-Time Allocation'}
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-4xl leading-tight" style={{textWrap: 'balance'}}>
                {promoBanner?.headline || 'Exclusive Deals on Flagship Hardware.'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {promoBanner?.description ||
                  'Direct factory allocations with special savings across titanium smartphones, OLED displays, and reference audio.'}
              </p>
              <GlassButton type="button" variant="glass" onClick={() => navigate('deals')}>
                <span>Explore Exclusive Deals</span>
                <SquircleIcon icon={ArrowRight} size="xxs" variant="dark" />
              </GlassButton>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {exclusiveDeals.map((deal) => (
                <motion.button
                  key={deal.id}
                  whileHover={{y: -3}}
                  whileTap={{scale: 0.98}}
                  type="button"
                  onClick={() => navigate('product', deal.slug)}
                  className="group rounded-[22px] bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md p-3.5 text-left transition-colors cursor-pointer flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  <div className="aspect-[4/3] rounded-[14px] overflow-hidden bg-slate-900 mb-3 relative border border-white/10">
                    <SmartImage
                      src={deal.images[0]}
                      alt={deal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {deal.discount_percent > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[8px] glass-btn-cobalt text-white font-mono text-[10px] font-bold tabular-nums">
                        Save {deal.discount_percent}%
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-300 truncate">{deal.brand_name}</p>
                    <p className="text-sm font-semibold text-white line-clamp-1 mt-0.5">{deal.title}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        {formatCurrency(deal.discount_price)}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 line-through tabular-nums">
                        {formatCurrency(deal.original_price)}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. POPULAR BRANDS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-1">Authorized Partners</p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Popular Brands
            </h2>
          </div>
          <GlassButton type="button" size="sm" variant="glass" onClick={() => navigate('brands')}>
            <span>All Brands</span>
            <SquircleIcon icon={ArrowRight} size="xxs" variant="subtle" />
          </GlassButton>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {popularBrands.map((brand) => (
            <motion.button
              key={brand.id}
              whileHover={{y: -3}}
              whileTap={{scale: 0.97}}
              type="button"
              onClick={() => navigate('shop', '', {brandSlug: brand.slug, sortBy: 'featured'})}
              className="rounded-[22px] glass-panel p-4 sm:p-5 text-left hover:border-white transition-all cursor-pointer group"
            >
              <p className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                {brand.name}
              </p>
              <p className="mt-1 text-xs text-slate-600 line-clamp-2">{brand.tagline}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE US */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold text-blue-700 mb-1">The THREE BROTHERS Standard</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Why Discerning Buyers Choose Us
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              icon: ShieldCheck,
              title: 'Verified Authenticity',
              desc: 'Every smartphone, laptop, and acoustic unit ships factory sealed with verifiable serial numbers.',
            },
            {
              icon: Award,
              title: 'Official Global Warranty',
              desc: 'Protected by full international manufacturer coverage plus priority THREE BROTHERS service.',
            },
            {
              icon: Truck,
              title: 'Insured Express Courier',
              desc: 'Complimentary insured express delivery on orders above $250 with milestone tracking.',
            },
            {
              icon: MessageCircle,
              title: 'Direct WhatsApp Concierge',
              desc: 'Instant human order confirmation and specialist hardware guidance on +93703842099.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] glass-panel p-5 sm:p-6 space-y-3.5 group">
              <SquircleIcon icon={item.icon} size="lg" variant="cobalt" />
              <h3 className="font-display font-semibold text-slate-900 text-base">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-semibold text-blue-700 mb-1">Verified Buyers</p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Trusted Across Studios & Everyday Workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {reviews.slice(0, 4).map((rev) => (
            <div key={rev.id} className="rounded-[24px] glass-panel p-5 sm:p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {Array.from({length: rev.rating}).map((_, idx) => (
                    <SquircleIcon
                      key={idx}
                      icon={Star}
                      size="xxs"
                      variant="glass"
                      iconClassName="text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <h3 className="font-display font-semibold text-slate-900 text-sm">{rev.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
              <div className="pt-3 border-t border-white/60 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{rev.author_name}</p>
                  <p className="text-[11px] text-slate-600">{rev.author_role}</p>
                </div>
                <SquircleIcon icon={CheckCircle2} size="xs" variant="glass" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="rounded-[28px] sm:rounded-[32px] glass-panel-elevated p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-lg space-y-2">
            <div className="flex items-center gap-3">
              <SquircleIcon icon={Mail} size="md" variant="dark" />
              <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
                Receive Priority Hardware Drops
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              Early access to flagship smartphone allocations, studio workstations, and member-only offers.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="you@domain.com"
              aria-label="Email address for newsletter"
              className="h-12 px-4 sm:w-72 rounded-[14px] glass-input text-sm text-slate-900"
            />
            <GlassButton type="submit" size="lg" variant="obsidian" disabled={newsletterSubmitting}>
              {newsletterSubmitting ? 'Joining...' : 'Subscribe'}
            </GlassButton>
          </form>
        </div>
      </section>
    </div>
  );
}
