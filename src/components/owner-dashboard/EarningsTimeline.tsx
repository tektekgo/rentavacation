import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyEarning } from '@/types/ownerDashboard';

interface EarningsTimelineProps {
  data: MonthlyEarning[] | undefined;
  isLoading: boolean;
  annualMaintenanceFees: number | null;
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short' });
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-medium">{formatCurrency(payload[0].value)}</p>
      {payload[0].payload.booking_count > 0 && (
        <p className="text-xs text-muted-foreground">
          {payload[0].payload.booking_count} booking{payload[0].payload.booking_count > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export function EarningsTimeline({ data, isLoading, annualMaintenanceFees }: EarningsTimelineProps) {
  const [view, setView] = useState<'monthly' | 'quarterly'>('monthly');

  const chartData = (data || []).map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }));

  const quarterlyData = [];
  for (let i = 0; i < chartData.length; i += 3) {
    const chunk = chartData.slice(i, i + 3);
    quarterlyData.push({
      month: `Q${Math.floor(i / 3) + 1}`,
      earnings: chunk.reduce((s, c) => s + c.earnings, 0),
      booking_count: chunk.reduce((s, c) => s + c.booking_count, 0),
    });
  }

  const displayData = view === 'monthly' ? chartData : quarterlyData;
  const monthlyFee = annualMaintenanceFees ? annualMaintenanceFees / 12 : null;
  const quarterlyFee = annualMaintenanceFees ? annualMaintenanceFees / 4 : null;
  const refLineValue = view === 'monthly' ? monthlyFee : quarterlyFee;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">Earnings Timeline</CardTitle>
        <div className="flex gap-1">
          <Button
            variant={view === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={view === 'quarterly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('quarterly')}
          >
            Quarterly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} className="text-muted-foreground" />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                fill="url(#earningsGrad)"
                strokeWidth={2}
              />
              {refLineValue != null && refLineValue > 0 && (
                <ReferenceLine
                  y={refLineValue}
                  stroke="#f59e0b"
                  strokeDasharray="6 4"
                  label={{
                    value: `Fee target: ${formatCurrency(refLineValue)}/${view === 'monthly' ? 'mo' : 'qtr'}`,
                    position: 'insideTopRight',
                    fill: '#f59e0b',
                    fontSize: 11,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
