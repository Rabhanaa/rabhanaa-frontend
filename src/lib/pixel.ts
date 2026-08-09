// Facebook Pixel. The ID is baked in at build time by Vite, so when
// VITE_FB_PIXEL_ID is unset the pixel simply stays off — no script is loaded,
// no request reaches connect.facebook.net, and every track call is a no-op.
// Mirrors the conditional-init pattern used for Firebase in lib/firebase.ts.
const PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID as string | undefined;

export const pixelConfigured = Boolean(PIXEL_ID);

interface Fbq {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded?: boolean;
  version?: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let initialised = false;

export function initPixel(): void {
  if (!pixelConfigured || initialised || typeof window === 'undefined') return;
  initialised = true;

  if (!window.fbq) {
    // Standard Meta bootstrap: queue calls until fbevents.js replaces
    // callMethod, so events fired before the script lands aren't lost.
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    window._fbq = window._fbq ?? fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq?.('init', PIXEL_ID);
}

// PageView is fired per route change rather than at init: this is an SPA, so
// navigations never reload the document and would otherwise go uncounted.
export function trackPixel(event: string, params?: Record<string, unknown>): void {
  if (!pixelConfigured) return;
  window.fbq?.('track', event, params);
}
