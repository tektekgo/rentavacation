import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FairValueBadge } from '@/components/fair-value/FairValueBadge';
import { useFairValueScore } from '@/hooks/useFairValueScore';
import type { OwnerListingRow } from '@/types/ownerDashboard';

interface PricingIntelligenceProps {
  listings: OwnerListingRow[] | undefined;
  isLoading: boolean;
}

function PricingRow({ listing }: { listing: OwnerListingRow }) {
  const { data, isLoading } = useFairValueScore(listing.id);

  if (isLoading) {
    return <Skeleton className="h-16 w-full" />;
  }

  if (!data || data.tier === 'insufficient_data') {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <span className="font-medium text-sm">{listing.resort_name}</span>
          <p className="text-xs text-muted-foreground">
            {new Date(listing.check_in_date).toLocaleDateString()}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">Insufficient data</span>
      </div>
    );
  }

  const isAboveMarket = data.tier === 'above_market';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border ${isAboveMarket ? 'bg-red-50 border-red-200' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{listing.resort_name}</span>
          <FairValueBadge tier={data.tier} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(listing.check_in_date).toLocaleDateString()} · Your price: ${listing.final_price.toLocaleString()}
          {data.range_low != null && data.range_high != null && (
            <> · Market: ${data.range_low.toLocaleString()}–${data.range_high.toLocaleString()}</>
          )}
          {data.avg_accepted_bid != null && (
            <> · Avg bid: ${data.avg_accepted_bid.toLocaleString()}</>
          )}
        </p>
      </div>
    </div>
  );
}

export function PricingIntelligence({ listings, isLoading }: PricingIntelligenceProps) {
  const activeListings = listings?.filter((l) => l.status === 'active') || [];

  return (
    <Card id="pricing">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Pricing Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : activeListings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            List a property to see pricing guidance.
          </p>
        ) : (
          <div className="space-y-3">
            {activeListings.map((listing) => (
              <PricingRow key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
