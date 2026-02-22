/**
 * Shared pricing utilities for Rent-A-Vacation.
 *
 * calculateNights — replaces the duplicated helper in Rentals, PropertyDetail,
 * Checkout, and FeaturedResorts.
 *
 * computeListingPricing — derives owner_price, rav_markup, and final_price
 * from a nightly rate and number of nights.
 */

const RAV_MARKUP_RATE = 0.15; // 15%

/**
 * Calculate the number of nights between check-in and check-out dates.
 * Returns at least 0.
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export interface ListingPricing {
  ownerPrice: number;
  ravMarkup: number;
  finalPrice: number;
}

/**
 * Compute the full pricing breakdown from a nightly rate and number of nights.
 *
 * ownerPrice  = nightlyRate * nights
 * ravMarkup   = round(ownerPrice * 0.15)
 * finalPrice  = ownerPrice + ravMarkup
 */
export function computeListingPricing(nightlyRate: number, nights: number): ListingPricing {
  const ownerPrice = Math.round(nightlyRate * nights);
  const ravMarkup = Math.round(ownerPrice * RAV_MARKUP_RATE);
  const finalPrice = ownerPrice + ravMarkup;
  return { ownerPrice, ravMarkup, finalPrice };
}
