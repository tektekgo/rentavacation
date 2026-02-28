/**
 * Google Analytics 4 integration.
 *
 * - Loads gtag.js dynamically (only when analytics cookie consent is granted)
 * - Tracks SPA route changes as page_view events
 * - Provides typed helpers for key business events
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const GA_MEASUREMENT_ID = "G-G2YCVHNS25";

let initialized = false;

/**
 * Dynamically load Google Analytics and initialize gtag.
 * Call this only AFTER the user has granted analytics cookie consent.
 */
export function initGA4() {
  if (initialized || typeof window === "undefined") return;

  // Inject the gtag.js script
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false, // We fire page_view manually on SPA route changes
  });

  initialized = true;
}

/** Track a SPA page view (called on every route change). */
export function trackGA4PageView(path: string) {
  if (!initialized) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/** Track a custom business event. */
export function trackGA4Event(
  name: string,
  params?: Record<string, unknown>,
) {
  if (!initialized) return;
  window.gtag("event", name, params);
}

// ── Typed business event helpers ──────────────────────────────

export function trackListingView(listingId: string, resortName: string) {
  trackGA4Event("view_item", {
    items: [{ item_id: listingId, item_name: resortName }],
  });
}

export function trackCheckoutStart(
  listingId: string,
  resortName: string,
  amount: number,
) {
  trackGA4Event("begin_checkout", {
    currency: "USD",
    value: amount,
    items: [{ item_id: listingId, item_name: resortName }],
  });
}

export function trackPurchase(
  bookingId: string,
  amount: number,
  listingId: string,
) {
  trackGA4Event("purchase", {
    transaction_id: bookingId,
    currency: "USD",
    value: amount,
    items: [{ item_id: listingId }],
  });
}

export function trackSignUp(method: string) {
  trackGA4Event("sign_up", { method });
}

export function trackLogin(method: string) {
  trackGA4Event("login", { method });
}

export function trackSearch(searchTerm: string) {
  trackGA4Event("search", { search_term: searchTerm });
}

export function trackBidPlaced(listingId: string, amount: number) {
  trackGA4Event("bid_placed", {
    listing_id: listingId,
    value: amount,
    currency: "USD",
  });
}

export function isGA4Initialized() {
  return initialized;
}
