import { useMarketplaceHealth } from '@/hooks/executive';
import { SectionHeading } from './SectionHeading';
import { LiquidityGauge } from './LiquidityGauge';
import { SupplyDemandMap } from './SupplyDemandMap';
import { VoiceFunnel } from './VoiceFunnel';

export function MarketplaceHealth() {
  const { data, isLoading } = useMarketplaceHealth();

  if (isLoading) {
    return (
      <div>
        <SectionHeading title="Marketplace Health" subtitle="Proprietary metrics measuring platform efficiency" badge="RAV Proprietary" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-4" />
              <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeading
        title="Marketplace Health"
        subtitle="Proprietary metrics measuring platform efficiency"
        badge="RAV Proprietary"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <LiquidityGauge
          score={data?.liquidityScore || 0}
          components={data?.liquidityComponents || { bidAcceptanceRate: 0, avgTimeToBook: 0, activeListingRatio: 0, repeatBookingRate: 0 }}
        />
        <SupplyDemandMap destinations={data?.supplyDemand || []} />
        <VoiceFunnel
          data={data?.voiceFunnel || {
            voiceSearches: 0, voiceResultClicks: 0, voiceBookings: 0,
            traditionalSearches: 0, traditionalResultClicks: 0, traditionalBookings: 0,
          }}
        />
      </div>
    </div>
  );
}
