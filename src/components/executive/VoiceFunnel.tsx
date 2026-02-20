import type { VoiceFunnelMetrics } from '@/types/executive';
import { TooltipIcon } from './TooltipIcon';
import { formatNumber } from './utils';

interface VoiceFunnelProps {
  data: VoiceFunnelMetrics;
}

interface FunnelRow {
  label: string;
  voiceValue: number;
  traditionalValue: number;
}

export function VoiceFunnel({ data }: VoiceFunnelProps) {
  const rows: FunnelRow[] = [
    {
      label: 'Searches',
      voiceValue: data.voiceSearches,
      traditionalValue: data.traditionalSearches,
    },
    {
      label: 'Result Clicks',
      voiceValue: data.voiceResultClicks,
      traditionalValue: data.traditionalResultClicks,
    },
    {
      label: 'Bookings',
      voiceValue: data.voiceBookings,
      traditionalValue: data.traditionalBookings,
    },
  ];

  const maxValue = Math.max(
    ...rows.flatMap((r) => [r.voiceValue, r.traditionalValue]),
    1
  );

  // Conversion rates
  const voiceConversion = data.voiceSearches > 0
    ? (data.voiceBookings / data.voiceSearches) * 100
    : 0;
  const traditionalConversion = data.traditionalSearches > 0
    ? (data.traditionalBookings / data.traditionalSearches) * 100
    : 0;
  const conversionMultiplier = traditionalConversion > 0
    ? voiceConversion / traditionalConversion
    : 0;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-white">Voice vs Traditional Funnel</h3>
        <TooltipIcon
          definition="Compares conversion rates between voice-assisted and traditional search-to-booking funnels."
          whyItMatters="Validates the ROI of RAV's voice search investment."
        />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[80px_1fr_1fr] gap-2 mb-3">
        <div />
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-slate-400 font-medium">Voice</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-slate-500" />
          <span className="text-[10px] text-slate-400 font-medium">Traditional</span>
        </div>
      </div>

      {/* Funnel rows */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
            <span className="text-[10px] text-slate-400">{row.label}</span>
            {/* Voice bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700/50 rounded-full h-3">
                <div
                  className="bg-cyan-400/80 h-3 rounded-full transition-all flex items-center justify-end pr-1.5"
                  style={{ width: `${Math.max((row.voiceValue / maxValue) * 100, 8)}%` }}
                >
                  <span className="text-[9px] font-medium text-white">
                    {formatNumber(row.voiceValue)}
                  </span>
                </div>
              </div>
            </div>
            {/* Traditional bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700/50 rounded-full h-3">
                <div
                  className="bg-slate-500/80 h-3 rounded-full transition-all flex items-center justify-end pr-1.5"
                  style={{ width: `${Math.max((row.traditionalValue / maxValue) * 100, 8)}%` }}
                >
                  <span className="text-[9px] font-medium text-white">
                    {formatNumber(row.traditionalValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion callout */}
      {conversionMultiplier > 1 && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-center gap-2">
          <span className="px-2.5 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-400 rounded-full border border-cyan-500/30">
            {conversionMultiplier.toFixed(1)}x conversion
          </span>
          <span className="text-[10px] text-slate-400">Voice outperforms traditional search</span>
        </div>
      )}
    </div>
  );
}
