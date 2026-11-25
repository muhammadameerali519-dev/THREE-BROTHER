import React, {useEffect, useState} from 'react';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  Globe2,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Send,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import {AnimatePresence, motion} from 'motion/react';
import {GlassButton} from '../components/GlassPrimitives.tsx';
import {SmartImage, SquircleIcon} from '../components/SquircleIcon.tsx';
import {useStore} from '../context/StoreContext.tsx';
import type {Order} from '../types.ts';
import {buildWhatsAppSupportUrl, formatCurrency} from '../utils/whatsapp.ts';

export function AboutPage() {
  const {navigate} = useStore();
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-10 sm:space-y-12">
      <div className="rounded-[28px] sm:rounded-[34px] glass-panel-elevated p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-semibold text-blue-700">Our Heritage & Philosophy</p>
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Curating Precision Technology Without Compromise.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Founded on the principle that luxury hardware deserves specialist guidance, THREE BROTHERS connects discerning buyers, creative studios, and professionals with factory-sealed smartphones, studio workstations, and reference acoustics.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <GlassButton type="button" variant="obsidian" onClick={() => navigate('shop')}>
              Explore Storefront
            </GlassButton>
            <GlassButton type="button" variant="glass" onClick={() => navigate('contact')}>
              Speak With Concierge
            </GlassButton>
          </div>
        </div>
        <div className="lg:col-span-6 rounded-[24px] overflow-hidden border border-white/80 shadow-xl aspect-[16/10]">
          <SmartImage
            src="/src/assets/images/hero_flagship_tech_1795408033150.jpg"
            alt="THREE BROTHERS Flagship Hardware"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
        {[
          {
            icon: ShieldCheck,
            title: '100% Verified Hardware',
            body: 'Zero refurbished swaps or grey-market repackaging. Every unit includes verifiable serial numbers and factory seals.',
          },
          {
            icon: Globe2,
            title: 'Regional & Global Fulfillment',
            body: 'Serving Kabul, Dubai, and international destinations with insured door-to-door courier logistics.',
          },
          {
            icon: Award,
            title: 'Human-First Concierge',
            body: 'From hardware specification comparisons to instant WhatsApp confirmation, real specialists oversee every order.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[26px] glass-panel p-6 sm:p-7 space-y-3 group">
            <SquircleIcon icon={item.icon} size="lg" variant="cobalt" />
            <h2 className="font-display font-bold text-lg text-slate-900">{item.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const {showToast} = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Product & Spec Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, phone, subject, message}),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not send message.');
      } else {
        showToast(data.message);
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      }
    } catch {
      showToast('Network error sending inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8 max-w-3xl">
        <p className="text-xs font-semibold text-blue-700 mb-1">24/7 Hardware Concierge</p>
        <h1 className="font-display font-bold text-2xl sm:text-4xl text-slate-900">Contact THREE BROTHERS</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Need specification guidance, corporate bulk quotes, or order assistance? Reach us directly on WhatsApp or send an inquiry below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-[26px] glass-surface-dark text-white p-6 sm:p-7 space-y-4">
            <SquircleIcon icon={MessageCircle} size="lg" variant="emerald" />
            <h2 className="font-display font-bold text-xl">Instant WhatsApp Desk</h2>
            <p className="text-sm text-slate-300">
              Speak directly with our product specialists for immediate stock confirmation and courier scheduling.
            </p>
            <p className="font-mono text-lg font-bold tabular-nums">+923328189905</p>
            <motion.a
              whileHover={{y: -1}}
              whileTap={{scale: 0.98}}
              href={buildWhatsAppSupportUrl('Hello THREE BROTHERS team, I would like assistance with an inquiry.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 px-5 rounded-[14px] glass-btn-emerald text-white text-sm font-semibold items-center gap-2"
            >
              <SquircleIcon icon={MessageCircle} size="xs" variant="glass" />
              <span>Chat on WhatsApp</span>
            </motion.a>
          </div>

          <div className="rounded-[26px] glass-panel p-6 space-y-4">
            <div className="flex items-start gap-3">
              <SquircleIcon icon={MapPin} size="sm" variant="glass" />
              <div>
                <p className="font-semibold text-sm text-slate-900">Dispatch & Operations</p>
                <p className="text-xs text-slate-600 mt-0.5">Kabul Flagship Hub · International Insured Courier</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <SquircleIcon icon={Mail} size="sm" variant="glass" />
              <div>
                <p className="font-semibold text-sm text-slate-900">Concierge Hours</p>
                <p className="text-xs text-slate-600 mt-0.5">Saturday – Thursday, 09:00 – 21:00 (WhatsApp 24/7)</p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-[26px] glass-panel-elevated p-5 sm:p-8 space-y-4"
        >
          <h2 className="font-display font-semibold text-lg text-slate-900">Send a Direct Inquiry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name *"
              className="h-11 px-3.5 rounded-[13px] glass-input text-sm"
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address *"
              className="h-11 px-3.5 rounded-[13px] glass-input text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone / WhatsApp (Optional)"
              className="h-11 px-3.5 rounded-[13px] glass-input text-sm"
            />
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 px-3.5 rounded-[13px] glass-input text-sm"
            >
              <option>Product & Spec Inquiry</option>
              <option>Corporate / Studio Bulk Order</option>
              <option>Warranty & Service Claim</option>
              <option>Delivery & Order Tracking</option>
            </select>
          </div>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how our hardware specialists can assist you..."
            className="w-full p-3.5 rounded-[13px] glass-input text-sm"
          />
          <GlassButton type="submit" size="lg" variant="obsidian" disabled={submitting}>
            <SquircleIcon icon={Send} size="xs" variant="glass" />
            <span>{submitting ? 'Sending...' : 'Send Message'}</span>
          </GlassButton>
        </form>
      </div>
    </div>
  );
}

export function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does WhatsApp order confirmation work?',
      a: 'After completing the checkout form, your order is securely logged with a unique reference number (e.g., TB-2026-1001). Tapping "CONFIRM ORDER VIA WHATSAPP" opens WhatsApp pre-filled with your exact items, totals, and delivery details to +923328189905 so our team can confirm dispatch immediately.',
    },
    {
      q: 'Are all products factory sealed and authentic?',
      a: 'Yes. Every smartphone, laptop, audio unit, and camera sold by THREE BROTHERS is brand new, factory sealed, and carries verifiable manufacturer serial numbers.',
    },
    {
      q: 'What warranty coverage is included?',
      a: 'Each device includes its official 1-to-3 year international manufacturer warranty along with THREE BROTHERS priority concierge support for streamlined claims.',
    },
    {
      q: 'How much are delivery charges and how long does shipping take?',
      a: 'Orders of PKR 70,000 or more qualify for complimentary insured express delivery. Orders under PKR 70,000 carry a flat PKR 2,500 insured delivery fee. Same-day dispatch is available in major hubs.',
    },
    {
      q: 'How can I track my order status?',
      a: 'Visit the Track Order page and enter your order reference number (such as TB-2026-1001) to view real-time confirmation, processing, and courier milestones.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8 flex items-center gap-3.5">
        <SquircleIcon icon={HelpCircle} size="lg" variant="cobalt" />
        <div>
          <p className="text-xs font-semibold text-blue-700">Support Knowledge Base</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Frequently Asked Questions</h1>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.q} className="rounded-[22px] glass-panel overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
              >
                <span className="font-display font-semibold text-slate-900 text-sm sm:text-base">{item.q}</span>
                <SquircleIcon
                  icon={ChevronDown}
                  size="xs"
                  variant="glass"
                  iconClassName={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{height: 0, opacity: 0}}
                    animate={{height: 'auto', opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-slate-700 leading-relaxed border-t border-white/60 pt-3">
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrackOrderPage({initialOrderNumber = ''}: {initialOrderNumber?: string}) {
  const [query, setQuery] = useState(initialOrderNumber || 'TB-2026-1001');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  const lookup = async (ref: string) => {
    const clean = ref.trim().toUpperCase();
    if (!clean) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setOrder(null);
        setError(data.error || 'Order not found.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setError('Could not connect to tracking service.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setQuery(initialOrderNumber);
      lookup(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const steps = ['Pending Confirmation', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIdx = order ? Math.max(0, steps.indexOf(order.status)) : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8 flex items-center gap-3.5">
        <SquircleIcon icon={PackageSearch} size="lg" variant="dark" />
        <div>
          <p className="text-xs font-semibold text-blue-700">Live Fulfillment Lookup</p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Track Your Order</h1>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(query);
        }}
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-[24px] glass-panel"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter Order Reference (e.g. TB-2026-1001)"
          className="flex-1 h-12 px-4 rounded-[14px] glass-input font-mono text-sm"
        />
        <GlassButton type="submit" size="lg" variant="obsidian" disabled={searching}>
          {searching ? 'Checking...' : 'Track Order'}
        </GlassButton>
      </form>

      {error && (
        <div className="rounded-[20px] glass-panel border-rose-300/70 p-4 text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}

      {order && (
        <div className="rounded-[28px] glass-panel-elevated p-5 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/60">
            <div>
              <p className="font-mono text-xs text-slate-600">Order Reference</p>
              <h2 className="font-mono font-bold text-xl text-slate-900">{order.order_number}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600">Current Status</p>
              <p className="font-display font-bold text-base text-blue-700">{order.status}</p>
            </div>
          </div>

          {order.status !== 'Cancelled' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {steps.map((step, idx) => {
                const done = idx <= currentStepIdx;
                return (
                  <div
                    key={step}
                    className={`p-3 rounded-[18px] text-center space-y-1.5 ${
                      done ? 'glass-panel border-blue-300/80 text-blue-950' : 'glass-surface-subtle text-slate-500'
                    }`}
                  >
                    <div className="flex justify-center">
                      <SquircleIcon
                        icon={idx === 3 ? Truck : CheckCircle2}
                        size="xs"
                        variant={done ? 'cobalt' : 'subtle'}
                      />
                    </div>
                    <p className="text-[11px] font-semibold leading-tight">{step}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-display font-semibold text-sm text-slate-900">Items & Total</h3>
            <div className="divide-y divide-white/60 border border-white/75 rounded-[20px] overflow-hidden glass-surface-subtle">
              {order.items.map((item) => (
                <div key={item.product_id} className="p-3.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600">
                      {item.brand_name} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(item.line_total)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 text-base font-display font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums">{formatCurrency(order.grand_total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Privacy Policy</h1>
      </div>
      <div className="rounded-[28px] glass-panel p-6 sm:p-10 space-y-5 text-sm text-slate-700 leading-relaxed">
        <p>
          THREE BROTHERS respects your privacy and safeguards every piece of personal and delivery information entrusted to us during checkout, account registration, or customer support interactions.
        </p>
        <h2 className="font-display font-semibold text-lg text-slate-900">Information We Collect</h2>
        <p>
          When placing an order, we collect your full name, WhatsApp contact number, delivery country, city, street address, and optional delivery instructions solely to verify stock, schedule insured courier delivery, and provide warranty documentation.
        </p>
        <h2 className="font-display font-semibold text-lg text-slate-900">Security & Data Protection</h2>
        <p>
          Customer credentials are protected using salted cryptographic hashing. We never sell, rent, or trade customer contact lists to third-party advertisers.
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
      <div className="rounded-[26px] glass-panel p-6 sm:p-8">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900">Terms & Conditions</h1>
      </div>
      <div className="rounded-[28px] glass-panel p-6 sm:p-10 space-y-5 text-sm text-slate-700 leading-relaxed">
        <p>
          By placing an order through the THREE BROTHERS storefront or confirming via our official WhatsApp concierge (+923328189905), you agree to the following commercial terms.
        </p>
        <h2 className="font-display font-semibold text-lg text-slate-900">Order Confirmation & Pricing</h2>
        <p>
          All orders placed online are held with status "Pending Confirmation" until verified by our dispatch specialist via WhatsApp. All prices are listed in PKR and include promotional discounts displayed at checkout; orders over PKR 70,000 receive complimentary insured courier delivery.
        </p>
        <h2 className="font-display font-semibold text-lg text-slate-900">Warranty & Returns</h2>
        <p>
          Unopened factory-sealed electronics may be exchanged within 7 days of delivery. Hardware defects covered under official manufacturer warranty receive priority processing through THREE BROTHERS service desks.
        </p>
      </div>
    </div>
  );
}
