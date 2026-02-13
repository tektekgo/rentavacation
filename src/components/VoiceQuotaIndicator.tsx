import { useVoiceQuota } from "@/hooks/useVoiceQuota";
import { Badge } from "@/components/ui/badge";
import { Mic, Infinity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function VoiceQuotaIndicator() {
  const { remaining, isUnlimited, loading } = useVoiceQuota();

  if (loading) {
    return <Skeleton className="h-5 w-32" />;
  }

  if (isUnlimited) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Infinity className="w-3 h-3 mr-1" />
        Unlimited searches
      </Badge>
    );
  }

  const variant =
    remaining === 0
      ? "destructive"
      : remaining <= 3
        ? "outline"
        : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      <Mic className="w-3 h-3 mr-1" />
      {remaining} {remaining === 1 ? "search" : "searches"} remaining today
    </Badge>
  );
}
