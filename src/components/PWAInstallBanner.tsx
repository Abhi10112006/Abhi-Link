import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { hapticMedium, hapticSuccess } from '../utils/haptics';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Delay in ms before the install banner slides in after the UI has settled */
const BANNER_DELAY_MS = 1500;

/**
 * PWAInstallBanner
 *
 * Shows a premium, non-generic install-to-home-screen prompt once the browser
 * fires `beforeinstallprompt`.  It is NOT shown if:
 *   - The app is already running in standalone / fullscreen mode (already installed).
 *   - The user has dismissed it in the same session.
 *   - The browser does not support PWA install (iOS Safari, for instance, will never
 *     fire `beforeinstallprompt`; on those devices the banner stays hidden).
 */
export const PWAInstallBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // If already running as a standalone / installed PWA, never show.
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      // Small delay so the rest of the UI settles first
      setTimeout(() => setShow(true), BANNER_DELAY_MS);
    };

    const onAppInstalled = () => {
      setInstalled(true);
      setShow(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    hapticMedium();
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === 'accepted') {
      hapticSuccess();
      setInstalled(true);
    }
    setShow(false);
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    hapticMedium();
    setShow(false);
  };

  // Nothing to render if already installed
  if (installed) return null;

  return (
    <>
      {/*
       * Backdrop blur — rendered immediately at its final viewport position when
       * `show` becomes true (initial opacity:1, no entry animation).  Because this
       * element is NOT inside the sliding motion.div it is already in the viewport
       * from frame 1, so the browser creates the compositing layer for
       * backdrop-filter right away.  This eliminates the 1-2 frame lag where text
       * below the banner was visible through the semi-transparent surface during
       * the slide-in transition.
       */}
      <AnimatePresence>
        {show && (
          <motion.div
            key="pwa-backdrop"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[199] w-[calc(100%-2rem)] max-w-sm h-[72px] pointer-events-none"
          >
            <div
              className="absolute inset-0 rounded-3xl backdrop-blur-xl"
              style={{ willChange: 'backdrop-filter' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner slides in over the already-active backdrop above */}
      <AnimatePresence>
        {show && (
          <motion.div
            key="pwa-banner"
            initial={{ y: -120, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -120, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm"
            style={{ willChange: 'transform' }}
          >

          {/* Content — solid white background so the banner is always legible.
               The backdrop sibling provides bonus blur on supported browsers, but
               the banner must look correct even when backdrop-filter is absent. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-3xl px-5 py-4 bg-white border border-[#d9d3ce] shadow-[0_20px_60px_rgba(0,0,0,0.18),0_4px_8px_rgba(0,0,0,0.06)]"
          >
            {/* Shimmer stripe */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent" />
              <motion.div
                className="absolute top-0 -left-full h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                animate={{ left: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
              />
            </div>

            <div className="relative z-10 flex items-center gap-4">
              {/* App Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2d2d2b] to-[#4a3018] flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="20" fill="#2d2d2b" />
                  <text x="50" y="50" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="60" fill="#e6e1dc" textAnchor="middle" dominantBaseline="central">A</text>
                </svg>
              </div>

              {/* Copy */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-[#2d2d2b] uppercase tracking-wide leading-tight">
                  Add to Home Screen
                </p>
                <p className="text-[11px] text-[#2d2d2b]/60 font-medium mt-0.5 leading-tight">
                  Instant access · Works offline · No app store needed
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  onClick={handleDismiss}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-full text-[#2d2d2b]/40 hover:text-[#2d2d2b] hover:bg-[#f5f5f0] transition-colors focus:outline-none"
                  aria-label="Dismiss"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>

                <motion.button
                  onClick={handleInstall}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  className="px-4 py-2 rounded-full bg-[#2d2d2b] text-white text-[12px] font-black uppercase tracking-widest shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2d2d2b]/40 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <span className="relative z-10">Install</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
