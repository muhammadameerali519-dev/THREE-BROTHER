import React, {useMemo, useState} from 'react';
import {
  ArrowRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import {motion} from 'motion/react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {ProductCard} from '../components/ProductCard.tsx';
import {getCategoryIcon, SmartImage, SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import {formatCurrency} from '../utils/whatsapp.ts';

export function ShopPage({mode = 'shop'}: {mode?: 'shop' | 'products' | 'deals'}) {
  const {
    products,
    categories,
    brands,
    shopFilters,
    setShopFilters,
    recentlyViewedIds,
    navigate,
  } = useStore();

  const [maxPrice, setMaxPrice] = useState<number>(1200000);
  const [inStockOnly, setInStockOnly] = useState(false);

  const searchQ = (shopFilters.search || '').trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (mode === 'deals' || shopFilters.onlyDeals) {
      list = list.filter((p) => p.discount_percent > 0 || p.is_featured_deal);
    }
    if (shopFilters.categorySlug) {
      const cat = categories.find((c) => c.slug === shopFilters.categorySlug);
      if (cat) list = list.filter((p) => p.category_id === cat.id);
    }
    if (shopFilters.brandSlug) {
      const brand = brands.find((b) => b.slug === shopFilters.brandSlug);
      if (brand) list = list.filter((p) => p.brand_id === brand.id);
    }
    if (searchQ) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQ) ||
          p.brand_name.toLowerCase().includes(searchQ) ||
          p.category_name.toLowerCase().includes(searchQ) ||
          p.short_description.toLowerCase().includes(searchQ),
      );
    }
    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }
    list = list.filter((p) => p.discount_price <= maxPrice);

    const sortBy = shopFilters.sortBy || 'featured';
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.discount_price - b.discount_price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.discount_price - a.discount_price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating_avg - a.rating_avg);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
    return list;
  }, [products, categories, brands, shopFilters, searchQ, maxPrice, inStockOnly, mode]);

  const recentlyViewedProducts = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p]));
    return recentlyViewedIds.map((id) => map.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [recentlyViewedIds, products]);

  const heading =
    mode === 'deals'
      ? 'Deals & Exclusive Offers'
      : mode === 'products'
        ? 'All Technology Products'
        : 'Shop Flagship Electronics';

  const subtitle =
    mode === 'deals'
      ? 'Curated price allocations and limited-time seasonal savings across flagship hardware.'
      : 'Filter by category, manufacturer, price ceiling, and availability.';

  const resetFilters = () => {
    setShopFilters({sortBy: 'featured'});
    setMaxPrice(1200000);
    setInStockOnly(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Header */}
      <div className="rounded-[26px] glass-panel p-5 sm:p-7 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-700 mb-1">
            THREE BROTHERS Catalog · {filteredProducts.length} items
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">{heading}</h1>
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={shopFilters.sortBy || 'featured'}
            onChange={(e) =>
              setShopFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as NonNullable<typeof shopFilters.sortBy>,
              }))
            }
            aria-label="Sort products"
            className="h-11 px-4 rounded-[14px] glass-input text-sm font-medium text-slate-900"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Glass Filter Sidebar */}
        <aside className="lg:col-span-3 rounded-[26px] glass-panel p-5 space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SquircleIcon icon={SlidersHorizontal} size="xs" variant="dark" />
              <h2 className="font-display font-semibold text-sm text-slate-900">Filters</h2>
            </div>
            <GlassButton type="button" size="sm" variant="glass" onClick={resetFilters} className="!h-8 !px-2.5">
              <SquircleIcon icon={RotateCcw} size="xxs" variant="subtle" />
              <span>Reset</span>
            </GlassButton>
          </div>

          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Search Keyword</label>
            <div className="relative flex items-center">
              <span className="absolute left-1.5 pointer-events-none">
                <SquircleIcon icon={Search} size="xs" variant="glass" />
              </span>
              <input
                type="text"
                value={shopFilters.search || ''}
                onChange={(e) => setShopFilters((prev) => ({...prev, search: e.target.value}))}
                placeholder="Model, brand, spec..."
                className="w-full h-10 pl-10 pr-3 rounded-[13px] glass-input text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Category</label>
            <select
              value={shopFilters.categorySlug || ''}
              onChange={(e) =>
                setShopFilters((prev) => ({...prev, categorySlug: e.target.value || undefined}))
              }
              className="w-full h-10 px-3 rounded-[13px] glass-input text-sm text-slate-900"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name} ({c.product_count ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Brand</label>
            <select
              value={shopFilters.brandSlug || ''}
              onChange={(e) =>
                setShopFilters((prev) => ({...prev, brandSlug: e.target.value || undefined}))
              }
              className="w-full h-10 px-3 rounded-[13px] glass-input text-sm text-slate-900"
            >
              <option value="">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Ceiling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Max Price</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {formatCurrency(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={1200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-white/60">
            <label className="flex items-center justify-between text-sm text-slate-800 cursor-pointer">
              <span>In stock only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
            </label>
            {mode !== 'deals' && (
              <label className="flex items-center justify-between text-sm text-slate-800 cursor-pointer">
                <span>Exclusive discounts</span>
                <input
                  type="checkbox"
                  checked={Boolean(shopFilters.onlyDeals)}
                  onChange={(e) => setShopFilters((prev) => ({...prev, onlyDeals: e.target.checked}))}
                  className="w-4 h-4 rounded accent-blue-600"
                />
              </label>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9 space-y-10">
          {filteredProducts.length === 0 ? (
            <div className="rounded-[28px] glass-panel p-12 text-center space-y-4">
              <div className="flex justify-center">
                <SquircleIcon icon={Tag} size="xl" variant="glass" />
              </div>
              <h3 className="font-display font-semibold text-lg text-slate-900">
                No matching electronics found
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Adjust your selected category, brand, or maximum price ceiling to explore available devices.
              </p>
              <GlassButton type="button" variant="obsidian" onClick={resetFilters}>
                Clear All Filters
              </GlassButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              {filteredProducts.map((prod, idx) => (
                <ProductCard key={prod.id} product={prod} index={idx} />
              ))}
            </div>
          )}

          {/* Recently Viewed */}
          {recentlyViewedProducts.length > 0 && (
            <div className="pt-8 border-t border-white/60 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-xl text-slate-900">Recently Viewed</h2>
                <GlassButton type="button" size="sm" variant="glass" onClick={() => navigate('products')}>
                  Browse Full Catalog
                </GlassButton>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                {recentlyViewedProducts.slice(0, 4).map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{y: -3}}
                    whileTap={{scale: 0.98}}
                    type="button"
                    onClick={() => navigate('product', p.slug)}
                    className="rounded-[20px] glass-panel p-3 text-left transition-shadow cursor-pointer"
                  >
                    <div className="aspect-[4/3] rounded-[13px] overflow-hidden bg-white/50 border border-white/70 mb-2">
                      <SmartImage src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 truncate">{p.title}</p>
                    <p className="font-mono text-xs text-slate-700 tabular-nums mt-0.5">
                      {formatCurrency(p.discount_price)}
                    </p>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const {categories, navigate} = useStore();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8 max-w-3xl">
        <p className="text-xs font-semibold text-blue-700 mb-1">16 Technology Departments</p>
        <h1 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
          Electronics Categories
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Explore our complete hardware portfolio from flagship titanium smartphones and studio workstations to GaN power infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat, idx) => {
          const CatIcon = getCategoryIcon(cat.icon_name);
          return (
            <motion.button
              key={cat.id}
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.25, delay: Math.min(idx * 0.03, 0.2)}}
              whileHover={{y: -4}}
              whileTap={{scale: 0.98}}
              type="button"
              onClick={() => navigate('shop', '', {categorySlug: cat.slug, sortBy: 'featured'})}
              className="group rounded-[26px] glass-panel p-4 sm:p-5 text-left hover:shadow-xl transition-shadow cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="aspect-[4/3] rounded-[18px] overflow-hidden bg-white/50 border border-white/70 mb-4 relative">
                  <SmartImage
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <SquircleIcon icon={CatIcon} size="md" variant="glass" />
                  </div>
                </div>
                <h2 className="font-display font-semibold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between text-xs font-medium text-slate-800">
                <span className="tabular-nums">{cat.product_count ?? 0} devices</span>
                <SquircleIcon icon={ArrowRight} size="xs" variant="glass" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function BrandsPage() {
  const {brands, products, navigate} = useStore();

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8 max-w-3xl">
        <p className="text-xs font-semibold text-blue-700 mb-1">Authorized Global Manufacturers</p>
        <h1 className="font-display font-bold text-2xl sm:text-4xl text-slate-900 tracking-tight">
          Flagship Technology Brands
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Every brand at THREE BROTHERS is sourced through verified global channels with authentic manufacturer warranty coverage.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map((brand, idx) => {
          const count = products.filter((p) => p.brand_id === brand.id).length;
          return (
            <motion.button
              key={brand.id}
              initial={{opacity: 0, y: 12}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{duration: 0.25, delay: idx * 0.03}}
              whileHover={{y: -4}}
              whileTap={{scale: 0.98}}
              type="button"
              onClick={() => navigate('shop', '', {brandSlug: brand.slug, sortBy: 'featured'})}
              className="rounded-[26px] glass-panel p-6 sm:p-7 text-left hover:shadow-xl transition-shadow cursor-pointer flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">{brand.country}</p>
                <h2 className="font-display font-bold text-2xl text-slate-900 group-hover:text-blue-700 transition-colors">
                  {brand.name}
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">{brand.tagline}</p>
              </div>
              <div className="pt-4 border-t border-white/60 flex items-center justify-between text-xs font-semibold text-blue-700">
                <span className="tabular-nums">{count} available products</span>
                <SquircleIcon icon={ArrowRight} size="xs" variant="cobalt" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
