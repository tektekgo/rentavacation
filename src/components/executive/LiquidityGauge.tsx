import { TooltipIcon } from './TooltipIcon';
import { formatPercent } from './utils';

interface LiquidityGaugeProps {
  score: number;
  components: {
    bidAcceptanceRate: number;
    avgTimeToBook: number;
    activeListingRatio: number;
    repeatBookingRate: number;
  };
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#10b981'; // emerald
  if (score >= 40) return '#f59e0b'; // amber
  return '#f43f5e'; // rose
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Healthy';
  if (score >= 40) return 'Moderate';
  return 'Low';
}

export function LiquidityGauge({ score, components }: LiquidityGaugeProps) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  // SVG semicircular gauge
  const radius = 80;
  const cx = 100;
  const cy = 95;
  const startAngle = Math.PI; // 180 degrees (left)
  const endAngle = 0; // 0 degrees (right)
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  // Arc path
  const arcPath = (start: number, end: number) => {
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy - radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy - radius * Math.sin(end);
    const largeArc = start - end > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle endpoint
  const needleX = cx + (radius - 10) * Math.cos(scoreAngle);
  const needleY = cy - (radius - 10) * Math.sin(scoreAngle);

  const componentPills = [
    { label: 'Bid Accept', value: formatPercent(components.bidAcceptanceRate * 100), weight: '30%' },
    { label: 'Time-to-Book', value: `${components.avgTimeToBook}d`, weight: '25%' },
    { label: 'Active Ratio', value: formatPercent(components.activeListingRatio * 100), weight: '25%' },
    { label: 'Repeat Rate', value: formatPercent(components.repeatBookingRate * 100), weight: '20%' },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-white">Liquidity Score</h3>
        <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
          RAV Proprietary
        </span>
        <TooltipIcon
          definition="Composite 0-100 score measuring marketplace liquidity: bid acceptance rate (30%), time-to-book (25%), active listing ratio (25%), repeat booking rate (20%)."
          whyItMatters="A high Liquidity Score signals efficient price discovery and healthy supply-demand matching."
        />
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 200 120" className="w-48 h-auto">
          {/* Background arc — 3 color zones */}
          <path d={arcPath(startAngle, startAngle - Math.PI * 0.4)} fill="none" stroke="#f43f5e" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          <path d={arcPath(startAngle - Math.PI * 0.4, startAngle - Math.PI * 0.7)} fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" opacity="0.3" />
          <path d={arcPath(startAngle - Math.PI * 0.7, endAngle)} fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" opacity="0.3" />

          {/* Filled arc up to score */}
          <path d={arcPath(startAngle, scoreAngle)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />

          {/* Needle */}
          <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="4" fill={color} />

          {/* Score text */}
          <text x={cx} y={cy + 20} textAnchor="middle" className="text-2xl font-bold" fill={color} fontSize="24">
            {score}
          </text>
          <text x={cx} y={cy + 34} textAnchor="middle" fill="#94a3b8" fontSize="10">
            {label}
          </text>
        </svg>
      </div>

      {/* Component breakdown */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {componentPills.map((c) => (
          <div
            key={c.label}
            className="flex items-center justify-between px-2.5 py-1.5 bg-slate-700/30 rounded-lg"
          >
            <span className="text-[10px] text-slate-400">{c.label} ({c.weight})</span>
            <span className="text-xs font-medium text-slate-200">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
