import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Listing, Property, Resort, ResortUnitType } from '@/types/database';

export interface ListingWithDetails extends Listing {
  property: Property & {
    resort: Resort | null;
    unit_type: Resort | null;
  };
}

// Full type for listing with all joined data
export interface ActiveListing {
  id: string;
  property_id: string;
  owner_id: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  final_price: number;
  owner_price: number;
  rav_markup: number;
  nightly_rate: number;
  notes: string | null;
  cancellation_policy: string;
  open_for_bidding: boolean;
  bidding_ends_at: string | null;
  min_bid_amount: number | null;
  created_at: string;
  property: {
    id: string;
    owner_id: string;
    brand: string;
    resort_name: string;
    location: string;
    description: string | null;
    bedrooms: number;
    bathrooms: number;
    sleeps: number;
    amenities: string[];
    images: string[];
    resort_id: string | null;
    unit_type_id: string | null;
    resort: Resort | null;
    unit_type: ResortUnitType | null;
  };
}

// Fetch all active listings for the Rentals page
export function useActiveListings() {
  return useQuery({
    queryKey: ['listings', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          property:properties(
            *,
            resort:resorts(*),
            unit_type:resort_unit_types(*)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ActiveListing[];
    },
  });
}

// Fetch a single listing by ID for PropertyDetail page
export function useListing(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listings', 'detail', listingId],
    queryFn: async () => {
      if (!listingId) return null;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          property:properties(
            *,
            resort:resorts(*),
            unit_type:resort_unit_types(*)
          )
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;
      return data as ActiveListing;
    },
    enabled: !!listingId,
  });
}

// Get count of active listings (for voice search pre-check and empty states)
export function useActiveListingsCount() {
  return useQuery({
    queryKey: ['listings', 'active-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    },
  });
}
