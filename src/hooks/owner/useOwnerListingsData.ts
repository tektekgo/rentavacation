import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { OwnerListingRow } from '@/types/ownerDashboard';

export function useOwnerListingsData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-listings-data', user?.id],
    queryFn: async (): Promise<OwnerListingRow[]> => {
      // Get all listings for this owner with property info
      const { data: listings, error } = await supabase
        .from('listings')
        .select(`
          id, check_in_date, check_out_date, status, final_price, owner_price, nightly_rate,
          open_for_bidding,
          property:properties!inner(resort_name, location)
        `)
        .eq('owner_id', user!.id)
        .order('check_in_date', { ascending: true });

      if (error) throw error;
      if (!listings) return [];

      // Get bid counts for all listings
      const listingIds = listings.map((l: { id: string }) => l.id);
      const bidCounts: Record<string, { count: number; highest: number | null }> = {};

      if (listingIds.length > 0) {
        const { data: bids } = await supabase
          .from('listing_bids')
          .select('listing_id, bid_amount, status')
          .in('listing_id', listingIds)
          .eq('status', 'pending');

        if (bids) {
          for (const bid of bids) {
            const lid = bid.listing_id;
            if (!bidCounts[lid]) bidCounts[lid] = { count: 0, highest: null };
            bidCounts[lid].count++;
            if (!bidCounts[lid].highest || bid.bid_amount > bidCounts[lid].highest) {
              bidCounts[lid].highest = bid.bid_amount;
            }
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return listings.map((l: any) => {
        const today = new Date();
        const checkin = new Date(l.check_in_date);
        const daysUntil = Math.ceil((checkin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const bc = bidCounts[l.id] || { count: 0, highest: null };

        return {
          id: l.id,
          property_name: l.property?.location || 'Unknown',
          resort_name: l.property?.resort_name || 'Unknown Resort',
          check_in_date: l.check_in_date,
          check_out_date: l.check_out_date,
          status: l.status,
          final_price: l.final_price,
          owner_price: l.owner_price,
          nightly_rate: l.nightly_rate || 0,
          open_for_bidding: l.open_for_bidding || false,
          bid_count: bc.count,
          highest_bid: bc.highest,
          days_until_checkin: daysUntil,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
