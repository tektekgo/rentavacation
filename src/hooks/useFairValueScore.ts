import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FairValueResult {
  tier: 'below_market' | 'fair_value' | 'above_market' | 'insufficient_data';
  range_low?: number;
  range_high?: number;
  avg_accepted_bid?: number;
  comparable_count: number;
  listing_price?: number;
}

export function useFairValueScore(listingId: string | undefined) {
  return useQuery({
    queryKey: ['fair-value-score', listingId],
    queryFn: async (): Promise<FairValueResult> => {
      const { data, error } = await supabase
        .rpc('calculate_fair_value_score', { p_listing_id: listingId });

      if (error) throw error;
      return data as FairValueResult;
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
