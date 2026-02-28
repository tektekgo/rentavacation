import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Booking, Listing, Property, Profile } from "@/types/database";
import { DateRangeFilter } from "./DateRangeFilter";

interface BookingWithDetails extends Booking {
  listing: Listing & { property: Property; owner: Profile };
  renter: Profile;
}

interface FinancialSummary {
  totalRevenue: number;
  totalCommission: number;
  totalOwnerPayouts: number;
  pendingPayouts: number;
  completedPayouts: number;
  averageBookingValue: number;
  averageCommission: number;
}

const AdminFinancials = () => {
  const [allBookings, setAllBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  useEffect(() => {
    const fetchFinancials = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            listing:listings(
              *,
              property:properties(*),
              owner:profiles!listings_owner_id_fkey(*)
            ),
            renter:profiles!bookings_renter_id_fkey(*)
          `)
          .in("status", ["confirmed", "completed"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAllBookings(data as BookingWithDetails[] || []);
      } catch (error) {
        console.error("Error fetching financials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinancials();
  }, []);

  // Filter bookings by date range
  const bookings = useMemo(() => {
    if (!dateRange?.from) return allBookings;
    return allBookings.filter((b) =>
      isWithinInterval(new Date(b.created_at), {
        start: startOfDay(dateRange.from!),
        end: endOfDay(dateRange.to || dateRange.from!),
      })
    );
  }, [allBookings, dateRange]);

  // Derive summary from filtered bookings
  const summary = useMemo<FinancialSummary>(() => {
    const completedBookings = bookings.filter(b => b.status === "completed");
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");

    const totalRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0);
    const totalCommission = bookings.reduce((sum, b) => sum + b.rav_commission, 0);
    const totalOwnerPayouts = bookings.reduce((sum, b) => sum + b.owner_payout, 0);
    const pendingPayouts = confirmedBookings.reduce((sum, b) => sum + b.owner_payout, 0);
    const completedPayouts = completedBookings.reduce((sum, b) => sum + b.owner_payout, 0);

    return {
      totalRevenue,
      totalCommission,
      totalOwnerPayouts,
      pendingPayouts,
      completedPayouts,
      averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
      averageCommission: bookings.length > 0 ? totalCommission / bookings.length : 0,
    };
  }, [bookings]);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Platform Financials</h2>
          <p className="text-muted-foreground">
            Revenue, commissions, and payout tracking
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {bookings.length} bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAV Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.totalCommission.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner Payouts</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalOwnerPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total to property owners
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <PiggyBank className="h-4 w-4 text-yellow-600" />
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
      </div>

      {/* Averages */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${summary.averageBookingValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Commission per Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${summary.averageCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            All confirmed and completed bookings with financial breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground text-center">
                Financial data will appear when bookings are confirmed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Owner Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(new Date(booking.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{booking.listing?.property?.resort_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.listing?.property?.location}
                      </p>
                    </TableCell>
                    <TableCell>
                      {booking.listing?.owner?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {booking.renter?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${booking.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${booking.rav_commission.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${booking.owner_payout.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinancials;
