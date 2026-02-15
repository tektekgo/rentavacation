import { Skeleton } from "@/components/ui/skeleton";
import { MembershipTierCard } from "@/components/MembershipTierCard";
import { MembershipBadge } from "@/components/MembershipBadge";
import { useMyMembership, useTravelerTiers, useOwnerTiers } from "@/hooks/useMembership";
import { useAuth } from "@/hooks/useAuth";
import type { MembershipTier } from "@/types/database";

interface MembershipPlansProps {
  category?: "traveler" | "owner";
}

export function MembershipPlans({ category }: MembershipPlansProps) {
  const { isPropertyOwner } = useAuth();
  const resolvedCategory = category ?? (isPropertyOwner() ? "owner" : "traveler");

  const { data: travelerTiers, isLoading: loadingTraveler } = useTravelerTiers();
  const { data: ownerTiers, isLoading: loadingOwner } = useOwnerTiers();
  const { data: membership, isLoading: loadingMembership } = useMyMembership();

  const tiers: MembershipTier[] =
    resolvedCategory === "owner" ? ownerTiers || [] : travelerTiers || [];
  const isLoading =
    resolvedCategory === "owner" ? loadingOwner : loadingTraveler;

  if (isLoading || loadingMembership) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan summary */}
      {membership && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Your current plan:</span>
          <MembershipBadge tier={membership.tier} />
        </div>
      )}

      {/* Tier cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <MembershipTierCard
            key={tier.id}
            tier={tier}
            isCurrent={membership?.tier_id === tier.id}
            highlighted={tier.tier_level === 1}
          />
        ))}
      </div>
    </div>
  );
}
