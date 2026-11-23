import React, {useEffect, useState} from 'react';
import {CheckCircle2} from 'lucide-react';
import {AnimatePresence, MotionConfig, motion} from 'motion/react';
import {AmbientBackdrop} from './components/AmbientBackdrop.tsx';
import {CartDrawer} from './components/CartDrawer.tsx';
import {Footer} from './components/Footer.tsx';
import {Header} from './components/Header.tsx';
import {MobileNav} from './components/MobileNav.tsx';
import {SquircleIcon} from './components/SquircleIcon.tsx';
import {StoreProvider, useStore} from './context/StoreContext.tsx';
import {AccountPage} from './pages/AccountPage.tsx';
import {AdminDashboardPage} from './pages/AdminDashboardPage.tsx';
import {CartPage, CheckoutPage, WishlistPage} from './pages/CartAndCheckoutPages.tsx';
import {HomePage} from './pages/HomePage.tsx';
import {
  AboutPage,
  ContactPage,
  FaqPage,
  PrivacyPolicyPage,
  TermsPage,
  TrackOrderPage,
} from './pages/InfoPages.tsx';
import {ProductDetailPage} from './pages/ProductDetailPage.tsx';
import {BrandsPage, CategoriesPage, ShopPage} from './pages/ShopPages.tsx';

function StoreShell() {
  const {route, routeParam, toastMessage} = useStore();
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
      return !sessionStorage.getItem('tb_intro_seen');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => {
      setShowIntro(false);
      try {
        sessionStorage.setItem('tb_intro_seen', '1');
      } catch {
        // Ignore storage restrictions
      }
    }, 950);
    return () => clearTimeout(t);
  }, [showIntro]);

  const renderPage = () => {
    switch (route) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage mode="shop" />;
      case 'products':
        return <ShopPage mode="products" />;
      case 'deals':
        return <ShopPage mode="deals" />;
      case 'product':
        return <ProductDetailPage slug={routeParam} />;
      case 'categories':
        return <CategoriesPage />;
      case 'brands':
        return <BrandsPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      case 'faq':
        return <FaqPage />;
      case 'track-order':
        return <TrackOrderPage initialOrderNumber={routeParam} />;
      case 'privacy-policy':
        return <PrivacyPolicyPage />;
      case 'terms-and-conditions':
        return <TermsPage />;
      case 'account':
        return <AccountPage />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-900 relative overflow-x-clip">
      <AmbientBackdrop />

      {/* Cinematic Glass Welcome Reveal */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
            onClick={() => setShowIntro(false)}
            className="fixed inset-0 z-[100] bg-[#070B14]/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white cursor-pointer"
          >
            <div
              aria-hidden="true"
              className="absolute w-72 h-72 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
            />
            <motion.div
              initial={{scale: 0.9, opacity: 0}}
              animate={{scale: 1, opacity: 1}}
              transition={{duration: 0.45, ease: [0.16, 1, 0.3, 1]}}
              className="relative flex flex-col items-center gap-4 px-8 py-7 rounded-[28px] glass-surface-dark"
            >
              <div className="w-16 h-16 squircle bg-gradient-to-br from-white/95 to-white/75 text-slate-950 border border-white flex items-center justify-center shadow-[0_16px_40px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,1)]">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                  <rect x="4" y="5" width="3.5" height="14" rx="1.2" />
                  <rect x="10.25" y="5" width="3.5" height="14" rx="1.2" opacity="0.85" />
                  <rect x="16.5" y="5" width="3.5" height="14" rx="1.2" opacity="0.65" />
                </svg>
              </div>
              <p className="font-display font-bold tracking-[0.22em] text-lg sm:text-xl text-white">THREE BROTHERS</p>
              <p className="text-[11px] uppercase tracking-[0.24em] text-blue-300/90 font-semibold">
                Flagship Electronics
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header />

      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${route}-${routeParam}`}
            initial={{opacity: 0, y: 8}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0}}
            transition={{duration: 0.22, ease: [0.16, 1, 0.3, 1]}}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MobileNav />
      <CartDrawer />

      {/* Global Glass Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{opacity: 0, y: 20, scale: 0.96}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: 16, scale: 0.96}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
            className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm rounded-2xl glass-surface-dark text-white px-4 py-3 flex items-center gap-3"
          >
            <SquircleIcon icon={CheckCircle2} size="xs" variant="cobalt" />
            <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <StoreShell />
      </StoreProvider>
    </MotionConfig>
  );
}
