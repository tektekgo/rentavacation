import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Review {
  id: string;
  booking_id: string;
  listing_id: string;
  property_id: string;
  reviewer_id: string;
  owner_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  rating_cleanliness: number | null;
  rating_accuracy: number | null;
  rating_communication: number | null;
  rating_location: number | null;
  rating_value: number | null;
  owner_response: string | null;
  owner_responded_at: string | null;
  is_published: boolean;
  created_at: string;
  reviewer?: { full_name: string | null };
}

export interface ReviewSummary {
  avg_rating: number | null;
  review_count: number;
  avg_cleanliness: number | null;
  avg_accuracy: number | null;
  avg_communication: number | null;
  avg_location: number | null;
  avg_value: number | null;
}

export function usePropertyReviews(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name)")
        .eq("property_id", propertyId!)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!propertyId,
  });
}

export function usePropertyReviewSummary(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "summary", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_property_review_summary", {
        p_property_id: propertyId!,
      });
      if (error) throw error;
      return (data as ReviewSummary[])?.[0] || null;
    },
    enabled: !!propertyId,
  });
}

export function useBookingReview(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      booking_id: string;
      listing_id: string;
      property_id: string;
      reviewer_id: string;
      owner_id: string;
      rating: number;
      title?: string;
      body?: string;
      rating_cleanliness?: number;
      rating_accuracy?: number;
      rating_communication?: number;
      rating_location?: number;
      rating_value?: number;
    }) => {
      const { data, error } = await supabase.from("reviews").insert(review).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
