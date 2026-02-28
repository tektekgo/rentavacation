import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePropertyCalendar,
  type PropertyCalendarListing,
} from "@/hooks/owner/useOwnerPortfolio";

interface PropertyCalendarProps {
  propertyId: string;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  active: {
    color: "bg-emerald-500",
    bg: "bg-emerald-50 border-emerald-200",
    label: "Active",
  },
  booked: {
    color: "bg-blue-500",
    bg: "bg-blue-50 border-blue-200",
    label: "Booked",
  },
  completed: {
    color: "bg-purple-500",
    bg: "bg-purple-50 border-purple-200",
    label: "Completed",
  },
  cancelled: {
    color: "bg-red-400 bg-stripes",
    bg: "bg-red-50 border-red-200",
    label: "Cancelled",
  },
  draft: {
    color: "bg-slate-400",
    bg: "bg-slate-50 border-slate-200",
    label: "Draft",
  },
  pending_approval: {
    color: "bg-orange-400",
    bg: "bg-orange-50 border-orange-200",
    label: "Pending",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] || {
      color: "bg-slate-400",
      bg: "bg-slate-50 border-slate-200",
      label: status,
    }
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getMonthYear(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function groupByMonth(
  listings: PropertyCalendarListing[]
): Record<string, PropertyCalendarListing[]> {
  const groups: Record<string, PropertyCalendarListing[]> = {};
  for (const listing of listings) {
    const key = getMonthYear(listing.check_in_date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(listing);
  }
  return groups;
}

function ListingBar({ listing }: { listing: PropertyCalendarListing }) {
  const config = getStatusConfig(listing.status);
  const price = listing.final_price || listing.nightly_rate || 0;

  return (
    <div className={`flex items-center gap-3 rounded-md border p-2 ${config.bg}`}>
      <div className={`w-2 h-8 rounded-full flex-shrink-0 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">
            {formatDate(listing.check_in_date)} &rarr;{" "}
            {formatDate(listing.check_out_date)}
          </span>
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
        </div>
        {price > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">
            ${price.toLocaleString()}
            {listing.nightly_rate > 0 && listing.status !== "completed"
              ? ` ($${listing.nightly_rate}/night)`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export function PropertyCalendar({ propertyId }: PropertyCalendarProps) {
  const { data: listings, isLoading } = usePropertyCalendar(propertyId);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!listings?.length) {
    return (
      <div className="text-center py-6">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          No listings for this property yet.
        </p>
      </div>
    );
  }

  const grouped = groupByMonth(listings);

  return (
    <div className="space-y-4 pt-3">
      {/* Status legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_CONFIG)
          .filter(([key]) =>
            listings.some((l) => l.status === key)
          )
          .map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          ))}
      </div>

      {/* Month groups */}
      {Object.entries(grouped).map(([month, monthListings]) => (
        <div key={month}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {month}
          </h4>
          <div className="space-y-2">
            {monthListings.map((listing) => (
              <ListingBar key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
