import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, DollarSign } from "lucide-react";
import { useCancelBooking } from "@/hooks/useCancelBooking";
import { useToast } from "@/hooks/use-toast";
import {
  calculatePolicyRefund,
  getDaysUntilCheckin,
  getRefundDescription,
} from "@/lib/cancellation";
import {
  CANCELLATION_POLICY_LABELS,
  type CancellationPolicy,
} from "@/types/database";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  totalAmount: number;
  checkInDate: string;
  cancellationPolicy: CancellationPolicy;
  cancelledBy: "renter" | "owner";
  onCancelled?: () => void;
}

const CancelBookingDialog = ({
  open,
  onOpenChange,
  bookingId,
  totalAmount,
  checkInDate,
  cancellationPolicy,
  cancelledBy,
  onCancelled,
}: CancelBookingDialogProps) => {
  const { toast } = useToast();
  const cancelBooking = useCancelBooking();
  const [reason, setReason] = useState("");

  const daysUntilCheckin = getDaysUntilCheckin(checkInDate);
  const isOwner = cancelledBy === "owner";

  // Owner cancellations always get full refund to renter
  const refundAmount = isOwner
    ? totalAmount
    : calculatePolicyRefund(totalAmount, cancellationPolicy, daysUntilCheckin);

  const refundInfo = getRefundDescription(cancellationPolicy, daysUntilCheckin);

  const handleCancel = async () => {
    if (!reason.trim()) return;

    try {
      const result = await cancelBooking.mutateAsync({
        bookingId,
        reason: reason.trim(),
        cancelledBy,
      });

      toast({
        title: "Booking Cancelled",
        description: result.refund_amount > 0
          ? `Refund of $${result.refund_amount.toLocaleString()} has been initiated.`
          : "The booking has been cancelled.",
      });

      onOpenChange(false);
      setReason("");
      onCancelled?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to cancel booking";
      toast({
        title: "Cancellation Failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Booking
          </DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Cancel this booking? The renter will receive a full refund."
              : "Are you sure you want to cancel this booking?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cancellation Policy Info */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cancellation Policy</span>
              <Badge variant="outline">
                {CANCELLATION_POLICY_LABELS[cancellationPolicy]}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days until check-in</span>
              <span className="text-sm font-medium">
                {daysUntilCheckin} day{daysUntilCheckin !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Refund Preview */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Refund Estimate</span>
            </div>
            {isOwner ? (
              <p className="text-sm text-muted-foreground">
                Owner-initiated cancellation: full refund to renter.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{refundInfo.description}</p>
            )}
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-sm">Refund amount</span>
              <span className={`text-lg font-bold ${refundAmount > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                ${refundAmount.toLocaleString()}
              </span>
            </div>
            {!isOwner && refundAmount < totalAmount && refundAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                Original amount: ${totalAmount.toLocaleString()} (partial refund)
              </p>
            )}
          </div>

          {/* Owner warning */}
          {isOwner && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Owner-initiated cancellations are tracked and may affect your trust score.
              </AlertDescription>
            </Alert>
          )}

          {/* No refund warning */}
          {!isOwner && refundAmount === 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Based on the cancellation policy and timing, no refund will be issued.
              </AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div>
            <label className="text-sm font-medium" htmlFor="cancel-reason">
              Reason for cancellation *
            </label>
            <Textarea
              id="cancel-reason"
              placeholder="Please explain why you need to cancel..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1.5"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelBooking.isPending}
          >
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!reason.trim() || cancelBooking.isPending}
          >
            {cancelBooking.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Cancel Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelBookingDialog;
