import { useState } from "react";
import {
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOwnerPortfolio,
  type PortfolioProperty,
} from "@/hooks/owner/useOwnerPortfolio";
import { PropertyCalendar } from "./PropertyCalendar";

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function SummaryStatsRow({
  properties,
  isLoading,
}: {
  properties: PortfolioProperty[] | undefined;
  isLoading: boolean;
}) {
  const totalProperties = properties?.length ?? 0;
  const totalRevenue =
    properties?.reduce((sum, p) => sum + (p.total_revenue || 0), 0) ?? 0;
  const activeListings =
    properties?.reduce((sum, p) => sum + (p.active_listing_count || 0), 0) ?? 0;
  const avgRate =
    properties && properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.avg_nightly_rate || 0), 0) /
        properties.filter((p) => p.avg_nightly_rate > 0).length || 0
      : 0;

  const stats = [
    {
      label: "Total Properties",
      value: totalProperties.toString(),
      icon: Building2,
      iconColor: "text-blue-500",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      iconColor: "text-emerald-500",
    },
    {
      label: "Active Listings",
      value: activeListings.toString(),
      icon: Calendar,
      iconColor: "text-amber-500",
    },
    {
      label: "Avg Nightly Rate",
      value: avgRate > 0 ? formatCurrency(Math.round(avgRate)) : "--",
      icon: TrendingUp,
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stat.value}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PropertyCard({ property }: { property: PortfolioProperty }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {property.resort_name}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{property.location || "Location not set"}</span>
            </div>
          </div>
          {property.brand && (
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {property.brand.replace(/_/g, " ")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Listings</p>
            <p className="text-sm font-medium">
              {property.active_listing_count} active{" "}
              <span className="text-muted-foreground">
                / {property.listing_count} total
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-sm font-medium">
              {formatCurrency(property.total_revenue || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bookings</p>
            <p className="text-sm font-medium">{property.total_bookings || 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Rate</p>
            <p className="text-sm font-medium">
              {property.avg_nightly_rate > 0
                ? `${formatCurrency(Math.round(property.avg_nightly_rate))}/night`
                : "--"}
            </p>
          </div>
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Calendar
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Calendar
            </>
          )}
        </Button>

        {/* Expandable calendar */}
        {expanded && <PropertyCalendar propertyId={property.property_id} />}
      </CardContent>
    </Card>
  );
}

export default function PortfolioOverview() {
  const { data: properties, isLoading } = useOwnerPortfolio();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Portfolio Overview</h2>
        <p className="text-muted-foreground">
          Performance across all your properties and listings
        </p>
      </div>

      {/* Summary stats */}
      <SummaryStatsRow properties={properties} isLoading={isLoading} />

      {/* Property cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28 mt-1" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !properties?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No properties yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Add your first property to get started. Once you have properties
              with listings, you'll see performance analytics here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard key={property.property_id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
