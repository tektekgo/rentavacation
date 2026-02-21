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
    model: "nova-3",
    language: "en",
    endpointing: 300,
    keywords: [
      "timeshare", "Rent-A-Vacation", "Hilton Grand Vacations",
      "Marriott Vacations", "Wyndham", "Bluegreen", "Holiday Inn Club",
      "Orlando", "Maui", "Cancun", "Myrtle Beach", "Las Vegas",
      "studio", "one-bedroom", "two-bedroom", "lockoff",
    ],
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
  maxDurationSeconds: 120,
  // NOTE: Track B advanced plans (backgroundSpeechDenoisingPlan, startSpeakingPlan
  // with smartEndpointingPlan, stopSpeakingPlan) removed — VAPI API rejects them
  // as of Feb 2026 (400 start-method-error). Re-enable when VAPI supports them
  // in assistant overrides. See docs/features/voice-search/KNOWN-ISSUES.md.
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
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSearchTimestampRef = useRef<number>(0);

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
        // Deduplicate rapid-fire calls (VAPI may fire twice in quick succession)
        const now = Date.now();
        if (now - lastSearchTimestampRef.current < 2000) {
          console.warn("[Voice Search] Duplicate search call suppressed");
          return;
        }
        lastSearchTimestampRef.current = now;

        setStatus("processing");
        const params = message.functionCall.parameters;

        // Abort any in-flight request before starting a new one
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

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
              signal: abortControllerRef.current.signal,
            },
          );

          const data: VoiceSearchResponse = await response.json();

          if (data.success) {
            setResults(data.results);
            setStatus("success");

            // Increment voice search counter
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.rpc as any)("increment_voice_search_count", { _user_id: user.id });
              refreshQuota();
            }
          } else {
            setError(data.error ?? "Search failed");
            setStatus("error");
          }
        } catch (err) {
          // Don't treat abort as an error
          if (err instanceof DOMException && err.name === "AbortError") {
            console.log("[Voice Search] Previous request aborted");
            return;
          }
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
      abortControllerRef.current?.abort();
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

    // Check if voice search is enabled via DB toggle
    try {
      const { data: flags } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["voice_enabled", "voice_search_enabled"]);

      const flagMap: Record<string, boolean> = {};
      for (const row of flags || []) {
        const val = row.setting_value as Record<string, unknown>;
        flagMap[row.setting_key] = val.enabled as boolean;
      }

      if (flagMap.voice_enabled === false || flagMap.voice_search_enabled === false) {
        setError("Voice search is currently disabled.");
        setStatus("error");
        return;
      }
    } catch {
      // If we can't check, proceed (fail-open for better UX)
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
    abortControllerRef.current?.abort();
    vapiRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
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
