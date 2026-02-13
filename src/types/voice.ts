/** Voice search request parameters — matches VAPI function calling schema */
export interface VoiceSearchParams {
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: "condo" | "villa" | "cabin" | "studio" | "any";
  amenities?: string[];
  max_guests?: number;
  open_for_bidding?: boolean;
  flexible_dates?: boolean;
}

/**
 * Individual search result — matches ACTUAL backend Edge Function response.
 *
 * NOTE: The backend uses the real DB schema, NOT the project brief schema.
 * Key differences:
 *   - `location` (single string) instead of `city` + `state`
 *   - `brand` instead of `property_type`
 *   - `sleeps` instead of `max_guests`
 *   - `property_name` comes from `properties.resort_name`
 */
export interface VoiceSearchResult {
  listing_id: string;
  property_name: string;
  location: string;
  check_in: string;
  check_out: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  brand: string;
  amenities: string[];
  image_url: string | null;
  // Resort master data (available when property has resort_id)
  resort_name: string | null;
  resort_rating: number | null;
  resort_amenities: string[];
  unit_type_name: string | null;
  square_footage: number | null;
}

/** Full API response from the voice-search Edge Function */
export interface VoiceSearchResponse {
  success: boolean;
  results: VoiceSearchResult[];
  total_count: number;
  search_params: Record<string, unknown>;
  error?: string;
}

export type VoiceStatus = "idle" | "listening" | "processing" | "success" | "error";
