import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { MonthlyEarning } from '@/types/ownerDashboard';

function fillMissingMonths(data: MonthlyEarning[]): MonthlyEarning[] {
  const result: MonthlyEarning[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = d.toISOString().slice(0, 10);
    const existing = data.find(
      (e) => new Date(e.month).getFullYear() === d.getFullYear() &&
             new Date(e.month).getMonth() === d.getMonth()
    );
    result.push(existing ?? { month: monthStr, earnings: 0, booking_count: 0 });
  }

  return result;
}

export function useOwnerEarnings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-monthly-earnings', user?.id],
    queryFn: async (): Promise<MonthlyEarning[]> => {
      const { data, error } = await supabase
        .rpc('get_owner_monthly_earnings', { p_owner_id: user!.id });

      if (error) throw error;
      return fillMissingMonths((data as MonthlyEarning[]) || []);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export { fillMissingMonths };
