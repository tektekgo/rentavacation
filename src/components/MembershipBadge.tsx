import { Badge } from "@/components/ui/badge";
import type { MembershipTier } from "@/types/database";

interface MembershipBadgeProps {
  tier: MembershipTier;
}

export function MembershipBadge({ tier }: MembershipBadgeProps) {
  const variant = getVariant(tier.tier_level);

  return (
    <Badge variant={variant} className={getClassName(tier.tier_level)}>
      {tier.tier_name}
    </Badge>
  );
}

function getVariant(level: number): "secondary" | "default" | "outline" {
  switch (level) {
    case 2:
      return "outline";
    case 1:
      return "default";
    default:
      return "secondary";
  }
}

function getClassName(level: number): string {
  switch (level) {
    case 2:
      return "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100";
    case 1:
      return "bg-blue-600 text-white hover:bg-blue-700";
    default:
      return "";
  }
}
