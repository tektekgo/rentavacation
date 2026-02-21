import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAirDNAData, useSTRData, useIntegrationSettings } from '@/hooks/executive';
import { SectionHeading } from './SectionHeading';
import { BYOKCard } from './BYOKCard';
import { TooltipIcon } from './TooltipIcon';
import { CHART_COLORS, DARK_CHART_THEME, formatCurrency, formatPercent } from './utils';

interface MarketIntelligenceProps {
  onOpenSettings: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: ${entry.value}
        </p>
      ))}
    </div>
  );
}

export function MarketIntelligence({ onOpenSettings }: MarketIntelligenceProps) {
  const { data: settings } = useIntegrationSettings();
  const { data: airdna, isLoading: airdnaLoading } = useAirDNAData(settings?.airdnaApiKey);
  const { data: str, isLoading: strLoading } = useSTRData(settings?.strApiKey);

  const isLoading = airdnaLoading || strLoading;

  if (isLoading) {
    return (
      <div>
        <SectionHeading title="Market Intelligence" subtitle="Third-party benchmarks & competitive positioning" />
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

  const airdnaDestinations = airdna?.destinations || [];
  const strMetrics = str?.metrics || [];

  return (
    <div>
      <SectionHeading title="Market Intelligence" subtitle="Third-party benchmarks & competitive positioning" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* AirDNA Comparison */}
        <BYOKCard
          title="AirDNA Market Comparison"
          provider="AirDNA"
          isDemo={airdna?.isDemo ?? true}
          onConnect={onOpenSettings}
          titleExtra={<TooltipIcon definition="Compares RAV listing prices against AirDNA market averages by destination. Shows how competitively RAV properties are priced." whyItMatters="Validates RAV's value proposition — renters get below-market rates while owners still earn more than traditional timeshare exchanges." />}
        >
          {airdnaDestinations.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={airdnaDestinations}>
                <CartesianGrid strokeDasharray="3 3" stroke={DARK_CHART_THEME.grid} />
                <XAxis
                  dataKey="destination"
                  tick={{ fill: DARK_CHART_THEME.axis, fontSize: 9 }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: DARK_CHART_THEME.axis }} />
                <Bar dataKey="marketAvgPrice" name="Market Avg" fill={CHART_COLORS.slate} radius={[2, 2, 0, 0]} />
                <Bar dataKey="ravAvgPrice" name="RAV Price" fill={CHART_COLORS.emerald} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">No data available</p>
          )}
        </BYOKCard>

        {/* STR Benchmarks */}
        <BYOKCard
          title="STR Global Benchmarks"
          provider="STR Global"
          isDemo={str?.isDemo ?? true}
          onConnect={onOpenSettings}
          titleExtra={<TooltipIcon definition="Industry-standard hospitality metrics from STR Global — occupancy rates, ADR (Average Daily Rate), and RevPAR (Revenue Per Available Room) compared to market averages." whyItMatters="Benchmarks RAV performance against the broader vacation rental industry to identify competitive advantages and areas for improvement." />}
        >
          {strMetrics.length > 0 ? (
            <div className="space-y-3">
              {strMetrics.map((metric) => {
                const ravBetter = metric.unit === '%'
                  ? metric.ravValue > metric.marketValue
                  : metric.ravValue < metric.marketValue;
                return (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-slate-400">RAV</span>
                          <span className={`text-xs font-medium ${ravBetter ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {metric.unit === '$' ? formatCurrency(metric.ravValue) : formatPercent(metric.ravValue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">Market</span>
                          <span className="text-xs text-slate-400">
                            {metric.unit === '$' ? formatCurrency(metric.marketValue) : formatPercent(metric.marketValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">No data available</p>
          )}
        </BYOKCard>

        {/* Pricing Position (own data) */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center">
            RAV Pricing Position
            <TooltipIcon definition="Shows how RAV listing prices compare to market rates by destination. Negative percentages indicate RAV is priced below market — a key selling point for renters." whyItMatters="Demonstrates the dual value proposition: renters save money vs. market rates, owners earn more than through traditional timeshare exchange programs." />
          </h3>
          <div className="space-y-4">
            {airdnaDestinations.slice(0, 4).map((dest) => {
              const discount = dest.marketAvgPrice > 0
                ? ((dest.marketAvgPrice - dest.ravAvgPrice) / dest.marketAvgPrice) * 100
                : 0;
              return (
                <div key={dest.destination} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{dest.destination}</span>
                    <span className={`text-xs font-medium ${discount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {discount > 0 ? '-' : '+'}{Math.abs(discount).toFixed(0)}% vs market
                    </span>
                  </div>
                  <div className="bg-slate-700/50 rounded-full h-1.5">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((dest.ravAvgPrice / dest.marketAvgPrice) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {airdnaDestinations.length === 0 && (
              <p className="text-xs text-slate-500 py-8 text-center">Connect AirDNA to see pricing comparison</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
