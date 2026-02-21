import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { searchProperties } from "../_shared/property-search.ts";
import type { SearchParams, SearchResult } from "../_shared/property-search.ts";

// --- CORS: Same allowlist pattern as voice-search ---
function isAllowedOrigin(origin: string): boolean {
  const allowedExact = [
    "https://rentavacation.lovable.app",
    "https://rent-a-vacation.com",
    "https://www.rent-a-vacation.com",
  ];
  if (allowedExact.includes(origin)) return true;
  if (/^https:\/\/rentavacation[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "https://rent-a-vacation.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// --- Rate limiting: per-IP sliding window (60 req/min — higher than voice) ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

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

function cleanRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[TEXT-CHAT] ${step}${detailsStr}`);
};

// --- System prompts by context ---
const SYSTEM_PROMPTS: Record<string, string> = {
  rentals: `You are RAVIO, the friendly assistant for Rent-A-Vacation, a marketplace for timeshare and vacation club properties.

Your role on the property search page:
- Help travelers find vacation rentals by understanding their preferences
- Extract search criteria from natural language and call search_properties when appropriate
- Summarize results in a friendly, conversational way with clickable links
- Format property links as **[Property Name](/property/{listing_id})** so users can click through

Price guidelines:
- If the user states a specific dollar amount, use their exact number
- Only default to max_price=1500 when the user literally says "cheap" or "affordable" without a number
- If budget-friendly but no number given, ask: "What's your budget range?"

Other guidelines:
- If the user mentions a season (e.g., "Spring Break"), infer approximate dates
- If bedrooms/guests not specified, don't assume — ask
- Mention the top 2-3 results with key details (price, location, dates, bedrooms)
- If no results found, suggest nearby destinations or adjusting filters
- Be warm, helpful, and concise
- Don't mention technical details like function names or API calls`,

  "property-detail": `You are RAVIO, the friendly assistant for Rent-A-Vacation, helping a user who is viewing a specific property listing.

Your role on the property detail page:
- Answer questions about the property's amenities, pricing, and availability
- Explain the booking process (direct booking vs. bidding)
- Explain cancellation policies and what "open for bidding" means
- Help users understand the check-in/confirmation process
- Be helpful and informative about the specific property they're viewing
- Don't search for other properties unless explicitly asked`,

  bidding: `You are RAVIO, the friendly assistant for Rent-A-Vacation, helping a user on the Bidding Marketplace page.

Your role on the bidding page:
- Explain how bidding works: owners can opt-in listings for bidding, renters submit bid offers
- Explain travel requests: renters post desired destination/dates/budget, owners respond with proposals
- Guide users on placing bids, counter-offers, and accepting proposals
- Explain the difference between direct booking and the bidding marketplace
- Help users understand pricing strategy for bids
- Be concise and action-oriented`,

  general: `You are RAVIO, the friendly assistant for Rent-A-Vacation, a marketplace for timeshare and vacation club properties.

Your role as a general platform assistant:
- Explain how Rent-A-Vacation works for both renters and property owners
- Guide users on listing properties, browsing rentals, and the booking process
- Explain membership tiers, fees, and the escrow payment system
- Help with navigation — point users to the right pages
- Answer questions about the platform's trust and safety features
- Be warm, welcoming, and concise`,
};

// --- OpenRouter tool definitions ---
const SEARCH_TOOL = {
  type: "function" as const,
  function: {
    name: "search_properties",
    description: "Search for vacation rental properties based on user criteria like destination, dates, price range, bedrooms, and amenities.",
    parameters: {
      type: "object",
      properties: {
        destination: { type: "string", description: "City, state, or resort name to search for" },
        check_in_date: { type: "string", description: "Check-in date in YYYY-MM-DD format" },
        check_out_date: { type: "string", description: "Check-out date in YYYY-MM-DD format" },
        min_price: { type: "number", description: "Minimum total price in USD" },
        max_price: { type: "number", description: "Maximum total price in USD" },
        bedrooms: { type: "integer", description: "Minimum number of bedrooms" },
        property_type: { type: "string", description: "Property brand/type (e.g., marriott, hilton, disney)" },
        amenities: { type: "array", items: { type: "string" }, description: "Required amenities" },
        max_guests: { type: "integer", description: "Minimum number of guests the property must accommodate" },
        flexible_dates: { type: "boolean", description: "Whether dates are flexible" },
      },
    },
  },
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TextChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  context: string;
}

// OpenRouter model — cost-effective, good at tool calling
const OPENROUTER_MODEL = "anthropic/claude-sonnet-4-20250514";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function invoked", { method: req.method });

    // Rate limit
    cleanRateLimitMap();
    const clientIp = req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (isRateLimited(clientIp)) {
      logStep("Rate limited", { clientIp });
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again shortly." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 },
      );
    }

    // Validate JWT (logged-in users only)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      logStep("Auth failed", { error: authError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }
    logStep("User authenticated", { userId: user.id });

    // Parse request
    const { message, conversationHistory, context }: TextChatRequest = await req.json();
    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;
    logStep("Context selected", { context, messageLength: message.length });

    // Build messages array for OpenRouter
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-20), // Keep last 20 messages for context
      { role: "user", content: message },
    ];

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterKey) {
      logStep("Missing OPENROUTER_API_KEY");
      return new Response(
        JSON.stringify({ error: "Chat service not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // Determine if this context supports search tool
    const tools = context === "rentals" ? [SEARCH_TOOL] : undefined;

    // First OpenRouter call (may trigger tool call)
    logStep("Calling OpenRouter", { model: OPENROUTER_MODEL, toolsEnabled: !!tools });
    let openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://rent-a-vacation.com",
        "X-Title": "Rent-A-Vacation Text Chat",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        ...(tools ? { tools, tool_choice: "auto" } : {}),
        stream: false, // First call non-streaming to handle tool calls
        max_tokens: 1024,
      }),
    });

    if (!openRouterResponse.ok) {
      const errBody = await openRouterResponse.text();
      logStep("OpenRouter error", { status: openRouterResponse.status, body: errBody });
      return new Response(
        JSON.stringify({ error: "Chat service temporarily unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
      );
    }

    const result = await openRouterResponse.json();
    const assistantMessage = result.choices?.[0]?.message;
    let searchResults: SearchResult[] | undefined;

    // Handle tool calls
    if (assistantMessage?.tool_calls?.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      if (toolCall.function?.name === "search_properties") {
        logStep("Tool call: search_properties", { args: toolCall.function.arguments });

        const searchParams: SearchParams = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;

        // Use service role client for search (bypasses RLS)
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });

        const searchResponse = await searchProperties(serviceClient, searchParams, "TEXT-CHAT");
        searchResults = searchResponse.results;

        logStep("Search completed", { resultCount: searchResults.length });

        // Feed results back to LLM for natural language summary
        const toolResultMessages = [
          ...messages,
          assistantMessage,
          {
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: true,
              results: searchResults,
              total_count: searchResults.length,
            }),
          },
        ];

        openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://rent-a-vacation.com",
            "X-Title": "Rent-A-Vacation Text Chat",
          },
          body: JSON.stringify({
            model: OPENROUTER_MODEL,
            messages: toolResultMessages,
            stream: true,
            max_tokens: 1024,
          }),
        });

        if (!openRouterResponse.ok) {
          const errBody = await openRouterResponse.text();
          logStep("OpenRouter follow-up error", { status: openRouterResponse.status, body: errBody });
          return new Response(
            JSON.stringify({ error: "Chat service temporarily unavailable" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
          );
        }

        // Stream the follow-up response as SSE
        return streamSSEResponse(openRouterResponse, corsHeaders, searchResults);
      }
    }

    // No tool call — check if we already have content, otherwise stream
    if (assistantMessage?.content) {
      // Non-streaming response (no tool call path)
      // Re-request with streaming for consistent SSE output
      openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://rent-a-vacation.com",
          "X-Title": "Rent-A-Vacation Text Chat",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          ...(tools ? { tools, tool_choice: "auto" } : {}),
          stream: true,
          max_tokens: 1024,
        }),
      });

      if (!openRouterResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Chat service temporarily unavailable" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
        );
      }
    }

    return streamSSEResponse(openRouterResponse, corsHeaders, searchResults);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Error", { error: message });
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});

/**
 * Transforms an OpenRouter streaming response into SSE events for the client.
 * Sends search results as a separate event before the text stream.
 */
function streamSSEResponse(
  openRouterResponse: Response,
  corsHeaders: Record<string, string>,
  searchResults?: SearchResult[],
): Response {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      // Send search results as a separate SSE event if present
      if (searchResults && searchResults.length > 0) {
        controller.enqueue(
          encoder.encode(`event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`)
        );
      }

      const reader = openRouterResponse.body?.getReader();
      if (!reader) {
        controller.enqueue(encoder.encode(`event: error\ndata: No response body\n\n`));
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`));
              continue;
            }

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                controller.enqueue(
                  encoder.encode(`event: token\ndata: ${JSON.stringify(delta.content)}\n\n`)
                );
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      } catch (err) {
        logStep("Stream error", { error: String(err) });
        controller.enqueue(encoder.encode(`event: error\ndata: Stream interrupted\n\n`));
      } finally {
        controller.enqueue(encoder.encode(`event: done\ndata: [DONE]\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
