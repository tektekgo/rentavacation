import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface PortfolioProperty {
  property_id: string;
  resort_name: string;
  location: string;
  brand: string;
  listing_count: number;
  active_listing_count: number;
  total_revenue: number;
  total_bookings: number;
  avg_nightly_rate: number;
}

export function useOwnerPortfolio() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["owner-portfolio", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_owner_portfolio_summary",
        {
          p_owner_id: user!.id,
        }
      );
      if (error) throw error;
      return data as PortfolioProperty[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export interface PropertyCalendarListing {
  id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  nightly_rate: number;
  final_price: number;
}

export function usePropertyCalendar(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["property-calendar", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, check_in_date, check_out_date, status, nightly_rate, final_price"
        )
        .eq("property_id", propertyId!)
        .order("check_in_date", { ascending: true });
      if (error) throw error;
      return data as PropertyCalendarListing[];
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });
}
