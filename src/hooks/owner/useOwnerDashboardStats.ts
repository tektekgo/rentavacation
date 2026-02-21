import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { OwnerDashboardStats } from '@/types/ownerDashboard';

export function useOwnerDashboardStats() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['owner-dashboard-stats', user?.id],
    queryFn: async (): Promise<OwnerDashboardStats> => {
      const { data, error } = await supabase
        .rpc('get_owner_dashboard_stats', { p_owner_id: user!.id });

      if (error) throw error;
      return data as OwnerDashboardStats;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return query;
}

export function useUpdateMaintenanceFees() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fees: number) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          annual_maintenance_fees: fees,
          maintenance_fee_updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-dashboard-stats'] });
    },
  });
}
