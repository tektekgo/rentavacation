import { differenceInDays, differenceInHours } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface AgeBadgeProps {
  date: string | Date;
  /** Days thresholds for warning (yellow) and critical (red). Default: { warning: 2, critical: 5 } */
  thresholds?: { warning: number; critical: number };
  /** Use hours instead of days (for short-lived items like pending confirmations) */
  useHours?: boolean;
}

export function AgeBadge({ date, thresholds = { warning: 2, critical: 5 }, useHours = false }: AgeBadgeProps) {
  const now = new Date();
  const created = new Date(date);

  if (useHours) {
    const hours = differenceInHours(now, created);
    const color =
      hours >= thresholds.critical * 24
        ? "text-red-700 border-red-300 bg-red-50"
        : hours >= thresholds.warning * 24
        ? "text-yellow-700 border-yellow-300 bg-yellow-50"
        : "text-green-700 border-green-300 bg-green-50";

    return (
      <Badge variant="outline" className={`text-xs gap-1 ${color}`}>
        <Clock className="h-3 w-3" />
        {hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d ${hours % 24}h`}
      </Badge>
    );
  }

  const days = differenceInDays(now, created);
  const color =
    days >= thresholds.critical
      ? "text-red-700 border-red-300 bg-red-50"
      : days >= thresholds.warning
      ? "text-yellow-700 border-yellow-300 bg-yellow-50"
      : "text-green-700 border-green-300 bg-green-50";

  return (
    <Badge variant="outline" className={`text-xs gap-1 ${color}`}>
      <Clock className="h-3 w-3" />
      {days === 0 ? "Today" : `${days}d`}
    </Badge>
  );
}
