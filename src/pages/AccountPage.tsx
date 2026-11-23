import React, {useEffect, useState} from 'react';
import {LogOut, Package, Save, User} from 'lucide-react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import type {Order} from '../types.ts';
import {formatCurrency} from '../utils/whatsapp.ts';

export function AccountPage() {
  const {user, userToken, setUserSession, navigate, showToast} = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profCountry, setProfCountry] = useState('');
  const [profCity, setProfCity] = useState('');
  const [profAddress, setProfAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!userToken) return;
    fetch('/api/auth/me', {
      headers: {Authorization: `Bearer ${userToken}`},
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Unauthorized'))))
      .then((data) => {
        setOrders(data.orders || []);
        if (data.user) {
          setProfName(data.user.name || '');
          setProfPhone(data.user.phone || '');
          setProfCountry(data.user.country || '');
          setProfCity(data.user.city || '');
          setProfAddress(data.user.address || '');
        }
      })
      .catch(() => undefined);
  }, [userToken]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? {email, password} : {name, email, phone, password};
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Authentication failed.');
      } else {
        setUserSession(data.token, data.user);
        showToast(mode === 'login' ? `Welcome back, ${data.user.name}` : 'Account created successfully.');
      }
    } catch {
      showToast('Network error during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToken) return;
    setSavingProfile(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          name: profName,
          phone: profPhone,
          country: profCountry,
          city: profCity,
          address: profAddress,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUserSession(userToken, data.user);
        showToast('Delivery profile updated.');
      }
    } catch {
      showToast('Could not save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user || !userToken) {
    return (
      <div className="max-w-md mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="rounded-[28px] glass-panel-elevated p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3.5">
            <SquircleIcon icon={User} size="lg" variant="dark" />
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900">
                {mode === 'login' ? 'Member Sign In' : 'Create Member Account'}
              </h1>
              <p className="text-xs text-slate-600">Save delivery addresses and track your orders</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-[15px] glass-surface-subtle">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 rounded-[11px] text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white/90 text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2 rounded-[11px] text-xs font-semibold transition-all cursor-pointer ${
                mode === 'register' ? 'bg-white/90 text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="WhatsApp Phone (Optional)"
                  className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
                />
              </>
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full h-11 px-3.5 rounded-[13px] glass-input text-sm"
            />
            <GlassButton type="submit" size="lg" variant="obsidian" disabled={submitting} className="w-full">
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </GlassButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <SquircleIcon icon={User} size="lg" variant="cobalt" />
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900">{user.name}</h1>
            <p className="text-xs text-slate-600">{user.email}</p>
          </div>
        </div>
        <GlassButton
          type="button"
          size="sm"
          variant="glass"
          onClick={() => {
            setUserSession(null, null);
            showToast('Signed out.');
          }}
        >
          <SquircleIcon icon={LogOut} size="xxs" variant="subtle" />
          <span>Sign Out</span>
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-5 rounded-[26px] glass-panel p-6 space-y-4 h-fit"
        >
          <h2 className="font-display font-semibold text-lg text-slate-900">Saved Delivery Details</h2>
          <input
            type="text"
            value={profName}
            onChange={(e) => setProfName(e.target.value)}
            placeholder="Full Name"
            className="w-full h-10 px-3.5 rounded-[12px] glass-input text-sm"
          />
          <input
            type="tel"
            value={profPhone}
            onChange={(e) => setProfPhone(e.target.value)}
            placeholder="WhatsApp Phone"
            className="w-full h-10 px-3.5 rounded-[12px] glass-input text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={profCountry}
              onChange={(e) => setProfCountry(e.target.value)}
              placeholder="Country"
              className="h-10 px-3.5 rounded-[12px] glass-input text-sm"
            />
            <input
              type="text"
              value={profCity}
              onChange={(e) => setProfCity(e.target.value)}
              placeholder="City"
              className="h-10 px-3.5 rounded-[12px] glass-input text-sm"
            />
          </div>
          <textarea
            rows={3}
            value={profAddress}
            onChange={(e) => setProfAddress(e.target.value)}
            placeholder="Complete Delivery Address"
            className="w-full p-3.5 rounded-[12px] glass-input text-sm"
          />
          <GlassButton type="submit" variant="obsidian" disabled={savingProfile} className="w-full">
            <SquircleIcon icon={Save} size="xs" variant="glass" />
            <span>{savingProfile ? 'Saving...' : 'Save Delivery Profile'}</span>
          </GlassButton>
        </form>

        <div className="lg:col-span-7 rounded-[26px] glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <SquircleIcon icon={Package} size="sm" variant="glass" />
            <h2 className="font-display font-semibold text-lg text-slate-900">Your Orders</h2>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600 py-8 text-center">
              No orders linked to your account yet. Orders placed while signed in appear here automatically.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-[20px] glass-surface-subtle flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-mono font-bold text-sm text-slate-900">{ord.order_number}</p>
                    <p className="text-xs text-slate-600">
                      {ord.status} · {ord.items.length} item(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {formatCurrency(ord.grand_total)}
                    </span>
                    <GlassButton
                      type="button"
                      size="sm"
                      variant="glass"
                      onClick={() => navigate('track-order', ord.order_number)}
                    >
                      Track
                    </GlassButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
