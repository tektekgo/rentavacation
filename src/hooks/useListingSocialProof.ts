import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface ListingSocialProof {
  favoritesCount: Map<string, number>;
  isLoading: boolean;
}

/**
 * Fetches aggregate social proof data for listings:
 * - Favorites count per listing (property_id in favorites = listing ID)
 */
export function useListingSocialProof(): ListingSocialProof {
  const { data: favoritesCount = new Map(), isLoading } = useQuery({
    queryKey: ["social-proof", "favorites-count"],
    queryFn: async () => {
      // Fetch all favorites grouped by property_id (which stores listing IDs)
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id");

      if (error) throw error;

      // Count occurrences per listing
      const counts = new Map<string, number>();
      for (const row of data || []) {
        const current = counts.get(row.property_id) || 0;
        counts.set(row.property_id, current + 1);
      }
      return counts;
    },
    staleTime: 60_000, // refresh every 60s
  });

  return { favoritesCount, isLoading };
}

/**
 * Returns how many days ago a date was (for "Added X days ago" text)
 */
export function getDaysAgo(dateString: string): number {
  const created = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a freshness label based on listing age
 */
export function getFreshnessLabel(createdAt: string): string | null {
  const days = getDaysAgo(createdAt);
  if (days <= 1) return "Just Listed";
  if (days <= 3) return "New";
  if (days <= 7) return "This Week";
  return null;
}

/**
 * Returns a popularity label based on favorites count
 */
export function getPopularityLabel(favCount: number): string | null {
  if (favCount >= 10) return "Very Popular";
  if (favCount >= 5) return "Popular";
  if (favCount >= 3) return "Trending";
  return null;
}
