import type { SupplyDemandDestination } from '@/types/executive';

interface SupplyDemandMapProps {
  destinations: SupplyDemandDestination[];
}

function getIntensityColor(ratio: number): { bg: string; text: string; label: string } {
  if (ratio > 1.5) return { bg: 'bg-rose-500/30', text: 'text-rose-400', label: 'Undersupplied' };
  if (ratio > 1.0) return { bg: 'bg-amber-500/30', text: 'text-amber-400', label: 'Tight' };
  if (ratio > 0.7) return { bg: 'bg-emerald-500/30', text: 'text-emerald-400', label: 'Balanced' };
  return { bg: 'bg-blue-500/30', text: 'text-blue-400', label: 'Oversupplied' };
}

export function SupplyDemandMap({ destinations }: SupplyDemandMapProps) {
  if (!destinations.length) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-medium text-white mb-4">Supply / Demand</h3>
        <p className="text-xs text-slate-500">No destination data available.</p>
      </div>
    );
  }

  const maxValue = Math.max(
    ...destinations.flatMap((d) => [d.supply, d.demand]),
    1
  );

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <h3 className="text-sm font-medium text-white mb-4">Supply / Demand by Destination</h3>

      <div className="space-y-3">
        {destinations.map((dest) => {
          const intensity = getIntensityColor(dest.ratio);
          const supplyPct = (dest.supply / maxValue) * 100;
          const demandPct = (dest.demand / maxValue) * 100;

          return (
            <div key={dest.destination} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">{dest.destination}</span>
                <span className={`text-[10px] font-medium ${intensity.text} px-1.5 py-0.5 rounded ${intensity.bg}`}>
                  {intensity.label}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12">Supply</span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                    <div
                      className="bg-blue-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${supplyPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-6 text-right">{dest.supply}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-12">Demand</span>
                  <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                    <div
                      className="bg-rose-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${demandPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-6 text-right">{dest.demand}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-slate-400">Supply (active listings)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="text-[10px] text-slate-400">Demand (bookings + bids)</span>
        </div>
      </div>
    </div>
  );
}
