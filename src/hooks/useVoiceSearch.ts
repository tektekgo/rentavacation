import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import type {
  VoiceStatus,
  VoiceSearchResult,
  VoiceSearchResponse,
} from "@/types/voice";
import { supabase } from "@/lib/supabase";
import { useVoiceQuota } from "./useVoiceQuota";

import type { AssistantOverrides } from "@vapi-ai/web/dist/api";

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const VOICE_SEARCH_SYSTEM_PROMPT = `You are a helpful vacation rental search assistant for Rent-A-Vacation, a marketplace for timeshare and vacation club properties.

Your role:
- Help travelers find vacation rentals by asking clarifying questions if needed
- Extract search parameters from natural language queries
- Always call the search_properties function with structured data
- Summarize results in a friendly, conversational way

IMPORTANT — Listening behavior:
- Wait for the user to finish speaking before responding or calling any function.
- If the user pauses briefly (1-2 seconds), they may still be adding more details like dates, budget, or preferences. Wait for them to finish.
- Only call search_properties when you are confident the user has completed their request.
- If you are unsure whether the user is done, ask a brief clarifying question instead of immediately searching.

Price guidelines:
- If the user states a specific dollar amount (e.g., "under $2000", "$500 per night", "budget of 3000"), ALWAYS use their exact number. Never override it.
- ONLY default to max_price=1500 when the user literally says "cheap" or "affordable" without providing any specific number.
- If the user mentions wanting something budget-friendly but gives no number, ask: "What's your budget range per night?"
- Never assume a price the user did not state.

Other guidelines:
- If the user mentions a season (e.g., "Spring Break"), infer approximate dates (Spring Break 2026 = March 9-16)
- If bedrooms/guests not specified, don't assume - ask for clarification
- Always mention the top 2-3 results, not all of them (avoid overwhelming)
- If no results found, suggest nearby destinations or adjusting filters
- Be warm, helpful, and concise
- Don't mention technical details like function names or API calls`;

const ASSISTANT_OVERRIDES: AssistantOverrides = {
  firstMessage:
    "Welcome to Rent-A-Vacation — voice-powered vacation search. Where are you looking to get away?",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
    endpointing: 500,
  },
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: VOICE_SEARCH_SYSTEM_PROMPT,
      },
    ],
  },
};

interface VapiMessage {
  type: string;
  transcriptType?: string;
  transcript?: string;
  role?: string;
  functionCall?: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

export function useVoiceSearch() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [results, setResults] = useState<VoiceSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);

  const { canSearch, remaining, isUnlimited, loading: quotaLoading, refresh: refreshQuota } = useVoiceQuota();

  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      console.warn("[Voice Search] VITE_VAPI_PUBLIC_KEY is not set");
      return;
    }

    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setIsCallActive(true);
      setStatus("listening");
    });

    vapi.on("call-end", () => {
      setIsCallActive(false);
      // Keep "success" status so results stay visible after call ends
      setStatus((prev) => (prev === "success" ? prev : "idle"));
    });

    vapi.on("message", async (message: VapiMessage) => {
      // Capture the user's final transcript
      if (
        message.type === "transcript" &&
        message.transcriptType === "final" &&
        message.role === "user"
      ) {
        setTranscript(message.transcript ?? "");
      }

      // Handle search function call
      if (
        message.type === "function-call" &&
        message.functionCall?.name === "search_properties"
      ) {
        setStatus("processing");
        const params = message.functionCall.parameters;

        try {
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/voice-search`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify(params),
            },
          );

          const data: VoiceSearchResponse = await response.json();

          if (data.success) {
            setResults(data.results);
            setStatus("success");

            // Increment voice search counter
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await (supabase.rpc as any)("increment_voice_search_count", {
                _user_id: user.id,
              });
              refreshQuota();
            }
          } else {
            setError(data.error ?? "Search failed");
            setStatus("error");
          }
        } catch (err) {
          console.error("[Voice Search] Edge Function call failed:", err);
          setError("Failed to search. Please try again.");
          setStatus("error");
        }
      }
    });

    vapi.on("error", (err: { message?: string }) => {
      console.error("[Voice Search] VAPI error:", err);
      setError(err?.message ?? "Voice search encountered an error");
      setStatus("error");
      setIsCallActive(false);
    });

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, []);

  const startVoiceSearch = useCallback(async () => {
    const vapi = vapiRef.current;
    if (!vapi) {
      setError("Voice search is not available. Check configuration.");
      setStatus("error");
      return;
    }

    // Check quota before starting
    if (!canSearch) {
      setError("Daily voice search limit reached. Try again tomorrow.");
      setStatus("error");
      return;
    }

    // Reset previous state
    setError(null);
    setResults([]);
    setTranscript("");
    setStatus("listening");

    try {
      await vapi.start(VAPI_ASSISTANT_ID, ASSISTANT_OVERRIDES);
    } catch (err) {
      console.error("[Voice Search] Failed to start:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start voice search",
      );
      setStatus("error");
    }
  }, [canSearch]);

  const stopVoiceSearch = useCallback(() => {
    vapiRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    vapiRef.current?.stop();
    setStatus("idle");
    setResults([]);
    setError(null);
    setTranscript("");
    setIsCallActive(false);
  }, []);

  return {
    status,
    results,
    error,
    transcript,
    isCallActive,
    startVoiceSearch,
    stopVoiceSearch,
    reset,
    quota: {
      remaining,
      isUnlimited,
      canSearch,
      loading: quotaLoading,
    },
  };
}
