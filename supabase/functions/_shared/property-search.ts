/**
 * Shared property search module — used by both voice-search and text-chat edge functions.
 * Extracts the Supabase query building + filtering logic into a reusable module.
 */
import { SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";

export interface SearchParams {
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: string;
  amenities?: string[];
  max_guests?: number;
  flexible_dates?: boolean;
}

export interface SearchResult {
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
  resort_name: string | null;
  resort_rating: number | null;
  resort_amenities: string[];
  unit_type_name: string | null;
  square_footage: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

const logStep = (prefix: string, step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[${prefix}] ${step}${detailsStr}`);
};

// State name → abbreviation mapping for flexible destination matching
const STATE_ABBREVS: Record<string, string> = {
  alabama: "al", alaska: "ak", arizona: "az", arkansas: "ar", california: "ca",
  colorado: "co", connecticut: "ct", delaware: "de", florida: "fl", georgia: "ga",
  hawaii: "hi", idaho: "id", illinois: "il", indiana: "in", iowa: "ia",
  kansas: "ks", kentucky: "ky", louisiana: "la", maine: "me", maryland: "md",
  massachusetts: "ma", michigan: "mi", minnesota: "mn", mississippi: "ms",
  missouri: "mo", montana: "mt", nebraska: "ne", nevada: "nv",
  "new hampshire": "nh", "new jersey": "nj", "new mexico": "nm", "new york": "ny",
  "north carolina": "nc", "north dakota": "nd", ohio: "oh", oklahoma: "ok",
  oregon: "or", pennsylvania: "pa", "rhode island": "ri", "south carolina": "sc",
  "south dakota": "sd", tennessee: "tn", texas: "tx", utah: "ut", vermont: "vt",
  virginia: "va", washington: "wa", "west virginia": "wv", wisconsin: "wi",
  wyoming: "wy", "district of columbia": "dc",
};

// Reverse mapping: abbreviation → full state name
const ABBREV_TO_STATE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBREVS).map(([name, abbr]) => [abbr, name])
);

/**
 * Expand a destination search term to include state name/abbreviation variants.
 * e.g., "hawaii" → ["hawaii", "hi"], "fl" → ["fl", "florida"]
 */
function expandDestination(dest: string): string[] {
  const lower = dest.toLowerCase().trim();
  const variants = [lower];
  if (STATE_ABBREVS[lower]) variants.push(STATE_ABBREVS[lower]);
  if (ABBREV_TO_STATE[lower]) variants.push(ABBREV_TO_STATE[lower]);
  return variants;
}

export async function searchProperties(
  supabase: SupabaseClient,
  params: SearchParams,
  logPrefix = "PROPERTY-SEARCH",
): Promise<SearchResponse> {
  const {
    destination,
    check_in_date,
    check_out_date,
    min_price,
    max_price,
    bedrooms,
    property_type,
    amenities,
    max_guests,
    flexible_dates,
  } = params;

  logStep(logPrefix, "Search params parsed", params as Record<string, unknown>);

  // Build query: listings joined with properties, resorts, and unit types
  let query = supabase
    .from("listings")
    .select(
      `
      id,
      check_in_date,
      check_out_date,
      final_price,
      cancellation_policy,
      property:properties(
        id,
        resort_name,
        location,
        brand,
        bedrooms,
        bathrooms,
        sleeps,
        amenities,
        images,
        resort:resorts(
          resort_name,
          location,
          guest_rating,
          resort_amenities,
          contact
        ),
        unit_type:resort_unit_types(
          unit_type_name,
          bedrooms,
          bathrooms,
          max_occupancy,
          square_footage
        )
      )
    `
    )
    .eq("status", "active");

  // --- Database-level filters (on listings table columns) ---

  if (min_price !== undefined && min_price !== null) {
    query = query.gte("final_price", min_price);
  }
  if (max_price !== undefined && max_price !== null) {
    query = query.lte("final_price", max_price);
  }

  // Date filtering (if specific dates provided and not flexible)
  if (check_in_date && !flexible_dates) {
    query = query.lte("check_in_date", check_in_date);
  }
  if (check_out_date && !flexible_dates) {
    query = query.gte("check_out_date", check_out_date);
  }

  // Order by price ascending, fetch up to 50 for post-filtering
  query = query.order("final_price", { ascending: true }).limit(50);

  logStep(logPrefix, "Executing query");
  const { data: listings, error } = await query;

  if (error) {
    logStep(logPrefix, "Query error", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(error.message);
  }

  logStep(logPrefix, "Query completed", { rawCount: listings?.length ?? 0 });

  // --- Application-level filters (on properties fields) ---
  let filtered = (listings ?? []).filter(
    (listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown> | null;
      if (!prop) return false;
      return true;
    }
  );

  // Destination filter: search in property location, resort_name, and resort location
  // Expands state names/abbreviations (e.g., "Hawaii" also matches "HI")
  if (destination) {
    const variants = expandDestination(destination);
    filtered = filtered.filter((listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown>;
      const location = ((prop.location as string) ?? "").toLowerCase();
      const resortName = ((prop.resort_name as string) ?? "").toLowerCase();
      const resort = prop.resort as Record<string, unknown> | null;
      const resortLocation = resort?.location as Record<string, string> | null;
      const resortCity = (resortLocation?.city ?? "").toLowerCase();
      const resortState = (resortLocation?.state ?? "").toLowerCase();
      const resortCountry = (resortLocation?.country ?? "").toLowerCase();
      const searchFields = [location, resortName, resortCity, resortState, resortCountry];
      return variants.some((v) => searchFields.some((field) => field.includes(v)));
    });
    logStep(logPrefix, "Destination filter applied", {
      destination,
      variants,
      afterCount: filtered.length,
    });
  }

  // Bedrooms filter
  if (bedrooms !== undefined && bedrooms !== null) {
    filtered = filtered.filter((listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown>;
      return ((prop.bedrooms as number) ?? 0) >= bedrooms;
    });
  }

  // Property type / brand filter
  if (property_type && property_type !== "any") {
    const pt = property_type.toLowerCase();
    filtered = filtered.filter((listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown>;
      const brand = ((prop.brand as string) ?? "").toLowerCase();
      return brand.includes(pt);
    });
  }

  // Max guests filter (maps to sleeps column)
  if (max_guests !== undefined && max_guests !== null) {
    filtered = filtered.filter((listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown>;
      return ((prop.sleeps as number) ?? 0) >= max_guests;
    });
  }

  // Amenities filter
  if (amenities && amenities.length > 0) {
    filtered = filtered.filter((listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown>;
      const propAmenities = (prop?.amenities as string[]) ?? [];
      return amenities.every((a: string) => propAmenities.includes(a));
    });
    logStep(logPrefix, "Amenities filter applied", {
      requested: amenities,
      afterCount: filtered.length,
    });
  }

  // Limit to 20 results after all filtering
  const limited = filtered.slice(0, 20);

  // Format results — use resort master data when available, fallback to property fields
  const results: SearchResult[] = limited.map(
    (listing: Record<string, unknown>) => {
      const prop = listing.property as Record<string, unknown>;
      const images = (prop.images as string[]) ?? [];
      const resort = prop.resort as Record<string, unknown> | null;
      const unitType = prop.unit_type as Record<string, unknown> | null;
      const resortLocation = resort?.location as Record<string, string> | null;

      return {
        listing_id: listing.id as string,
        property_name: (resort?.resort_name as string) ?? (prop.resort_name as string) ?? "",
        location: resortLocation
          ? `${resortLocation.city}, ${resortLocation.state}`
          : (prop.location as string) ?? "",
        check_in: listing.check_in_date as string,
        check_out: listing.check_out_date as string,
        price: listing.final_price as number,
        bedrooms: (prop.bedrooms as number) ?? 0,
        bathrooms: (prop.bathrooms as number) ?? 0,
        sleeps: (prop.sleeps as number) ?? 0,
        brand: (prop.brand as string) ?? "",
        amenities: (prop.amenities as string[]) ?? [],
        image_url: images[0] ?? null,
        resort_name: (resort?.resort_name as string) ?? null,
        resort_rating: (resort?.guest_rating as number) ?? null,
        resort_amenities: ((resort?.resort_amenities as string[]) ?? []).slice(0, 5),
        unit_type_name: (unitType?.unit_type_name as string) ?? null,
        square_footage: (unitType?.square_footage as number) ?? null,
      };
    }
  );

  logStep(logPrefix, "Results formatted", { count: results.length });

  return { results, totalCount: results.length };
}
