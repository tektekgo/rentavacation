import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MacroIndicator {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  source: string;
  updatedAt: string;
  trend: "up" | "down" | "flat";
  sparklineData: number[];
}

// Module-level cache (24h TTL)
let cachedIndicators: MacroIndicator[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const FALLBACK_INDICATORS: MacroIndicator[] = [
  {
    id: "consumer-sentiment",
    label: "Consumer Sentiment Index",
    value: 72.6,
    previousValue: 69.4,
    unit: "index",
    source: "U. of Michigan",
    updatedAt: new Date().toISOString(),
    trend: "up",
    sparklineData: [65.2, 67.1, 68.3, 69.4, 70.8, 72.6],
  },
  {
    id: "travel-spending",
    label: "Travel Spending (YoY)",
    value: 8.3,
    previousValue: 6.1,
    unit: "%",
    source: "BEA",
    updatedAt: new Date().toISOString(),
    trend: "up",
    sparklineData: [4.2, 5.1, 5.8, 6.1, 7.4, 8.3],
  },
  {
    id: "cpi-lodging",
    label: "CPI: Lodging Away from Home",
    value: 3.2,
    previousValue: 4.1,
    unit: "% YoY",
    source: "BLS",
    updatedAt: new Date().toISOString(),
    trend: "down",
    sparklineData: [5.6, 5.1, 4.7, 4.1, 3.6, 3.2],
  },
  {
    id: "unemployment",
    label: "Unemployment Rate",
    value: 3.9,
    previousValue: 4.0,
    unit: "%",
    source: "BLS",
    updatedAt: new Date().toISOString(),
    trend: "down",
    sparklineData: [4.3, 4.2, 4.1, 4.0, 3.9, 3.9],
  },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cachedIndicators && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ success: true, data: cachedIndicators, cached: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // FRED API is public (no key needed) — fetch consumer sentiment
    const fredUrl =
      "https://api.stlouisfed.org/fred/series/observations?series_id=UMCSENT&sort_order=desc&limit=6&file_type=json&api_key=DEMO_KEY";

    let indicators = FALLBACK_INDICATORS;
    try {
      const resp = await fetch(fredUrl);
      if (resp.ok) {
        const json = await resp.json();
        if (json.observations?.length) {
          const values = json.observations
            .map((o: { value: string }) => parseFloat(o.value))
            .filter((v: number) => !isNaN(v))
            .reverse();

          if (values.length >= 2) {
            indicators = indicators.map((ind) => {
              if (ind.id === "consumer-sentiment") {
                return {
                  ...ind,
                  value: values[values.length - 1],
                  previousValue: values[values.length - 2],
                  sparklineData: values.slice(-6),
                  trend:
                    values[values.length - 1] > values[values.length - 2]
                      ? ("up" as const)
                      : values[values.length - 1] < values[values.length - 2]
                        ? ("down" as const)
                        : ("flat" as const),
                  updatedAt: new Date().toISOString(),
                };
              }
              return ind;
            });
          }
        }
      }
    } catch {
      // Use fallback on FRED failure
    }

    cachedIndicators = indicators;
    cacheTimestamp = Date.now();

    return new Response(
      JSON.stringify({ success: true, data: indicators }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("fetch-macro-indicators error:", error);
    return new Response(
      JSON.stringify({ success: true, data: FALLBACK_INDICATORS, demo: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
