import { Mic, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { VoiceStatus } from "@/types/voice";

interface VoiceStatusIndicatorProps {
  status: VoiceStatus;
  transcript?: string;
  resultCount?: number;
  error?: string | null;
  onDismiss?: () => void;
}

export function VoiceStatusIndicator({
  status,
  transcript,
  resultCount,
  error,
  onDismiss,
}: VoiceStatusIndicatorProps) {
  if (status === "idle") return null;

  return (
    <Alert
      variant={status === "error" ? "destructive" : "default"}
      className="mt-4 animate-fade-in"
    >
      {status === "listening" && (
        <>
          <Mic className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Listening... Speak your search query
          </AlertDescription>
        </>
      )}

      {status === "processing" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Searching properties
            {transcript ? ` for "${transcript}"` : ""}...
          </AlertDescription>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {resultCount && resultCount > 0
                ? `Found ${resultCount} ${resultCount === 1 ? "result" : "results"}`
                : "No results found — try a different search"}
              {transcript ? ` for "${transcript}"` : ""}
            </span>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 ml-2"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </AlertDescription>
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error || "Voice search failed. Please try again."}</span>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 ml-2"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </AlertDescription>
        </>
      )}
    </Alert>
  );
}
