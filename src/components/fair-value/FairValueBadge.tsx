import type { FairValueResult } from '@/hooks/useFairValueScore';

interface FairValueBadgeProps {
  tier: FairValueResult['tier'] | undefined;
  isLoading?: boolean;
}

const TIER_CONFIG = {
  below_market: {
    label: 'Great Deal',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  fair_value: {
    label: 'Fair Price',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  above_market: {
    label: 'Above Market',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 border-red-300',
  },
} as const;

export function FairValueBadge({ tier, isLoading }: FairValueBadgeProps) {
  if (isLoading) {
    return (
      <span className="inline-block h-5 w-20 bg-muted rounded-full animate-pulse" />
    );
  }

  if (!tier || tier === 'insufficient_data') return null;

  const config = TIER_CONFIG[tier];

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${config.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
