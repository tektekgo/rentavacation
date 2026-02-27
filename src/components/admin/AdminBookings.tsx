import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Search, DollarSign, User, CheckCircle, XCircle } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Booking, Listing, Property, Profile, BookingStatus } from "@/types/database";
import { AdminEntityLink, type AdminNavigationProps } from "./AdminEntityLink";
import { DateRangeFilter } from "./DateRangeFilter";

interface BookingWithDetails extends Booking {
  listing: Listing & { property: Property; owner: Profile };
  renter: Profile;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-purple-500",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const AdminBookings = ({ initialSearch = "", onNavigateToEntity }: AdminNavigationProps) => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Sync initialSearch when navigating from another tab
  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);

  const fetchBookings = async () => {
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data as BookingWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Booking marked as ${STATUS_LABELS[newStatus].toLowerCase()}.`,
      });

      fetchBookings();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      b.listing?.property?.resort_name?.toLowerCase().includes(q) ||
      b.renter?.full_name?.toLowerCase().includes(q) ||
      b.renter?.email?.toLowerCase().includes(q) ||
      b.listing?.owner?.full_name?.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.payment_intent_id && b.payment_intent_id.toLowerCase().includes(q)) ||
      (b.stripe_transfer_id && b.stripe_transfer_id.toLowerCase().includes(q));

    const matchesStatus = statusFilter === "all" || b.status === statusFilter;

    const matchesDateRange = !dateRange?.from || isWithinInterval(
      new Date(b.created_at),
      { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to || dateRange.from) }
    );

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">All Bookings</h2>
          <p className="text-muted-foreground">
            {bookings.length} bookings across all properties
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all" ? "Try different filters" : "No bookings have been made yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Renter</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Financials</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <p className="font-medium">{booking.listing?.property?.resort_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.listing?.property?.location}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {booking.id.slice(0, 8)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <AdminEntityLink tab="users" search={booking.renter?.email || ""} onNavigate={onNavigateToEntity}>
                            <p className="text-sm font-medium">{booking.renter?.full_name || "Unknown"}</p>
                          </AdminEntityLink>
                          <p className="text-xs text-muted-foreground">{booking.renter?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminEntityLink tab="users" search={booking.listing?.owner?.email || ""} onNavigate={onNavigateToEntity}>
                        <p className="text-sm font-medium">{booking.listing?.owner?.full_name || "Unknown"}</p>
                      </AdminEntityLink>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(booking.listing?.check_in_date), "MMM d")} -{" "}
                        {format(new Date(booking.listing?.check_out_date), "MMM d")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">${booking.total_amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Commission: ${booking.rav_commission.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={STATUS_COLORS[booking.status]}>
                          {STATUS_LABELS[booking.status]}
                        </Badge>
                        {booking.paid_at && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Paid
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.status === "confirmed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(booking.id, "completed")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {booking.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
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

export default AdminBookings;
