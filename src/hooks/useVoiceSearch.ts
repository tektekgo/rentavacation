import { useState, useCallback, useRef, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import type {
  VoiceStatus,
  VoiceSearchResult,
  VoiceSearchResponse,
} from "@/types/voice";

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

    // Reset previous state
    setError(null);
    setResults([]);
    setTranscript("");
    setStatus("listening");

    try {
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      console.error("[Voice Search] Failed to start:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start voice search",
      );
      setStatus("error");
    }
  }, []);

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
  };
}
