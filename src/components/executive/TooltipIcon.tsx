import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipIconProps {
  definition: string;
  whyItMatters?: string;
}

export function TooltipIcon({ definition, whyItMatters }: TooltipIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center ml-1 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="More info"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-slate-800 border-slate-600 text-slate-200 p-3"
      >
        <p className="text-xs leading-relaxed">{definition}</p>
        {whyItMatters && (
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Why it matters: {whyItMatters}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
