import React, {useCallback, useEffect, useState} from 'react';
import {
  CheckCircle2,
  DollarSign,
  Edit3,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {SmartImage, SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import type {Banner, ContactMessage, Order, OrderStatus, Product, ProductSpec} from '../types.ts';
import {formatCurrency} from '../utils/whatsapp.ts';

interface DashboardData {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    subscriberCount: number;
  };
  orders: Order[];
  messages: ContactMessage[];
  banners: Banner[];
}

export function AdminDashboardPage() {
  const {
    adminToken,
    setAdminToken,
    products,
    categories,
    brands,
    refreshStorefront,
    showToast,
  } = useStore();

  const [authStatus, setAuthStatus] = useState<{
    configured: boolean;
    envConfigured: boolean;
    authenticated: boolean;
  } | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'taxonomy' | 'banners' | 'messages'>('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);

  // Product Modal State
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category & Brand creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [newBrandTagline, setNewBrandTagline] = useState('');

  // Banner modal/form
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
      const res = await fetch('/api/admin/auth-status', {headers});
      const data = await res.json();
      setAuthStatus(data);
    } catch {
      setAuthStatus({configured: true, envConfigured: false, authenticated: false});
    }
  }, [adminToken]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const loadDashboard = useCallback(async () => {
    if (!adminToken) return;
    setLoadingDash(true);
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: {Authorization: `Bearer ${adminToken}`},
      });
      if (res.status === 401) {
        setAdminToken(null);
        return;
      }
      const data = await res.json();
      setDashboard(data);
    } catch {
      showToast('Failed to load admin metrics.');
    } finally {
      setLoadingDash(false);
    }
  }, [adminToken, setAdminToken, showToast]);

  useEffect(() => {
    if (adminToken) {
      loadDashboard();
    }
  }, [adminToken, loadDashboard]);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeInput.trim()) return;
    setAuthLoading(true);
    try {
      const endpoint = authStatus?.configured ? '/api/admin/login' : '/api/admin/claim';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({passcode: passcodeInput.trim()}),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Authentication failed.');
      } else {
        setAdminToken(data.token);
        setPasscodeInput('');
        showToast(authStatus?.configured ? 'Signed in to Admin Console.' : 'Admin passcode claimed & activated.');
        await checkAuthStatus();
      }
    } catch {
      showToast('Network error during admin authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct({
      title: '',
      brand_id: brands[0]?.id || '',
      category_id: categories[0]?.id || '',
      original_price: 45000,
      discount_price: 39900,
      stock: 10,
      sku: '',
      short_description: '',
      description: '',
      warranty: '1 Year Official International Warranty',
      images: ['/src/assets/images/product_smart_accessories_1795408033153.jpg'],
      specifications: [{label: 'Connectivity', value: 'USB-C / Wireless'}],
      is_trending: true,
      is_bestseller: false,
      is_new_arrival: true,
      is_featured_deal: false,
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({dataUrl: reader.result}),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Upload failed.');
        } else {
          setEditingProduct((prev) =>
            prev ? {...prev, images: [...(prev.images || []), data.url]} : prev,
          );
          showToast('Product image uploaded.');
        }
      } catch {
        showToast('Image upload failed.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !adminToken) return;
    setSavingProduct(true);
    try {
      const isEdit = Boolean(editingProduct.id);
      const url = isEdit ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save product.');
      } else {
        showToast(isEdit ? 'Product updated.' : 'New product published to storefront.');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        await refreshStorefront();
        await loadDashboard();
      }
    } catch {
      showToast('Error saving product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${adminToken}`},
      });
      if (res.ok) {
        showToast('Product deleted.');
        await refreshStorefront();
        await loadDashboard();
      }
    } catch {
      showToast('Could not delete product.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({status}),
      });
      if (res.ok) {
        showToast(`Order status updated to ${status}.`);
        await loadDashboard();
      }
    } catch {
      showToast('Could not update order status.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !newCatName.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({name: newCatName.trim(), description: newCatDesc.trim(), featured: true}),
    });
    const data = await res.json();
    if (res.ok) {
      setNewCatName('');
      setNewCatDesc('');
      showToast('Category added.');
      await refreshStorefront();
    } else {
      showToast(data.error || 'Could not create category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${adminToken}`},
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Category removed.');
      await refreshStorefront();
    } else {
      showToast(data.error || 'Cannot remove category.');
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !newBrandName.trim()) return;
    const res = await fetch('/api/admin/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: newBrandName.trim(),
        country: newBrandCountry.trim() || 'Global',
        tagline: newBrandTagline.trim() || 'Authorized Hardware Partner',
        featured: true,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewBrandName('');
      setNewBrandCountry('');
      setNewBrandTagline('');
      showToast('Brand added.');
      await refreshStorefront();
    } else {
      showToast(data.error || 'Could not add brand.');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${adminToken}`},
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Brand removed.');
      await refreshStorefront();
    } else {
      showToast(data.error || 'Cannot remove brand.');
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingBanner) return;
    const isEdit = Boolean(editingBanner.id);
    const res = await fetch(isEdit ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners', {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(editingBanner),
    });
    if (res.ok) {
      showToast(isEdit ? 'Banner updated.' : 'Banner published.');
      setIsBannerModalOpen(false);
      setEditingBanner(null);
      await refreshStorefront();
      await loadDashboard();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save banner.');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'DELETE',
      headers: {Authorization: `Bearer ${adminToken}`},
    });
    if (res.ok) {
      showToast('Banner deleted.');
      await refreshStorefront();
      await loadDashboard();
    }
  };

  // Auth Gate
  if (!adminToken) {
    const needsFirstRunClaim = authStatus && !authStatus.configured;
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="rounded-[28px] glass-panel-elevated p-7 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <SquircleIcon icon={Lock} size="lg" variant="dark" />
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900">
                {needsFirstRunClaim ? 'Claim Admin Access' : 'Admin Console Login'}
              </h1>
              <p className="text-xs text-slate-600">
                {needsFirstRunClaim
                  ? 'Set your initial administrator passcode to secure the store console.'
                  : 'Enter your administrator passcode to manage catalog and orders.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4">
            <input
              type="password"
              required
              minLength={6}
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              placeholder={needsFirstRunClaim ? 'Create Admin Passcode (min 6 chars)' : 'Enter Admin Passcode'}
              className="w-full h-11 px-3.5 rounded-[14px] glass-input text-sm text-slate-900 placeholder:text-slate-400"
            />
            <GlassButton
              type="submit"
              variant="obsidian"
              size="md"
              disabled={authLoading}
              className="w-full"
            >
              {authLoading
                ? 'Verifying...'
                : needsFirstRunClaim
                  ? 'Claim & Enter Console'
                  : 'Unlock Admin Dashboard'}
            </GlassButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Bar */}
      <div className="rounded-[28px] glass-panel p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <SquircleIcon icon={LayoutDashboard} size="lg" variant="cobalt" />
          <div>
            <p className="text-xs font-semibold text-blue-700">THREE BROTHERS Store Operations</p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Admin Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton
            type="button"
            variant="obsidian"
            size="sm"
            onClick={openNewProductModal}
          >
            <SquircleIcon icon={Plus} size="xxs" variant="cobalt" />
            <span>Add Product</span>
          </GlassButton>
          <GlassButton
            type="button"
            variant="glass"
            size="sm"
            onClick={() => setAdminToken(null)}
          >
            <SquircleIcon icon={LogOut} size="xxs" variant="subtle" />
            <span>Lock</span>
          </GlassButton>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            {id: 'overview', label: 'Overview', icon: LayoutDashboard},
            {id: 'products', label: `Products (${products.length})`, icon: Package},
            {id: 'orders', label: `Orders (${dashboard?.orders.length ?? 0})`, icon: ShoppingCart},
            {id: 'taxonomy', label: 'Categories & Brands', icon: Tag},
            {id: 'banners', label: 'Homepage Banners', icon: ImageIcon},
            {id: 'messages', label: `Messages (${dashboard?.messages.length ?? 0})`, icon: Mail},
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`h-11 px-4 rounded-[14px] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'glass-btn-obsidian text-white'
                : 'glass-panel text-slate-800 hover:bg-white/80'
            }`}
          >
            <SquircleIcon
              icon={tab.icon}
              size="xs"
              variant={activeTab === tab.id ? 'cobalt' : 'glass'}
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loadingDash && !dashboard ? (
        <div className="rounded-[28px] glass-panel py-16 text-center text-slate-600 text-sm">
          Loading store operations...
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeTab === 'overview' && dashboard && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {label: 'Total Revenue', value: formatCurrency(dashboard.stats.totalRevenue), icon: DollarSign},
                  {label: 'Total Orders', value: String(dashboard.stats.totalOrders), icon: ShoppingCart},
                  {label: 'Catalog Products', value: String(dashboard.stats.totalProducts), icon: Package},
                  {label: 'Pending Confirmation', value: String(dashboard.stats.pendingOrders), icon: Layers},
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-[24px] glass-panel p-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600">{kpi.label}</p>
                      <p className="mt-1 font-mono font-bold text-2xl text-slate-900 tabular-nums">{kpi.value}</p>
                    </div>
                    <SquircleIcon icon={kpi.icon} size="lg" variant="glass" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="rounded-[28px] glass-panel p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-bold text-lg text-slate-900">Recent Orders</h2>
                    <GlassButton
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setActiveTab('orders')}
                    >
                      Manage All
                    </GlassButton>
                  </div>
                  <div className="divide-y divide-white/60">
                    {dashboard.orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono font-semibold text-sm text-slate-900">{o.order_number}</p>
                          <p className="text-xs text-slate-600">
                            {o.customer_name} · {o.city}, {o.country}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                            {formatCurrency(o.grand_total)}
                          </p>
                          <p className="text-[11px] font-semibold text-blue-700">{o.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Monitor */}
                <div className="rounded-[28px] glass-panel p-6 space-y-4">
                  <h2 className="font-display font-bold text-lg text-slate-900">Inventory Watch</h2>
                  <div className="divide-y divide-white/60">
                    {products
                      .slice()
                      .sort((a, b) => a.stock - b.stock)
                      .slice(0, 5)
                      .map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                            <p className="text-xs text-slate-600">{p.brand_name} · {p.category_name}</p>
                          </div>
                          <span
                            className={`font-mono text-xs font-bold tabular-nums ${
                              p.stock <= 5 ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {p.stock} units
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <div className="rounded-[28px] glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/65 bg-white/40 text-xs font-semibold text-slate-700">
                      <th className="p-4">Product</th>
                      <th className="p-4">Category / Brand</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/55 text-sm">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-white/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <SmartImage
                              src={p.images[0]}
                              alt={p.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 glass-surface-subtle"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{p.title}</p>
                              <p className="font-mono text-xs text-slate-600">{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-slate-700">
                          {p.category_name} · {p.brand_name}
                        </td>
                        <td className="p-4 font-mono tabular-nums">
                          <span className="font-bold text-slate-900">{formatCurrency(p.discount_price)}</span>
                          {p.original_price > p.discount_price && (
                            <span className="ml-2 text-xs text-slate-400 line-through">
                              {formatCurrency(p.original_price)}
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono tabular-nums text-xs font-semibold">{p.stock}</td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProduct({...p});
                                setIsProductModalOpen(true);
                              }}
                              aria-label={`Edit ${p.title}`}
                              className="cursor-pointer"
                            >
                              <SquircleIcon icon={Edit3} size="xs" variant="glass" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              aria-label={`Delete ${p.title}`}
                              className="cursor-pointer text-rose-600"
                            >
                              <SquircleIcon icon={Trash2} size="xs" variant="subtle" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && dashboard && (
            <div className="space-y-4">
              {dashboard.orders.map((ord) => (
                <div key={ord.id} className="rounded-[28px] glass-panel p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/60">
                    <div>
                      <p className="font-mono font-bold text-base text-slate-900">{ord.order_number}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(ord.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-slate-900 tabular-nums">
                        {formatCurrency(ord.grand_total)}
                      </span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        aria-label={`Order status for ${ord.order_number}`}
                        className="h-9 px-3 rounded-[12px] glass-input text-xs font-semibold text-slate-900"
                      >
                        {['Pending Confirmation', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(
                          (st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">Customer Details</p>
                      <p>Name: {ord.customer_name}</p>
                      <p>Phone: {ord.customer_phone}</p>
                      <p>
                        Location: {ord.city}, {ord.country}
                      </p>
                      <p>Address: {ord.address}</p>
                      {ord.instructions && <p>Notes: {ord.instructions}</p>}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">Items Ordered</p>
                      {ord.items.map((item) => (
                        <p key={item.product_id} className="font-mono tabular-nums">
                          {item.quantity}x {item.title} ({formatCurrency(item.line_total)})
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CATEGORIES & BRANDS */}
          {activeTab === 'taxonomy' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Categories */}
              <div className="rounded-[28px] glass-panel p-6 space-y-5">
                <h2 className="font-display font-bold text-lg text-slate-900">Manage Categories</h2>
                <form onSubmit={handleAddCategory} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New Category Name"
                    className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
                  />
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short Description"
                    className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
                  />
                  <GlassButton type="submit" variant="obsidian" size="sm">
                    Add Category
                  </GlassButton>
                </form>
                <div className="divide-y divide-white/60 max-h-80 overflow-y-auto">
                  {categories.map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-600 tabular-nums">{c.product_count ?? 0} products</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id)}
                        className="cursor-pointer text-rose-600"
                      >
                        <SquircleIcon icon={Trash2} size="xs" variant="subtle" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div className="rounded-[28px] glass-panel p-6 space-y-5">
                <h2 className="font-display font-bold text-lg text-slate-900">Manage Brands</h2>
                <form onSubmit={handleAddBrand} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Brand Name"
                      className="h-10 px-3 rounded-[12px] glass-input text-sm"
                    />
                    <input
                      type="text"
                      value={newBrandCountry}
                      onChange={(e) => setNewBrandCountry(e.target.value)}
                      placeholder="Origin Country"
                      className="h-10 px-3 rounded-[12px] glass-input text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    value={newBrandTagline}
                    onChange={(e) => setNewBrandTagline(e.target.value)}
                    placeholder="Brand Tagline"
                    className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
                  />
                  <GlassButton type="submit" variant="obsidian" size="sm">
                    Add Brand
                  </GlassButton>
                </form>
                <div className="divide-y divide-white/60 max-h-80 overflow-y-auto">
                  {brands.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{b.name}</p>
                        <p className="text-xs text-slate-600">{b.country}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBrand(b.id)}
                        className="cursor-pointer text-rose-600"
                      >
                        <SquircleIcon icon={Trash2} size="xs" variant="subtle" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BANNERS */}
          {activeTab === 'banners' && dashboard && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <GlassButton
                  type="button"
                  variant="obsidian"
                  size="sm"
                  onClick={() => {
                    setEditingBanner({
                      title: 'New Campaign',
                      subtitle: 'Featured Release',
                      headline: '',
                      description: '',
                      cta_text: 'SHOP NOW',
                      cta_target: 'shop',
                      image: '/src/assets/images/hero_flagship_tech_1795408033150.jpg',
                      placement: 'hero',
                      active: true,
                    });
                    setIsBannerModalOpen(true);
                  }}
                >
                  <SquircleIcon icon={Plus} size="xxs" variant="cobalt" />
                  <span>New Banner</span>
                </GlassButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard.banners.map((bn) => (
                  <div key={bn.id} className="rounded-[28px] glass-panel p-5 space-y-3">
                    <div className="aspect-[16/9] rounded-2xl overflow-hidden glass-surface-subtle">
                      <SmartImage src={bn.image} alt={bn.headline} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-700">
                          {bn.placement.toUpperCase()} · {bn.active ? 'Active' : 'Hidden'}
                        </p>
                        <h3 className="font-display font-bold text-lg text-slate-900">{bn.headline}</h3>
                        <p className="text-xs text-slate-600 mt-1">{bn.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBanner({...bn});
                            setIsBannerModalOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <SquircleIcon icon={Edit3} size="xs" variant="glass" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(bn.id)}
                          className="cursor-pointer text-rose-600"
                        >
                          <SquircleIcon icon={Trash2} size="xs" variant="subtle" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === 'messages' && dashboard && (
            <div className="space-y-4">
              {dashboard.messages.length === 0 ? (
                <div className="rounded-[28px] glass-panel p-10 text-center text-sm text-slate-600">
                  No customer inquiries received yet.
                </div>
              ) : (
                dashboard.messages.map((m) => (
                  <div key={m.id} className="rounded-[28px] glass-panel p-6 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{m.subject}</p>
                        <p className="text-xs text-slate-600">
                          {m.name} · {m.email} {m.phone ? `· ${m.phone}` : ''}
                        </p>
                      </div>
                      <GlassButton
                        type="button"
                        variant="glass"
                        size="sm"
                        onClick={async () => {
                          await fetch(`/api/admin/messages/${m.id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${adminToken}`,
                            },
                            body: JSON.stringify({status: m.status === 'new' ? 'reviewed' : 'new'}),
                          });
                          loadDashboard();
                        }}
                      >
                        <SquircleIcon icon={CheckCircle2} size="xxs" variant={m.status === 'new' ? 'cobalt' : 'emerald'} />
                        <span>{m.status === 'new' ? 'Mark Reviewed' : 'Reviewed'}</span>
                      </GlassButton>
                    </div>
                    <p className="text-sm text-slate-700 pt-1">{m.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-2xl rounded-[30px] glass-panel-elevated p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-slate-900">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="cursor-pointer"
              >
                <SquircleIcon icon={X} size="sm" variant="subtle" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.title || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">SKU</label>
                <input
                  type="text"
                  value={editingProduct.sku || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, sku: e.target.value})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category *</label>
                <select
                  value={editingProduct.category_id || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Brand *</label>
                <select
                  value={editingProduct.brand_id || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, brand_id: e.target.value})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Original Price (PKR)</label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  required
                  value={editingProduct.original_price ?? 0}
                  onChange={(e) => setEditingProduct({...editingProduct, original_price: Number(e.target.value)})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Discount Price (PKR)</label>
                <input
                  type="number"
                  min={0}
                  step="1"
                  required
                  value={editingProduct.discount_price ?? 0}
                  onChange={(e) => setEditingProduct({...editingProduct, discount_price: Number(e.target.value)})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input font-mono text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Stock</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editingProduct.stock ?? 0}
                  onChange={(e) => setEditingProduct({...editingProduct, stock: Number(e.target.value)})}
                  className="w-full h-10 px-3 rounded-[12px] glass-input font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Short Summary</label>
              <input
                type="text"
                value={editingProduct.short_description || ''}
                onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})}
                className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Description</label>
              <textarea
                rows={3}
                value={editingProduct.description || ''}
                onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                className="w-full p-3 rounded-[12px] glass-input text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Warranty Terms</label>
              <input
                type="text"
                value={editingProduct.warranty || ''}
                onChange={(e) => setEditingProduct({...editingProduct, warranty: e.target.value})}
                className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
              />
            </div>

            {/* Product Images Upload & URLs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Product Images</label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 cursor-pointer">
                  <SquircleIcon icon={Upload} size="xxs" variant="cobalt" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {(editingProduct.images || []).map((img, i) => (
                  <div key={`${img}-${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden glass-surface-subtle">
                    <SmartImage src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct({
                          ...editingProduct,
                          images: (editingProduct.images || []).filter((_, idx) => idx !== i),
                        })
                      }
                      aria-label="Remove image"
                      className="absolute top-0.5 right-0.5 cursor-pointer"
                    >
                      <SquircleIcon icon={X} size="xxs" variant="dark" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specs Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Specifications</label>
                <GlassButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() =>
                    setEditingProduct({
                      ...editingProduct,
                      specifications: [...(editingProduct.specifications || []), {label: '', value: ''}],
                    })
                  }
                >
                  <SquircleIcon icon={Plus} size="xxs" variant="cobalt" />
                  <span>Add Spec Row</span>
                </GlassButton>
              </div>
              {(editingProduct.specifications || []).map((spec: ProductSpec, idx: number) => (
                <div key={idx} className="grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={spec.label}
                    placeholder="Label"
                    onChange={(e) => {
                      const next = [...(editingProduct.specifications || [])];
                      next[idx] = {...next[idx], label: e.target.value};
                      setEditingProduct({...editingProduct, specifications: next});
                    }}
                    className="col-span-2 h-9 px-2.5 rounded-[10px] glass-input text-xs"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    placeholder="Value"
                    onChange={(e) => {
                      const next = [...(editingProduct.specifications || [])];
                      next[idx] = {...next[idx], value: e.target.value};
                      setEditingProduct({...editingProduct, specifications: next});
                    }}
                    className="col-span-2 h-9 px-2.5 rounded-[10px] glass-input text-xs"
                  />
                  <GlassButton
                    type="button"
                    variant="glass"
                    size="sm"
                    onClick={() =>
                      setEditingProduct({
                        ...editingProduct,
                        specifications: (editingProduct.specifications || []).filter((_, i) => i !== idx),
                      })
                    }
                    className="text-rose-600"
                  >
                    Remove
                  </GlassButton>
                </div>
              ))}
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
              {(
                [
                  {key: 'is_trending', label: 'Trending'},
                  {key: 'is_bestseller', label: 'Best Seller'},
                  {key: 'is_new_arrival', label: 'New Arrival'},
                  {key: 'is_featured_deal', label: 'Featured Deal'},
                ] as const
              ).map((flag) => (
                <label key={flag.key} className="flex items-center gap-2 p-2.5 rounded-xl glass-surface-subtle cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct[flag.key])}
                    onChange={(e) => setEditingProduct({...editingProduct, [flag.key]: e.target.checked})}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-slate-800">{flag.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/60">
              <GlassButton
                type="button"
                variant="glass"
                size="md"
                onClick={() => setIsProductModalOpen(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                variant="cobalt"
                size="md"
                disabled={savingProduct}
              >
                {savingProduct ? 'Saving...' : 'Save Product'}
              </GlassButton>
            </div>
          </form>
        </div>
      )}

      {/* BANNER MODAL */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBanner}
            className="w-full max-w-lg rounded-[30px] glass-panel-elevated p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-slate-900">
                {editingBanner.id ? 'Edit Banner' : 'Create Banner'}
              </h2>
              <button type="button" onClick={() => setIsBannerModalOpen(false)} className="cursor-pointer">
                <SquircleIcon icon={X} size="xs" variant="subtle" />
              </button>
            </div>

            <input
              type="text"
              required
              value={editingBanner.headline || ''}
              onChange={(e) => setEditingBanner({...editingBanner, headline: e.target.value})}
              placeholder="Headline"
              className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
            />
            <input
              type="text"
              value={editingBanner.subtitle || ''}
              onChange={(e) => setEditingBanner({...editingBanner, subtitle: e.target.value})}
              placeholder="Subtitle / Kicker"
              className="w-full h-10 px-3 rounded-[12px] glass-input text-sm"
            />
            <textarea
              rows={3}
              value={editingBanner.description || ''}
              onChange={(e) => setEditingBanner({...editingBanner, description: e.target.value})}
              placeholder="Banner Description"
              className="w-full p-3 rounded-[12px] glass-input text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={editingBanner.placement || 'hero'}
                onChange={(e) =>
                  setEditingBanner({...editingBanner, placement: e.target.value as 'hero' | 'promo'})
                }
                className="h-10 px-3 rounded-[12px] glass-input text-sm"
              >
                <option value="hero">Hero Placement</option>
                <option value="promo">Deals Promo Placement</option>
              </select>
              <label className="flex items-center gap-2 px-3 rounded-[12px] glass-surface-subtle text-sm">
                <input
                  type="checkbox"
                  checked={editingBanner.active !== false}
                  onChange={(e) => setEditingBanner({...editingBanner, active: e.target.checked})}
                  className="accent-blue-600"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton
                type="button"
                variant="glass"
                size="sm"
                onClick={() => setIsBannerModalOpen(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                variant="obsidian"
                size="sm"
              >
                Save Banner
              </GlassButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
