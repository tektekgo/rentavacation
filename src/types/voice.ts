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

// ============================================================
// Voice Admin & Observability Types (Migration 021)
// ============================================================

/** Per-search log entry — matches voice_search_logs table */
export interface VoiceSearchLog {
  id: string;
  user_id: string | null;
  search_params: Record<string, unknown>;
  results_count: number;
  latency_ms: number | null;
  status: 'success' | 'error' | 'no_results' | 'timeout';
  error_message: string | null;
  source: 'voice' | 'text_chat';
  created_at: string;
  // Joined from profiles (optional)
  profiles?: { email: string; full_name: string | null };
}

/** Per-user voice access override — matches voice_user_overrides table */
export interface VoiceUserOverride {
  id: string;
  user_id: string;
  voice_disabled: boolean;
  custom_quota_daily: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined from profiles (optional)
  profiles?: { email: string; full_name: string | null };
}

/** Return type for get_voice_usage_stats RPC — one row per day */
export interface VoiceUsageStats {
  search_date: string;
  total_searches: number;
  unique_users: number;
  success_count: number;
  error_count: number;
  no_results_count: number;
  timeout_count: number;
  avg_latency_ms: number | null;
  avg_results_count: number | null;
}

/** Return type for get_voice_top_users RPC */
export interface VoiceTopUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  total_searches: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  last_search_at: string;
}
