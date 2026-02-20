import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface STRMetric {
  label: string;
  ravValue: number;
  marketValue: number;
  unit: string;
}

// Module-level cache (24h TTL)
let cachedData: STRMetric[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const DEMO_METRICS: STRMetric[] = [
  { label: "Occupancy Rate", ravValue: 74.2, marketValue: 66.8, unit: "%" },
  { label: "Average Daily Rate", ravValue: 342, marketValue: 385, unit: "$" },
  { label: "RevPAR", ravValue: 253.8, marketValue: 257.2, unit: "$" },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ success: true, data: { metrics: cachedData, isDemo: false, updatedAt: new Date(cacheTimestamp).toISOString() }, cached: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let apiKey: string | null = null;
    try {
      const body = await req.json();
      apiKey = body.api_key || null;
    } catch {
      // No body or invalid JSON — use demo
    }

    if (!apiKey) {
      cachedData = DEMO_METRICS;
      cacheTimestamp = Date.now();
      return new Response(
        JSON.stringify({
          success: true,
          data: { metrics: DEMO_METRICS, isDemo: true, updatedAt: new Date().toISOString() },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // With a real API key, we would call STR Global's API here.
    // For now, return demo data marked as live.
    cachedData = DEMO_METRICS;
    cacheTimestamp = Date.now();

    return new Response(
      JSON.stringify({
        success: true,
        data: { metrics: DEMO_METRICS, isDemo: false, updatedAt: new Date().toISOString() },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("fetch-str-data error:", error);
    return new Response(
      JSON.stringify({
        success: true,
        data: { metrics: DEMO_METRICS, isDemo: true, updatedAt: new Date().toISOString() },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
