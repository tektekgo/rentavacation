import { Link } from 'react-router-dom';
import { AlertTriangle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingFairValueBadge } from '@/components/fair-value/ListingFairValueBadge';
import type { OwnerListingRow } from '@/types/ownerDashboard';

interface MyListingsTableProps {
  listings: OwnerListingRow[] | undefined;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  booked: 'bg-blue-100 text-blue-700',
  completed: 'bg-slate-100 text-slate-500',
};

function isIdleWeek(listing: OwnerListingRow) {
  return (
    listing.status === 'active' &&
    listing.days_until_checkin > 0 &&
    listing.days_until_checkin < 60 &&
    listing.bid_count === 0
  );
}

export function MyListingsTable({ listings, isLoading }: MyListingsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">My Listings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!listings?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">My Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No listings yet. Create your first listing from the Listings tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="listings">
      <CardHeader>
        <CardTitle className="text-base font-semibold">My Listings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id}>
              <Link
                to={`/property/${listing.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{listing.resort_name}</span>
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[listing.status] || ''}`}>
                      {listing.status}
                    </Badge>
                    <ListingFairValueBadge listingId={listing.id} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(listing.check_in_date).toLocaleDateString()} – {new Date(listing.check_out_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <div className="font-semibold">${listing.nightly_rate}/night</div>
                    <div className="text-xs text-muted-foreground">${listing.final_price.toLocaleString()} total</div>
                    <div className="text-xs text-muted-foreground">
                      {listing.bid_count > 0
                        ? `${listing.bid_count} bid${listing.bid_count > 1 ? 's' : ''} · High: $${listing.highest_bid?.toLocaleString()}`
                        : 'No bids yet'}
                    </div>
                  </div>
                  {listing.days_until_checkin > 0 && (
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {listing.days_until_checkin}d
                    </div>
                  )}
                </div>
              </Link>

              {/* Idle week alert */}
              {isIdleWeek(listing) && (
                <div className="flex items-start gap-2 mt-1 ml-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    No bids yet — {listing.days_until_checkin} days until check-in.
                    Consider lowering your price or enabling bidding.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
