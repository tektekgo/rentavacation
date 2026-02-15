import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RoleUpgradeRequest, AppRole } from '@/types/database';

// Fetch user's own role upgrade requests
export function useMyRoleUpgradeRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['role-upgrade-requests', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('role_upgrade_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RoleUpgradeRequest[];
    },
    enabled: !!user,
  });
}

// Check if user has a pending request for a specific role
export function useHasPendingRequest(role: AppRole) {
  const { data: requests } = useMyRoleUpgradeRequests();
  return requests?.some((r) => r.requested_role === role && r.status === 'pending') ?? false;
}

// Get the latest request for a specific role
export function useLatestRequestForRole(role: AppRole) {
  const { data: requests } = useMyRoleUpgradeRequests();
  return requests?.find((r) => r.requested_role === role) ?? null;
}

// Request a role upgrade
export function useRequestRoleUpgrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, reason }: { role: AppRole; reason?: string }) => {
      const { data, error } = await (supabase.rpc as any)('request_role_upgrade', {
        _requested_role: role,
        _reason: reason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-upgrade-requests'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role upgrade request submitted!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit role upgrade request');
    },
  });
}

// Admin: Fetch all pending role upgrade requests
export function usePendingRoleUpgradeRequests() {
  return useQuery({
    queryKey: ['role-upgrade-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_upgrade_requests')
        .select('*, user:profiles!role_upgrade_requests_user_id_fkey(id, email, full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as (RoleUpgradeRequest & {
        user: { id: string; email: string; full_name: string | null };
      })[];
    },
  });
}

// Admin: Approve a role upgrade request
export function useApproveRoleUpgrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await (supabase.rpc as any)('approve_role_upgrade', {
        _request_id: requestId,
        _approved_by: user?.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-upgrade-requests'] });
      toast.success('Role upgrade approved!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve role upgrade');
    },
  });
}

// Admin: Reject a role upgrade request
export function useRejectRoleUpgrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { data, error } = await (supabase.rpc as any)('reject_role_upgrade', {
        _request_id: requestId,
        _rejected_by: user?.id,
        _reason: reason || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-upgrade-requests'] });
      toast.success('Role upgrade rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject role upgrade');
    },
  });
}
