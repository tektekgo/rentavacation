import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Calendar, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import type { Booking, BookingStatus, Property, Listing } from "@/types/database";

interface BookingWithListing extends Booking {
  listing: Listing & { property: Property };
}

interface EarningsSummary {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  totalBookings: number;
  averagePerBooking: number;
}

const OwnerEarnings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    totalBookings: 0,
    averagePerBooking: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      // Get owner's listing IDs
      const { data: ownerListings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", user.id);

      const listingIds = (ownerListings as { id: string }[] | null)?.map((l) => l.id) || [];

      if (listingIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch bookings with earnings data
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(
            *,
            property:properties(*)
          )
        `)
        .in("listing_id", listingIds)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookingsData = data as BookingWithListing[] || [];
      setBookings(bookingsData);

      // Calculate summary
      const completedBookings = bookingsData.filter((b) => b.status === "completed");
      const confirmedBookings = bookingsData.filter((b) => b.status === "confirmed");

      const totalEarnings = bookingsData.reduce((sum, b) => sum + b.owner_payout, 0);
      const completedPayouts = completedBookings.reduce((sum, b) => sum + b.owner_payout, 0);
      const pendingPayouts = confirmedBookings.reduce((sum, b) => sum + b.owner_payout, 0);

      setSummary({
        totalEarnings,
        pendingPayouts,
        completedPayouts,
        totalBookings: bookingsData.length,
        averagePerBooking: bookingsData.length > 0 ? totalEarnings / bookingsData.length : 0,
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Earnings</h2>
        <p className="text-muted-foreground">
          Track your payouts and performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {summary.totalBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.completedPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${summary.pendingPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting stay completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. per Booking</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.averagePerBooking.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Average earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed breakdown of all your bookings and payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No earnings yet</h3>
              <p className="text-muted-foreground text-center">
                Your completed bookings and payouts will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Stay Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Your Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(new Date(booking.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.listing.property?.resort_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.listing.property?.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.listing.check_in_date), "MMM d")} -{" "}
                      {format(new Date(booking.listing.check_out_date), "MMM d")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={booking.status === "completed" ? "default" : "secondary"}
                        className={
                          booking.status === "completed"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }
                      >
                        {booking.status === "completed" ? "Completed" : "Confirmed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      ${booking.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      -${booking.rav_commission.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ${booking.owner_payout.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">How Payouts Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Booking Confirmed</p>
                <p className="text-muted-foreground">
                  Renter pays the full amount to RAV
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Stay Completed</p>
                <p className="text-muted-foreground">
                  After checkout, booking is marked complete
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Payout Sent</p>
                <p className="text-muted-foreground">
                  Your earnings are transferred within 5 business days
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerEarnings;
