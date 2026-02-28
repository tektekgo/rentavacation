import type { ActiveListing } from "@/hooks/useListings";

export type SortOption = "newest" | "price_asc" | "price_desc" | "checkin" | "rating";

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  checkin: "Check-in: Soonest",
  rating: "Highest Rated",
};

export function sortListings(listings: ActiveListing[], sortBy: SortOption): ActiveListing[] {
  const sorted = [...listings];
  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "price_asc":
      return sorted.sort((a, b) => a.final_price - b.final_price);
    case "price_desc":
      return sorted.sort((a, b) => b.final_price - a.final_price);
    case "checkin":
      return sorted.sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime());
    case "rating":
      return sorted.sort((a, b) => {
        const rA = a.property?.resort?.guest_rating ?? 0;
        const rB = b.property?.resort?.guest_rating ?? 0;
        return rB - rA;
      });
    default:
      return sorted;
  }
}
