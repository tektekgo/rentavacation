import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Timer,
  Plus,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  useConfirmBooking,
  useDeclineBooking,
  useRequestExtension,
  useCountdown,
  useConfirmationTimerSettings,
  type OwnerConfirmationData,
} from '@/hooks/useOwnerConfirmation';

interface OwnerConfirmationTimerProps {
  confirmation: OwnerConfirmationData;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_owner: {
    label: 'Awaiting Your Confirmation',
    color: 'bg-yellow-500',
    icon: <Clock className="h-4 w-4" />,
  },
  owner_confirmed: {
    label: 'Confirmed',
    color: 'bg-green-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  owner_timed_out: {
    label: 'Timed Out',
    color: 'bg-red-500',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  owner_declined: {
    label: 'Declined',
    color: 'bg-gray-500',
    icon: <XCircle className="h-4 w-4" />,
  },
};

export function OwnerConfirmationTimer({ confirmation }: OwnerConfirmationTimerProps) {
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);

  const confirmMutation = useConfirmBooking();
  const declineMutation = useDeclineBooking();
  const extensionMutation = useRequestExtension();
  const { data: settings } = useConfirmationTimerSettings();

  const countdown = useCountdown(confirmation.owner_confirmation_deadline);
  const maxExtensions = settings?.maxExtensions ?? 2;
  const extensionsRemaining = maxExtensions - (confirmation.extensions_used || 0);
  const isPending = confirmation.owner_confirmation_status === 'pending_owner';
  const statusConfig = STATUS_CONFIG[confirmation.owner_confirmation_status || 'pending_owner'];

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync(confirmation.id);
      toast.success('Booking confirmed! Proceed to submit resort confirmation.');
    } catch (err) {
      toast.error('Failed to confirm booking');
    }
  };

  const handleDecline = async () => {
    try {
      await declineMutation.mutateAsync(confirmation.id);
      toast.success('Booking declined. Escrow will be refunded.');
      setDeclineDialogOpen(false);
    } catch (err) {
      toast.error('Failed to decline booking');
    }
  };

  const handleRequestExtension = async () => {
    try {
      await extensionMutation.mutateAsync(confirmation.id);
      toast.success('Deadline extended!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extend deadline');
    }
  };

  const formatCountdown = () => {
    if (countdown.expired) return '00:00:00';
    const h = String(countdown.hours).padStart(2, '0');
    const m = String(countdown.minutes).padStart(2, '0');
    const s = String(countdown.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const isUrgent = !countdown.expired && countdown.hours < 1;

  return (
    <Card className={isPending && isUrgent ? 'border-yellow-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={statusConfig.color}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </div>
            <CardTitle className="text-lg">
              {confirmation.booking?.listing?.property?.resort_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {confirmation.booking?.listing?.property?.location}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Escrow</p>
            <p className="text-xl font-bold">${confirmation.escrow_amount.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Countdown Timer */}
        {isPending && (
          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              isUrgent
                ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                : countdown.expired
                  ? 'bg-red-50 dark:bg-red-900/20'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <Timer className={`h-6 w-6 ${isUrgent ? 'text-red-600' : 'text-yellow-600'}`} />
              <div>
                <p className="font-semibold text-sm">
                  {countdown.expired ? 'Time Expired' : 'Time Remaining'}
                </p>
                {confirmation.owner_confirmation_deadline && (
                  <p className="text-xs text-muted-foreground">
                    Deadline: {format(new Date(confirmation.owner_confirmation_deadline), 'PPp')}
                  </p>
                )}
              </div>
            </div>
            <div className={`text-2xl font-mono font-bold ${isUrgent ? 'text-red-600' : ''}`}>
              {formatCountdown()}
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">
                {confirmation.booking?.listing?.check_in_date &&
                  format(new Date(confirmation.booking.listing.check_in_date), 'MMM d')}{' '}
                -{' '}
                {confirmation.booking?.listing?.check_out_date &&
                  format(new Date(confirmation.booking.listing.check_out_date), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">Stay dates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">
                {confirmation.booking?.renter?.full_name || 'Guest'}
              </p>
              <p className="text-xs text-muted-foreground">
                {confirmation.booking?.guest_count} guest
                {confirmation.booking?.guest_count !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isPending && !countdown.expired && (
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              onClick={handleConfirm}
              disabled={confirmMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {confirmMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRequestExtension}
                disabled={extensionsRemaining <= 0 || extensionMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                {extensionMutation.isPending
                  ? 'Extending...'
                  : `Request More Time (${extensionsRemaining} of ${maxExtensions} left)`}
              </Button>

              <Button
                variant="destructive"
                onClick={() => setDeclineDialogOpen(true)}
                disabled={declineMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        )}

        {/* Confirmed info */}
        {confirmation.owner_confirmation_status === 'owner_confirmed' && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200">
              Confirmed at{' '}
              {confirmation.owner_confirmed_at &&
                format(new Date(confirmation.owner_confirmed_at), 'PPp')}
              . Please submit resort confirmation details.
            </p>
          </div>
        )}
      </CardContent>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this booking? The escrow will be refunded to the
              renter and the booking will be cancelled. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending ? 'Declining...' : 'Yes, Decline Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
