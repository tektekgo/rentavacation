import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useBusinessMetrics } from '@/hooks/executive';
import { SectionHeading } from './SectionHeading';
import { TooltipIcon } from './TooltipIcon';
import { formatCurrency, formatPercent } from './utils';

interface MetricCardProps {
  label: string;
  value: string;
  tooltip: { definition: string; whyItMatters: string };
  color?: string;
  subtext?: string;
}

function MetricCard({ label, value, tooltip, color = 'text-white', subtext }: MetricCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col">
      <div className="flex items-center gap-1 mb-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
        <TooltipIcon definition={tooltip.definition} whyItMatters={tooltip.whyItMatters} />
      </div>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
      {subtext && <span className="text-[10px] text-slate-500 mt-1">{subtext}</span>}
    </div>
  );
}

export function UnitEconomics() {
  const [showMethodology, setShowMethodology] = useState(false);
  const { data: business } = useBusinessMetrics();

  // Derive unit economics from business metrics
  const totalGmv = business?.totalGmv || 0;
  const platformRevenue = business?.platformRevenue || 0;
  const totalUsers = (business?.totalOwners || 0) + (business?.totalRenters || 0);
  const bookingCount = business?.monthlyData?.reduce((s, m) => s + m.bookings, 0) || 0;

  // Placeholder CAC — in real usage would come from marketing spend
  const cac = 45;
  const avgBookingValue = bookingCount > 0 ? totalGmv / bookingCount : 0;
  const revenuePerUser = totalUsers > 0 ? platformRevenue / totalUsers : 0;
  const ltv = revenuePerUser * 24; // 24-month projected LTV
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  const paybackMonths = revenuePerUser > 0 ? cac / revenuePerUser : 0;
  const takeRate = totalGmv > 0 ? (platformRevenue / totalGmv) * 100 : 15;

  // MoM growth from monthly data
  const monthlyData = business?.monthlyData || [];
  let momGrowth = 0;
  if (monthlyData.length >= 2) {
    const last = monthlyData[monthlyData.length - 1].gmv;
    const prev = monthlyData[monthlyData.length - 2].gmv;
    momGrowth = prev > 0 ? ((last - prev) / prev) * 100 : 0;
  }

  const ltvCacColor = ltvCacRatio >= 3 ? 'text-emerald-400' : ltvCacRatio >= 1 ? 'text-amber-400' : 'text-rose-400';

  const cards: MetricCardProps[] = [
    {
      label: 'CAC',
      value: formatCurrency(cac),
      tooltip: {
        definition: 'Customer Acquisition Cost — total marketing spend divided by new customers acquired.',
        whyItMatters: 'Lower CAC means more efficient growth. Target: <$50.',
      },
      subtext: 'Estimated',
    },
    {
      label: 'LTV',
      value: formatCurrency(ltv),
      tooltip: {
        definition: 'Lifetime Value — projected revenue per customer over 24 months.',
        whyItMatters: 'Must exceed CAC for sustainable business model.',
      },
      color: 'text-emerald-400',
    },
    {
      label: 'LTV:CAC',
      value: `${ltvCacRatio.toFixed(1)}x`,
      tooltip: {
        definition: 'LTV to CAC Ratio — how much revenue each dollar of acquisition spend generates.',
        whyItMatters: 'Industry benchmark is 3:1. Below 1:1 means losing money on acquisition.',
      },
      color: ltvCacColor,
    },
    {
      label: 'Payback',
      value: `${paybackMonths.toFixed(1)}mo`,
      tooltip: {
        definition: 'Payback Period — months to recover the cost of acquiring a customer.',
        whyItMatters: 'Shorter payback = faster reinvestment. Target: <12 months.',
      },
      color: paybackMonths <= 12 ? 'text-emerald-400' : 'text-amber-400',
    },
    {
      label: 'Avg Booking',
      value: formatCurrency(avgBookingValue),
      tooltip: {
        definition: 'Average Booking Value — total GMV divided by number of bookings.',
        whyItMatters: 'Higher ABV increases revenue per transaction and improves unit economics.',
      },
    },
    {
      label: 'Take Rate',
      value: formatPercent(takeRate),
      tooltip: {
        definition: 'Take Rate — platform commission as a percentage of GMV.',
        whyItMatters: 'Measures monetization efficiency. RAV default 15% take rate (admin-configurable).',
      },
      color: 'text-blue-400',
    },
    {
      label: 'MoM Growth',
      value: `${momGrowth >= 0 ? '+' : ''}${momGrowth.toFixed(1)}%`,
      tooltip: {
        definition: 'Month-over-Month GMV Growth — compares current month GMV to previous month.',
        whyItMatters: 'Consistent positive growth signals product-market fit.',
      },
      color: momGrowth > 0 ? 'text-emerald-400' : momGrowth < 0 ? 'text-rose-400' : 'text-slate-400',
    },
  ];

  return (
    <div>
      <SectionHeading title="Unit Economics" subtitle="Key financial metrics for investor evaluation" />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      {/* Expandable methodology */}
      <button
        onClick={() => setShowMethodology(!showMethodology)}
        className="flex items-center gap-1.5 mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {showMethodology ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Calculation methodology
      </button>
      {showMethodology && (
        <div className="mt-2 bg-slate-800/30 rounded-lg p-4 text-[11px] text-slate-400 space-y-1.5 border border-slate-700/30">
          <p><strong className="text-slate-300">CAC:</strong> Estimated at $45 (manual input; replace with actual marketing spend / new users)</p>
          <p><strong className="text-slate-300">LTV:</strong> (Platform Revenue / Total Users) x 24 months projected</p>
          <p><strong className="text-slate-300">LTV:CAC:</strong> LTV / CAC. Green at 3x+, amber at 1-3x, red below 1x</p>
          <p><strong className="text-slate-300">Payback:</strong> CAC / (Monthly Revenue Per User). Target &lt;12 months</p>
          <p><strong className="text-slate-300">Take Rate:</strong> Platform Revenue / GMV. RAV model: 15% commission (admin-configurable)</p>
          <p><strong className="text-slate-300">MoM Growth:</strong> (Current Month GMV - Previous Month GMV) / Previous Month GMV</p>
        </div>
      )}
    </div>
  );
}
