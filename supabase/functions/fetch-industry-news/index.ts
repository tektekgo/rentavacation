import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: "industry" | "regulatory" | "market" | "technology";
  summary?: string;
}

// Module-level cache (60 min TTL)
let cachedNews: NewsItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fallback-1",
    title: "Vacation Rental Market Sees 18% Growth in Booking Volume",
    source: "Skift",
    url: "https://skift.com",
    publishedAt: new Date().toISOString(),
    category: "industry",
    summary: "Short-term rental platforms report record Q4 numbers driven by remote work flexibility.",
  },
  {
    id: "fallback-2",
    title: "New Federal Guidelines for Short-Term Rental Platforms",
    source: "Reuters",
    url: "https://reuters.com",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    category: "regulatory",
    summary: "FTC proposes transparency rules for vacation rental pricing and fee disclosure.",
  },
  {
    id: "fallback-3",
    title: "AI-Powered Voice Search Reshaping Travel Discovery",
    source: "PhocusWire",
    url: "https://phocuswire.com",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    category: "technology",
    summary: "Voice-first interfaces showing 4x higher conversion rates in travel bookings.",
  },
  {
    id: "fallback-4",
    title: "Caribbean Destinations Lead 2026 Vacation Rental Demand",
    source: "Travel Weekly",
    url: "https://travelweekly.com",
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    category: "market",
    summary: "Turks & Caicos, Aruba, and Jamaica see strongest YoY growth in rental bookings.",
  },
  {
    id: "fallback-5",
    title: "Bidding Models Gain Traction in Luxury Vacation Segment",
    source: "Hospitality Net",
    url: "https://hospitalitynet.org",
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    category: "industry",
    summary: "Dynamic pricing through traveler bidding creates 12% higher yields for property owners.",
  },
];

function categorizeArticle(
  title: string,
  description: string
): "industry" | "regulatory" | "market" | "technology" {
  const text = `${title} ${description}`.toLowerCase();
  if (
    /regulat|ordinance|legislat|law|tax|compliance|ban|restrict|license|zoning/.test(
      text
    )
  )
    return "regulatory";
  if (
    /revenue|occupancy|adr|revpar|demand|supply|growth|decline|forecast|trend|rate/.test(
      text
    )
  )
    return "market";
  if (
    /ai|tech|software|platform|app|automation|machine learning|voice|chatbot/.test(
      text
    )
  )
    return "technology";
  return "industry";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Return cache if fresh
    if (cachedNews && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ success: true, data: cachedNews, cached: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const apiKey = Deno.env.get("NEWSAPI_KEY");
    if (!apiKey) {
      cachedNews = FALLBACK_NEWS;
      cacheTimestamp = Date.now();
      return new Response(
        JSON.stringify({ success: true, data: FALLBACK_NEWS, demo: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const url = `https://newsapi.org/v2/everything?q=(timeshare+OR+"vacation+ownership"+OR+"short-term+rental"+OR+"vacation+rental")+(industry+OR+market+OR+regulation+OR+revenue)&sortBy=publishedAt&pageSize=7&language=en&apiKey=${apiKey}`;
    const resp = await fetch(url);
    const json = await resp.json();

    if (json.status !== "ok" || !json.articles?.length) {
      cachedNews = FALLBACK_NEWS;
      cacheTimestamp = Date.now();
      return new Response(
        JSON.stringify({ success: true, data: FALLBACK_NEWS, demo: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const news: NewsItem[] = json.articles.map(
      (a: { title: string; source: { name: string }; url: string; publishedAt: string; description: string }, i: number) => ({
        id: `news-${i}`,
        title: a.title,
        source: a.source?.name || "Unknown",
        url: a.url,
        publishedAt: a.publishedAt,
        category: categorizeArticle(a.title, a.description || ""),
        summary: a.description,
      })
    );

    cachedNews = news;
    cacheTimestamp = Date.now();

    return new Response(
      JSON.stringify({ success: true, data: news }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("fetch-industry-news error:", error);
    return new Response(
      JSON.stringify({ success: true, data: FALLBACK_NEWS, demo: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
