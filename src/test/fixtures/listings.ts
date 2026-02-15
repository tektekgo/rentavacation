import type { ActiveListing } from "@/hooks/useListings";

let counter = 0;

/**
 * Creates a mock listing with sensible defaults.
 * Override any field via the `overrides` parameter.
 */
export function mockListing(overrides: Partial<ActiveListing> = {}): ActiveListing {
  counter++;
  const id = overrides.id ?? `listing-${counter}`;
  const propertyId = overrides.property_id ?? `property-${counter}`;

  return {
    id,
    property_id: propertyId,
    owner_id: `owner-${counter}`,
    status: "active",
    check_in_date: "2026-03-15",
    check_out_date: "2026-03-22",
    final_price: 1200,
    owner_price: 1000,
    rav_markup: 200,
    notes: null,
    cancellation_policy: "moderate",
    open_for_bidding: false,
    bidding_ends_at: null,
    min_bid_amount: null,
    created_at: new Date().toISOString(),
    property: {
      id: propertyId,
      owner_id: `owner-${counter}`,
      brand: "Hilton Grand Vacations",
      resort_name: "Test Resort",
      location: "Orlando, FL",
      description: "A beautiful test resort property",
      bedrooms: 2,
      bathrooms: 2,
      sleeps: 6,
      amenities: ["pool", "wifi", "kitchen"],
      images: [],
      resort_id: null,
      unit_type_id: null,
      resort: null,
      unit_type: null,
    },
    ...overrides,
  };
}

/**
 * Creates an array of mock listings.
 */
export function mockListings(count: number, overrides: Partial<ActiveListing> = {}): ActiveListing[] {
  return Array.from({ length: count }, () => mockListing(overrides));
}

/**
 * Reset the counter (call in beforeEach if needed).
 */
export function resetListingCounter() {
  counter = 0;
}
