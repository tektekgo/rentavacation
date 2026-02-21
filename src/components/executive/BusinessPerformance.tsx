import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useBusinessMetrics } from '@/hooks/executive';
import { SectionHeading } from './SectionHeading';
import { TooltipIcon } from './TooltipIcon';
import { CHART_COLORS, DARK_CHART_THEME, formatCurrency } from './utils';

function ChartSkeleton() {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <div className="h-4 w-32 bg-slate-700 rounded animate-pulse mb-4" />
      <div className="h-48 bg-slate-700/30 rounded animate-pulse" />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function BusinessPerformance() {
  const { data, isLoading } = useBusinessMetrics();

  if (isLoading) {
    return (
      <div>
        <SectionHeading title="Business Performance" subtitle="Revenue, bookings, and bid activity" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const monthlyData = data?.monthlyData || [];
  const bidActivity = data?.bidActivity || [];
  const bidSpread = data?.bidSpread || [];
  const revenueWaterfall = data?.revenueWaterfall || [];

  return (
    <div>
      <SectionHeading title="Business Performance" subtitle="Revenue, bookings, and bid activity" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* GMV Trend — 2 col span */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 xl:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center">
            GMV Trend
            <TooltipIcon
              definition="Gross Merchandise Value — total booking revenue flowing through the platform before fees."
              whyItMatters="Tracks top-line growth and seasonal demand patterns over 6 months."
            />
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={DARK_CHART_THEME.grid} />
              <XAxis dataKey="month" tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} />
              <YAxis tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: DARK_CHART_THEME.axis }} />
              <Area type="monotone" dataKey="gmv" name="GMV" stroke={CHART_COLORS.blue} fill="url(#gmvGrad)" />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.emerald} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bid Activity — 1 col */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center">
            Bid Activity
            <TooltipIcon
              definition="Monthly count of bids placed by travelers vs. bids accepted by owners."
              whyItMatters="A rising accepted-to-placed ratio indicates healthy marketplace matching."
            />
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bidActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke={DARK_CHART_THEME.grid} />
              <XAxis dataKey="month" tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} />
              <YAxis tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: DARK_CHART_THEME.axis }} />
              <Line type="monotone" dataKey="bidsPlaced" name="Placed" stroke={CHART_COLORS.violet} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="bidsAccepted" name="Accepted" stroke={CHART_COLORS.emerald} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bid Spread Index — 1 col */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center">
              Bid Spread Index
              <TooltipIcon
                definition="Percentage gap between bid amounts and final booking prices, shown as average and median."
                whyItMatters="A narrowing spread means buyers and sellers are converging on price — sign of an efficient marketplace."
              />
            </h3>
            <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
              RAV Proprietary
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bidSpread}>
              <CartesianGrid strokeDasharray="3 3" stroke={DARK_CHART_THEME.grid} />
              <XAxis dataKey="month" tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} />
              <YAxis tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} unit="%" />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="avgSpread" name="Avg Spread" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="medianSpread" name="Median" fill={CHART_COLORS.slate} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Waterfall — 2 col span */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 xl:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center">
            Revenue Waterfall
            <TooltipIcon
              definition="Stacked breakdown of total revenue into owner payouts and RAV platform commission each month."
              whyItMatters="Shows how GMV splits between owners and the platform, and whether take-rate is stable."
            />
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueWaterfall}>
              <CartesianGrid strokeDasharray="3 3" stroke={DARK_CHART_THEME.grid} />
              <XAxis dataKey="month" tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} />
              <YAxis tick={{ fill: DARK_CHART_THEME.axis, fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: DARK_CHART_THEME.axis }} />
              <Bar dataKey="ownerPayout" name="Owner Payout" stackId="a" fill={CHART_COLORS.blue} />
              <Bar dataKey="commission" name="RAV Commission" stackId="a" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pad remaining 2 cols with the waterfall's span */}
      </div>
    </div>
  );
}
