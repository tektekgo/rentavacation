import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VOICE-SEARCH] ${step}${detailsStr}`);
};

// Request matches VAPI function calling schema from Agent 1
interface VoiceSearchRequest {
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: string; // Maps to brand in DB
  amenities?: string[];
  max_guests?: number; // Maps to sleeps in DB
  open_for_bidding?: boolean; // Not in DB yet, ignored
  flexible_dates?: boolean;
}

// Response matches API contract from project brief
interface SearchResult {
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
  // Resort master data fields
  resort_name: string | null;
  resort_rating: number | null;
  resort_amenities: string[];
  unit_type_name: string | null;
  square_footage: number | null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.details === "string") return obj.details;
    return JSON.stringify(err);
  }
  return String(err);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function invoked", { method: req.method });

    const rawBody = await req.json();

    // Handle both VAPI webhook format and direct API calls
    let searchParams: VoiceSearchRequest;
    if (rawBody.message?.type === "function-call") {
      searchParams = rawBody.message.functionCall.parameters;
      logStep("VAPI function call detected", {
        functionName: rawBody.message.functionCall.name,
      });
    } else {
      searchParams = rawBody;
    }

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
    } = searchParams;

    logStep("Search params parsed", searchParams as Record<string, unknown>);

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

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

    logStep("Executing query");
    const { data: listings, error } = await query;

    if (error) {
      logStep("Query error", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(error.message);
    }

    logStep("Query completed", { rawCount: listings?.length ?? 0 });

    // --- Application-level filters (on properties fields) ---
    let filtered = (listings ?? []).filter(
      (listing: Record<string, unknown>) => {
        const prop = listing.property as Record<string, unknown> | null;
        if (!prop) return false;
        return true;
      }
    );

    // Destination filter: search in property location, resort_name, and resort location (city/state)
    if (destination) {
      const dest = destination.toLowerCase();
      filtered = filtered.filter((listing: Record<string, unknown>) => {
        const prop = listing.property as Record<string, unknown>;
        const location = ((prop.location as string) ?? "").toLowerCase();
        const resortName = ((prop.resort_name as string) ?? "").toLowerCase();
        // Also search resort master data location (city, state, country)
        const resort = prop.resort as Record<string, unknown> | null;
        const resortLocation = resort?.location as Record<string, string> | null;
        const resortCity = (resortLocation?.city ?? "").toLowerCase();
        const resortState = (resortLocation?.state ?? "").toLowerCase();
        const resortCountry = (resortLocation?.country ?? "").toLowerCase();
        return (
          location.includes(dest) ||
          resortName.includes(dest) ||
          resortCity.includes(dest) ||
          resortState.includes(dest) ||
          resortCountry.includes(dest)
        );
      });
      logStep("Destination filter applied", {
        destination,
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

    // Amenities filter (PostgreSQL text[] — check array containment)
    if (amenities && amenities.length > 0) {
      filtered = filtered.filter((listing: Record<string, unknown>) => {
        const prop = listing.property as Record<string, unknown>;
        const propAmenities = (prop?.amenities as string[]) ?? [];
        return amenities.every((a: string) => propAmenities.includes(a));
      });
      logStep("Amenities filter applied", {
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
          // Resort master data
          resort_name: (resort?.resort_name as string) ?? null,
          resort_rating: (resort?.guest_rating as number) ?? null,
          resort_amenities: ((resort?.resort_amenities as string[]) ?? []).slice(0, 5),
          unit_type_name: (unitType?.unit_type_name as string) ?? null,
          square_footage: (unitType?.square_footage as number) ?? null,
        };
      }
    );

    logStep("Results formatted", { count: results.length });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        total_count: results.length,
        search_params: searchParams,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const message = getErrorMessage(err);
    logStep("Error", { error: message });

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
        results: [],
        total_count: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
