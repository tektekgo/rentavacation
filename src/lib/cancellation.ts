import { CancellationPolicy } from "@/types/database";
import { differenceInDays } from "date-fns";

/**
 * Calculate the policy-based refund amount for a cancellation
 * This mirrors the database function calculate_policy_refund
 */
export function calculatePolicyRefund(
  totalAmount: number,
  policy: CancellationPolicy,
  daysUntilCheckin: number
): number {
  switch (policy) {
    case "flexible":
      // Full refund up to 24 hours before (1 day)
      return daysUntilCheckin >= 1 ? totalAmount : 0;

    case "moderate":
      // Full refund 5+ days, 50% for 1-4 days, 0 for <1 day
      if (daysUntilCheckin >= 5) return totalAmount;
      if (daysUntilCheckin >= 1) return totalAmount * 0.5;
      return 0;

    case "strict":
      // 50% refund 7+ days, nothing after
      return daysUntilCheckin >= 7 ? totalAmount * 0.5 : 0;

    case "super_strict":
      // No refunds
      return 0;

    default:
      return 0;
  }
}

/**
 * Calculate days until check-in from today
 */
export function getDaysUntilCheckin(checkInDate: string | Date): number {
  const checkIn = new Date(checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);
  return differenceInDays(checkIn, today);
}

/**
 * Get refund percentage description based on policy and timing
 */
export function getRefundDescription(
  policy: CancellationPolicy,
  daysUntilCheckin: number
): { percentage: number; description: string } {
  switch (policy) {
    case "flexible":
      if (daysUntilCheckin >= 1) {
        return { percentage: 100, description: "Full refund available" };
      }
      return { percentage: 0, description: "No refund - less than 24 hours before check-in" };

    case "moderate":
      if (daysUntilCheckin >= 5) {
        return { percentage: 100, description: "Full refund available (5+ days before)" };
      }
      if (daysUntilCheckin >= 1) {
        return { percentage: 50, description: "50% refund available (1-4 days before)" };
      }
      return { percentage: 0, description: "No refund - less than 24 hours before check-in" };

    case "strict":
      if (daysUntilCheckin >= 7) {
        return { percentage: 50, description: "50% refund available (7+ days before)" };
      }
      return { percentage: 0, description: "No refund - less than 7 days before check-in" };

    case "super_strict":
      return { percentage: 0, description: "This booking is non-refundable" };

    default:
      return { percentage: 0, description: "Refund policy not available" };
  }
}

/**
 * Estimate owner payout date (checkout + 5 days)
 */
export function estimatePayoutDate(checkOutDate: string | Date): Date {
  const checkout = new Date(checkOutDate);
  checkout.setDate(checkout.getDate() + 5);
  return checkout;
}
