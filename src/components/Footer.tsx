import React from 'react';
import {
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {motion} from 'motion/react';
import {useStore} from '../context/StoreContext.tsx';
import type {PageRoute} from '../types.ts';
import {buildWhatsAppSupportUrl} from '../utils/whatsapp.ts';
import {SquircleIcon} from './SquircleIcon.tsx';

export function Footer() {
  const {navigate, soundEnabled, toggleSound} = useStore();

  const linkButton = (label: string, page: PageRoute) => (
    <button
      key={page}
      type="button"
      onClick={() => navigate(page)}
      className="text-sm text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
    >
      {label}
    </button>
  );

  return (
    <footer className="px-2.5 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto rounded-[28px] sm:rounded-[32px] glass-surface-dark text-slate-300 p-7 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[12px] bg-white/90 text-slate-900 flex items-center justify-center shadow-[0_6px_18px_rgba(255,255,255,0.18)]">
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
                  <rect x="4" y="5" width="3.5" height="14" rx="1.2" />
                  <rect x="10.25" y="5" width="3.5" height="14" rx="1.2" opacity="0.85" />
                  <rect x="16.5" y="5" width="3.5" height="14" rx="1.2" opacity="0.65" />
                </svg>
              </span>
              <span className="font-display font-bold text-white tracking-tight text-lg">THREE BROTHERS</span>
            </div>
            <p className="text-sm text-slate-300/90 leading-relaxed max-w-xs">
              Curated flagship smartphones, studio workstations, spatial audio, and precision electronics backed by verified international warranties.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <motion.a
                whileTap={{scale: 0.92}}
                href={buildWhatsAppSupportUrl('Hello THREE BROTHERS Concierge, I have a question.')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Concierge"
                className="group"
              >
                <SquircleIcon icon={MessageCircle} size="sm" variant="emerald" />
              </motion.a>
              <motion.button
                whileTap={{scale: 0.92}}
                type="button"
                onClick={() => navigate('track-order')}
                aria-label="Track Order"
                className="cursor-pointer group"
              >
                <SquircleIcon icon={PackageSearch} size="sm" variant="dark" />
              </motion.button>
              <motion.button
                whileTap={{scale: 0.92}}
                type="button"
                onClick={() => navigate('contact')}
                aria-label="Contact Us"
                className="cursor-pointer group"
              >
                <SquircleIcon icon={Mail} size="sm" variant="dark" />
              </motion.button>
              <motion.button
                whileTap={{scale: 0.92}}
                type="button"
                onClick={toggleSound}
                aria-label={soundEnabled ? 'Mute UI sounds' : 'Enable UI sounds'}
                title={soundEnabled ? 'UI Sound On' : 'UI Sound Muted'}
                className="cursor-pointer group"
              >
                <SquircleIcon icon={soundEnabled ? Volume2 : VolumeX} size="sm" variant="dark" />
              </motion.button>
            </div>
          </div>

          {/* Storefront */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-white text-sm">Storefront</h4>
            <div className="flex flex-col gap-2.5">
              {linkButton('Home', 'home')}
              {linkButton('Shop Catalog', 'shop')}
              {linkButton('All Products', 'products')}
              {linkButton('Categories', 'categories')}
              {linkButton('Brands', 'brands')}
              {linkButton('Deals & Offers', 'deals')}
            </div>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-display font-semibold text-white text-sm">Customer Care</h4>
            <div className="flex flex-col gap-2.5">
              {linkButton('Track Order', 'track-order')}
              {linkButton('Wishlist', 'wishlist')}
              {linkButton('Shopping Bag', 'cart')}
              {linkButton('About Us', 'about')}
              {linkButton('Contact Us', 'contact')}
              {linkButton('FAQ', 'faq')}
            </div>
          </div>

          {/* Concierge & Operations */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-white text-sm">Direct Concierge</h4>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <SquircleIcon icon={MessageCircle} size="xs" variant="emerald" />
                <div>
                  <p className="text-white font-medium">WhatsApp Ordering</p>
                  <p className="font-mono text-xs tabular-nums">+93703842099</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <SquircleIcon icon={MapPin} size="xs" variant="dark" />
                <div>
                  <p className="text-white font-medium">Flagship Dispatch</p>
                  <p className="text-xs text-slate-400">International & Regional Insured Courier</p>
                </div>
              </div>
              <div className="pt-2 flex flex-wrap gap-4 text-xs">
                {linkButton('Privacy Policy', 'privacy-policy')}
                {linkButton('Terms & Conditions', 'terms-and-conditions')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} THREE BROTHERS Electronics. All rights reserved.</p>
          <p>Authentic Technology · Instant WhatsApp Checkout · Insured Global Delivery</p>
        </div>
      </div>
    </footer>
  );
}
