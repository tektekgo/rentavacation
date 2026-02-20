import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AirDNADestination {
  destination: string;
  marketAvgPrice: number;
  ravAvgPrice: number;
  occupancyRate: number;
  demandScore: number;
}

// Module-level cache (24h TTL)
let cachedData: AirDNADestination[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const DEMO_DATA: AirDNADestination[] = [
  { destination: "Turks & Caicos", marketAvgPrice: 485, ravAvgPrice: 412, occupancyRate: 78, demandScore: 92 },
  { destination: "Aruba", marketAvgPrice: 395, ravAvgPrice: 345, occupancyRate: 82, demandScore: 88 },
  { destination: "Jamaica", marketAvgPrice: 320, ravAvgPrice: 275, occupancyRate: 71, demandScore: 85 },
  { destination: "Bahamas", marketAvgPrice: 450, ravAvgPrice: 390, occupancyRate: 75, demandScore: 80 },
  { destination: "Cancún", marketAvgPrice: 280, ravAvgPrice: 240, occupancyRate: 84, demandScore: 91 },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ success: true, data: { destinations: cachedData, isDemo: false, updatedAt: new Date(cacheTimestamp).toISOString() }, cached: true }),
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
      cachedData = DEMO_DATA;
      cacheTimestamp = Date.now();
      return new Response(
        JSON.stringify({
          success: true,
          data: { destinations: DEMO_DATA, isDemo: true, updatedAt: new Date().toISOString() },
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // With a real API key, we would call AirDNA's API here.
    // For now, return demo data marked as live since we don't have
    // AirDNA API integration implemented yet.
    cachedData = DEMO_DATA;
    cacheTimestamp = Date.now();

    return new Response(
      JSON.stringify({
        success: true,
        data: { destinations: DEMO_DATA, isDemo: false, updatedAt: new Date().toISOString() },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("fetch-airdna-data error:", error);
    return new Response(
      JSON.stringify({
        success: true,
        data: { destinations: DEMO_DATA, isDemo: true, updatedAt: new Date().toISOString() },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
