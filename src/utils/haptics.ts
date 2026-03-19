/**
 * Haptic feedback utility using the Web Vibration API.
 * Gracefully degrades on unsupported devices/browsers.
 */

const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

/** Very light tick — for list item selection, autocomplete, toggles */
export const hapticLight = (): void => vibrate(10);

/** Standard button press — for most button clicks */
export const hapticMedium = (): void => vibrate(20);

/** Emphasis — for modal open/close, primary CTA presses, confirmations */
export const hapticHeavy = (): void => vibrate([30, 10, 20]);

/** Success / completion — for receipt generated, payment done, QR downloaded */
export const hapticSuccess = (): void => vibrate([15, 10, 15, 10, 30]);

/** Warning / destructive action — for delete, error states */
export const hapticWarning = (): void => vibrate([50, 30, 50]);

/** Scroll tick — very subtle, call throttled on scroll events */
export const hapticScroll = (): void => vibrate(5);

/**
 * Silent Unlock — fires a 1 ms imperceptible vibration on the very first
 * touchstart so the browser's vibration gate is opened before the user
 * starts scrolling.  The listener removes itself immediately after.
 */
export const initHapticUnlock = (): void => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const unlock = (): void => {
    navigator.vibrate(1);
    document.removeEventListener('touchstart', unlock);
  };
  document.addEventListener('touchstart', unlock, { passive: true });
};
