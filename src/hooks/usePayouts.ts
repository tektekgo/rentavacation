import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface PayoutRecord {
  id: string;
  listing_id: string;
  status: string;
  owner_payout: number;
  payout_status: string | null;
  payout_amount: number | null;
  payout_date: string | null;
  payout_reference: string | null;
  created_at: string;
  listing: {
    check_in_date: string;
    check_out_date: string;
    property: {
      resort_name: string;
      location: string;
    };
  };
  renter: {
    full_name: string | null;
    email: string;
  };
}

// Owner: fetch payout history from their bookings
export function useOwnerPayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payouts', 'owner', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get owner's listing IDs
      const { data: ownerListings, error: listError } = await supabase
        .from('listings')
        .select('id')
        .eq('owner_id', user.id);

      if (listError) throw listError;
      const listingIds = (ownerListings || []).map((l: { id: string }) => l.id);

      if (listingIds.length === 0) return [];

      // Get bookings for those listings
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, listing_id, status, owner_payout,
          payout_status, payout_amount, payout_date, payout_reference,
          created_at,
          listing:listings(
            check_in_date, check_out_date,
            property:properties(resort_name, location)
          ),
          renter:profiles(full_name, email)
        `)
        .in('listing_id', listingIds)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PayoutRecord[];
    },
    enabled: !!user,
  });
}

// Admin: mark a payout as processed
export function useMarkPayoutProcessed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      payoutReference,
      payoutAmount,
    }: {
      bookingId: string;
      payoutReference: string;
      payoutAmount: number;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('bookings')
        .update({
          payout_status: 'processed',
          payout_amount: payoutAmount,
          payout_date: new Date().toISOString(),
          payout_reference: payoutReference,
        })
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}

// Owner: get Stripe Connect account status
export function useStripeConnectStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['stripe-connect-status', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// Owner: create or resume Stripe Connect onboarding
export function useCreateConnectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnUrl }: { returnUrl?: string } = {}) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('create-connect-account', {
        body: { returnUrl },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as { success: boolean; url?: string; account_id: string; already_complete?: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-connect-status'] });
    },
  });
}

// Admin: initiate Stripe Connect payout for a booking
export function useInitiateStripePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId }: { bookingId: string }) => {
      const response = await supabase.functions.invoke('create-stripe-payout', {
        body: { bookingId },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as { success: boolean; transfer_id: string; amount: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}

// Payout stats for the owner
export function useOwnerPayoutStats() {
  const { data: payouts = [], isLoading } = useOwnerPayouts();

  const pendingAmount = payouts
    .filter((p) => p.status === 'confirmed' && p.payout_status !== 'processed')
    .reduce((sum, p) => sum + (p.owner_payout || 0), 0);

  const processedAmount = payouts
    .filter((p) => p.payout_status === 'processed')
    .reduce((sum, p) => sum + (p.payout_amount || p.owner_payout || 0), 0);

  const completedCount = payouts.filter((p) => p.payout_status === 'processed').length;
  const pendingCount = payouts.filter(
    (p) => p.status === 'confirmed' && p.payout_status !== 'processed'
  ).length;

  return {
    pendingAmount,
    processedAmount,
    completedCount,
    pendingCount,
    isLoading,
  };
}
