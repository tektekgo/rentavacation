import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DemandSignalProps {
  destination: string;
  checkInDate: string;
  bedrooms: number;
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function DemandSignal({ destination, checkInDate, bedrooms }: DemandSignalProps) {
  const [count, setCount] = useState(0);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!destination || !checkInDate) {
      setCount(0);
      setMaxBudget(null);
      return;
    }

    // Extract city from destination (e.g., "Orlando, FL" → "Orlando")
    const city = destination.split(',')[0].trim();
    if (!city) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('travel_requests')
          .select('budget_max, budget_preference')
          .eq('status', 'open')
          .gt('proposals_deadline', new Date().toISOString())
          .ilike('destination_location', `%${city}%`)
          .gte('check_in_date', subtractDays(checkInDate, 30))
          .lte('check_in_date', addDays(checkInDate, 30))
          .lte('bedrooms_needed', bedrooms);

        const results = data ?? [];
        setCount(results.length);

        const disclosed = results
          .filter((r) => r.budget_preference !== 'undisclosed' && r.budget_max)
          .map((r) => r.budget_max as number);

        setMaxBudget(disclosed.length > 0 ? Math.max(...disclosed) : null);
      } catch {
        setCount(0);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [destination, checkInDate, bedrooms]);

  if (count === 0 || loading) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
      <TrendingUp className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium">
          {count} traveler{count > 1 ? 's' : ''} looking for this
        </p>
        <p className="text-xs mt-0.5 opacity-80">
          Active requests for {bedrooms}BR+ in {destination.split(',')[0].trim()} around your dates.
          {maxBudget != null && (
            <> Highest disclosed budget: ${maxBudget.toLocaleString()}/wk</>
          )}
        </p>
      </div>
    </div>
  );
}
