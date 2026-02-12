import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VoiceStatus } from "@/types/voice";

interface VoiceSearchButtonProps {
  status: VoiceStatus;
  isCallActive: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export function VoiceSearchButton({
  status,
  isCallActive,
  onStart,
  onStop,
  className,
}: VoiceSearchButtonProps) {
  const isProcessing = status === "processing";

  // Active call state — show stop button
  if (isCallActive) {
    return (
      <Button
        variant="destructive"
        size="icon"
        onClick={onStop}
        disabled={isProcessing}
        className={cn("relative shrink-0", className)}
        aria-label={isProcessing ? "Processing search" : "Stop voice search"}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MicOff className="h-4 w-4" />
        )}
        {/* Pulsing recording indicator */}
        {status === "listening" && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive-foreground/80 animate-ping" />
        )}
      </Button>
    );
  }

  // Idle state — show start button with tooltip
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={onStart}
          className={cn("shrink-0", className)}
          aria-label="Voice Search"
        >
          <Mic className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Voice Search</p>
      </TooltipContent>
    </Tooltip>
  );
}
