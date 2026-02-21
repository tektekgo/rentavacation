import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { searchProperties } from "../_shared/property-search.ts";
import type { SearchParams } from "../_shared/property-search.ts";

// --- CORS: Allow specific origins only ---
function isAllowedOrigin(origin: string): boolean {
  const allowedExact = [
    "https://rentavacation.lovable.app",
    "https://rent-a-vacation.com",
    "https://www.rent-a-vacation.com",
  ];
  if (allowedExact.includes(origin)) return true;
  // Vercel preview deploys
  if (/^https:\/\/rentavacation[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  // Local development
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "https://rent-a-vacation.com",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

// --- Rate limiting: per-IP sliding window (per-isolate) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1-minute window

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Clean stale entries periodically to prevent memory leaks
function cleanRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

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
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function invoked", { method: req.method });

    // Rate limit by client IP
    cleanRateLimitMap();
    const clientIp = req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (isRateLimited(clientIp)) {
      logStep("Rate limited", { clientIp });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many requests. Please try again shortly.",
          results: [],
          total_count: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 429,
        }
      );
    }

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

    logStep("Search params parsed", searchParams as Record<string, unknown>);

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Use shared search module
    const sharedParams: SearchParams = {
      destination: searchParams.destination,
      check_in_date: searchParams.check_in_date,
      check_out_date: searchParams.check_out_date,
      min_price: searchParams.min_price,
      max_price: searchParams.max_price,
      bedrooms: searchParams.bedrooms,
      property_type: searchParams.property_type,
      amenities: searchParams.amenities,
      max_guests: searchParams.max_guests,
      flexible_dates: searchParams.flexible_dates,
    };

    const { results } = await searchProperties(supabase, sharedParams, "VOICE-SEARCH");

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
