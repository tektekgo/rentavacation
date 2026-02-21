import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TextChatButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}

export function TextChatButton({
  onClick,
  isOpen,
  disabled,
  disabledReason,
  className,
}: TextChatButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isOpen ? "default" : "outline"}
          size="icon"
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          className={cn(
            "shrink-0",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
          aria-label={disabled && disabledReason ? disabledReason : "Chat Search"}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabled && disabledReason ? disabledReason : "Chat Search"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
