// Bid Form Component - For travelers to bid on listings open for bidding

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateBid } from '@/hooks/useBidding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gavel, DollarSign, Users, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { ListingWithBidding } from '@/types/bidding';

interface BidFormDialogProps {
  listing: ListingWithBidding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BidFormDialog({ listing, open, onOpenChange }: BidFormDialogProps) {
  const { user, isConfigured } = useAuth();
  const createBid = useCreateBid();
  
  const [bidAmount, setBidAmount] = useState<number>(listing.min_bid_amount || listing.owner_price);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      return;
    }

    if (listing.min_bid_amount && bidAmount < listing.min_bid_amount) {
      return;
    }

    try {
      await createBid.mutateAsync({
        listing_id: listing.id,
        bid_amount: bidAmount,
        guest_count: guestCount,
        message: message || undefined,
      });
      
      onOpenChange(false);
      setBidAmount(listing.min_bid_amount || listing.owner_price);
      setGuestCount(1);
      setMessage('');
    } catch {
      // Error handled in hook
    }
  };

  const timeRemaining = listing.bidding_ends_at 
    ? formatDistanceToNow(new Date(listing.bidding_ends_at), { addSuffix: true })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Place Your Bid
          </DialogTitle>
          <DialogDescription>
            {listing.property?.resort_name} - {listing.property?.location}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* Listing Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-medium">{format(new Date(listing.check_in_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-medium">{format(new Date(listing.check_out_date), 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Listed Price</span>
              <span className="font-medium">${listing.final_price.toLocaleString()}</span>
            </div>
            {listing.min_bid_amount && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Bid</span>
                <span className="font-medium text-primary">${listing.min_bid_amount.toLocaleString()}</span>
              </div>
            )}
            {listing.highest_bid && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current High Bid</span>
                <span className="font-bold text-accent">${listing.highest_bid.toLocaleString()}</span>
              </div>
            )}
          </div>

          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Bidding ends {timeRemaining}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="bidAmount"
                type="number"
                min={listing.min_bid_amount || 1}
                step={1}
                value={bidAmount}
                onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                className="pl-9"
                required
              />
            </div>
            {listing.min_bid_amount && bidAmount < listing.min_bid_amount && (
              <p className="text-xs text-destructive">
                Minimum bid is ${listing.min_bid_amount.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestCount">Number of Guests</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="guestCount"
                type="number"
                min={1}
                max={listing.property?.sleeps || 10}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="pl-9"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Max guests: {listing.property?.sleeps || 'N/A'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to the property owner..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createBid.isPending || (listing.min_bid_amount ? bidAmount < listing.min_bid_amount : false)}
            >
              {createBid.isPending ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
