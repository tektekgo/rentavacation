import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Loader2, Clock, CheckCircle } from 'lucide-react';
import {
  useRequestRoleUpgrade,
  useLatestRequestForRole,
} from '@/hooks/useRoleUpgrade';
import type { AppRole } from '@/types/database';

interface RoleUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestedRole: AppRole;
  context?: string;
}

const ROLE_INFO: Record<string, { title: string; description: string; icon: typeof Building2 }> = {
  property_owner: {
    title: 'Become a Property Owner',
    description: 'As a property owner, you can list your vacation club timeshare, manage listings, receive bookings, and earn income from your unused weeks.',
    icon: Building2,
  },
  renter: {
    title: 'Add Traveler Access',
    description: 'As a traveler, you can browse and book vacation rentals, place bids on listings, and submit travel requests.',
    icon: Users,
  },
};

export function RoleUpgradeDialog({
  open,
  onOpenChange,
  requestedRole,
  context,
}: RoleUpgradeDialogProps) {
  const [reason, setReason] = useState('');
  const requestUpgrade = useRequestRoleUpgrade();
  const latestRequest = useLatestRequestForRole(requestedRole);

  const info = ROLE_INFO[requestedRole] || {
    title: `Request ${requestedRole} Role`,
    description: 'Request access to additional platform features.',
    icon: Users,
  };

  const Icon = info.icon;

  const handleSubmit = async () => {
    await requestUpgrade.mutateAsync({ role: requestedRole, reason: reason || undefined });
    setReason('');
  };

  // If there's a pending request, show status
  if (latestRequest?.status === 'pending') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Request Under Review
            </DialogTitle>
            <DialogDescription>
              Your request to become a property owner is being reviewed by our team.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Review
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Submitted</span>
                <span className="text-sm font-medium">
                  {new Date(latestRequest.created_at).toLocaleDateString()}
                </span>
              </div>
              {latestRequest.reason && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Your reason</span>
                  <p className="text-sm mt-1">{latestRequest.reason}</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // If approved (shouldn't normally show, but handle gracefully)
  if (latestRequest?.status === 'approved') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Request Approved
            </DialogTitle>
            <DialogDescription>
              Your role has been upgraded. You may need to refresh the page to see the changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => { onOpenChange(false); window.location.reload(); }}>
              Refresh Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Default: show the request form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {info.title}
          </DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {context && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              You need the property owner role to {context}.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="upgrade-reason">Why do you want this role? (Optional)</Label>
            <Textarea
              id="upgrade-reason"
              placeholder="e.g., I own a timeshare at Marriott's Ko Olina and want to list my unused weeks..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={requestUpgrade.isPending}>
            {requestUpgrade.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
