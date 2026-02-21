import { Check } from 'lucide-react';
import type { WeekScenario } from '@/lib/calculatorLogic';

interface BreakevenBarProps {
  scenario: WeekScenario;
}

function getBarColor(percent: number) {
  if (percent >= 100) return 'bg-emerald-500';
  if (percent >= 75) return 'bg-amber-400';
  return 'bg-red-400';
}

export function BreakevenBar({ scenario }: BreakevenBarProps) {
  const { weeks, coveragePercent, netProfit } = scenario;
  const barWidth = Math.min(coveragePercent, 100);
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {weeks} week{weeks > 1 ? 's' : ''} listed
        </span>
        <span className="text-muted-foreground">
          ${scenario.netIncome.toLocaleString()} net
        </span>
      </div>

      <div className="bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(coveragePercent)}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="text-sm">
        {isProfit ? (
          <span className="text-emerald-600 font-semibold flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            Fees fully covered! +${netProfit.toLocaleString()} net profit
          </span>
        ) : (
          <span className="text-red-500">
            Covers {Math.round(coveragePercent)}% of your maintenance fees
          </span>
        )}
      </div>
    </div>
  );
}
