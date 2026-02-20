import { useBusinessMetrics, useMarketplaceHealth } from '@/hooks/executive';
import { TooltipIcon } from './TooltipIcon';
import { formatCurrency, formatPercent, formatNumber } from './utils';

interface KpiPillProps {
  label: string;
  value: string;
  tooltip: { definition: string; whyItMatters: string };
  color: string;
}

function KpiPill({ label, value, tooltip, color }: KpiPillProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
          {label}
        </span>
        <TooltipIcon definition={tooltip.definition} whyItMatters={tooltip.whyItMatters} />
      </div>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 min-w-[140px]">
      <div className="h-3 w-16 bg-slate-700 rounded animate-pulse" />
      <div className="h-6 w-20 bg-slate-700 rounded animate-pulse mt-1" />
    </div>
  );
}

export function HeadlineBar() {
  const { data: business, isLoading: bizLoading } = useBusinessMetrics();
  const { data: health, isLoading: healthLoading } = useMarketplaceHealth();

  const isLoading = bizLoading || healthLoading;

  if (isLoading) {
    return (
      <div className="sticky top-16 md:top-20 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="flex items-center justify-center gap-6 py-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const pills: KpiPillProps[] = [
    {
      label: 'GMV',
      value: formatCurrency(business?.totalGmv || 0),
      color: 'text-emerald-400',
      tooltip: {
        definition: 'Gross Merchandise Value — total dollar value of all confirmed bookings on the platform.',
        whyItMatters: 'Measures total economic activity flowing through RAV.',
      },
    },
    {
      label: 'Revenue',
      value: formatCurrency(business?.platformRevenue || 0),
      color: 'text-blue-400',
      tooltip: {
        definition: 'Platform Revenue — RAV\'s 10% commission on all confirmed bookings.',
        whyItMatters: 'Direct measure of RAV\'s top-line earnings.',
      },
    },
    {
      label: 'Listings',
      value: formatNumber(business?.activeListings || 0),
      color: 'text-violet-400',
      tooltip: {
        definition: 'Active Listings — properties currently available for booking on the marketplace.',
        whyItMatters: 'Supply-side health indicator. More listings = more choice for travelers.',
      },
    },
    {
      label: 'Liquidity',
      value: `${health?.liquidityScore || 0}`,
      color: (health?.liquidityScore || 0) >= 70 ? 'text-emerald-400' : (health?.liquidityScore || 0) >= 40 ? 'text-amber-400' : 'text-rose-400',
      tooltip: {
        definition: 'RAV Liquidity Score — proprietary 0-100 composite: bid acceptance (30%), time-to-book (25%), active ratio (25%), repeat rate (20%).',
        whyItMatters: 'Measures marketplace efficiency. Higher = healthier market dynamics.',
      },
    },
    {
      label: 'Voice',
      value: formatPercent((health?.voiceAdoptionRate || 0) * 100),
      color: 'text-cyan-400',
      tooltip: {
        definition: 'Voice Adoption Rate — percentage of total search activity driven by voice assistant.',
        whyItMatters: 'Tracks adoption of RAV\'s AI voice search, a key competitive differentiator.',
      },
    },
  ];

  return (
    <div className="sticky top-16 md:top-20 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
      <div className="flex items-center justify-center gap-2 md:gap-6 py-1 overflow-x-auto">
        {pills.map((pill) => (
          <KpiPill key={pill.label} {...pill} />
        ))}
      </div>
    </div>
  );
}
