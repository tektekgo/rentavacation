import { useVoiceQuota } from "@/hooks/useVoiceQuota";
import { Badge } from "@/components/ui/badge";
import { Mic, Infinity as InfinityIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function VoiceQuotaIndicator() {
  const { remaining, dailyLimit, isUnlimited, loading } = useVoiceQuota();

  if (loading) {
    return <Skeleton className="h-5 w-32" />;
  }

  if (isUnlimited) {
    return (
      <Badge variant="secondary" className="text-xs">
        <InfinityIcon className="w-3 h-3 mr-1" />
        Unlimited searches
      </Badge>
    );
  }

  if (remaining === 0) {
    return (
      <Badge variant="destructive" className="text-xs">
        <Mic className="w-3 h-3 mr-1" />
        Daily limit reached
      </Badge>
    );
  }

  const variant = remaining <= 2 ? "outline" : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      <Mic className="w-3 h-3 mr-1" />
      {remaining} of {dailyLimit} {remaining === 1 ? "search" : "searches"} remaining today
    </Badge>
  );
}
