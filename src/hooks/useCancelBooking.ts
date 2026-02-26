import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CancelBookingParams {
  bookingId: string;
  reason: string;
  cancelledBy: 'renter' | 'owner';
}

interface CancelBookingResult {
  success: boolean;
  refund_amount: number;
  refund_reference: string | null;
  policy: string;
  days_until_checkin: number;
  cancelled_by: string;
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason, cancelledBy }: CancelBookingParams) => {
      const { data, error } = await supabase.functions.invoke('process-cancellation', {
        body: { bookingId, reason, cancelledBy },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as CancelBookingResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
  });
}
