import type { CalculatorResult } from '@/lib/calculatorLogic';
import { BreakevenBar } from './BreakevenBar';

interface BreakevenResultsProps {
  result: CalculatorResult | null;
}

export function BreakevenResults({ result }: BreakevenResultsProps) {
  if (!result) {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground text-center">
          Enter your ownership details to see your earnings potential &rarr;
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border p-6 space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Your Earnings Potential</h2>

      {/* Weekly breakdown */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Estimated weekly earnings</span>
          <span className="text-2xl font-bold text-foreground">
            ${result.estimatedWeeklyIncome.toLocaleString()}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">RAV platform fee (10%)</span>
          <span className="text-muted-foreground">-${result.ravFeePerWeek.toLocaleString()}</span>
        </div>
        <div className="border-t pt-2 flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">Your net per week</span>
          <span className="text-lg font-bold text-emerald-600">
            ${result.netPerWeek.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Break-even */}
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm font-medium text-foreground">
          Break-even point: <span className="text-blue-600">{result.breakEvenWeeks.toFixed(1)} weeks</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          You need to rent {Math.ceil(result.breakEvenWeeks)} week{Math.ceil(result.breakEvenWeeks) > 1 ? 's' : ''} to cover your fees
        </p>
      </div>

      {/* Scenario bars */}
      <div className="space-y-5">
        {result.scenarios.map((scenario) => (
          <BreakevenBar key={scenario.weeks} scenario={scenario} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        * Estimates based on comparable RAV listings and published market data.
        Actual earnings vary by resort, season, and demand.
      </p>
    </div>
  );
}
