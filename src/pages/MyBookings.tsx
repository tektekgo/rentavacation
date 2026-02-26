import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { usePageMeta } from "@/hooks/usePageMeta";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CancelBookingDialog from "@/components/booking/CancelBookingDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign, Ban, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Booking, BookingStatus, Listing, Property } from "@/types/database";

interface BookingWithListing extends Booking {
  listing: Listing & { property: Property };
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

const MyBookings = () => {
  usePageMeta("My Bookings", "View and manage your vacation bookings on Rent-A-Vacation.");
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithListing | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(
            *,
            property:properties(*)
          )
        `)
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load your bookings. Please try again.");
        console.error("Bookings fetch error:", fetchError);
      } else {
        setBookings((data as BookingWithListing[]) || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const now = new Date();

  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === "pending" || b.status === "confirmed") &&
      new Date(b.listing?.check_in_date) >= now
  );

  const pastBookings = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      ((b.status === "pending" || b.status === "confirmed") &&
        new Date(b.listing?.check_in_date) < now)
  );

  const handleCancelClick = (booking: BookingWithListing) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCancelled = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  const renderBookingCard = (booking: BookingWithListing) => {
    const listing = booking.listing;
    const property = listing?.property;

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">
                {property?.resort_name || "Vacation Rental"}
              </CardTitle>
              {property?.location && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{property.location}</span>
                </CardDescription>
              )}
            </div>
            <Badge
              className={`${STATUS_COLORS[booking.status]} text-white shrink-0`}
            >
              {STATUS_LABELS[booking.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Check-in / Check-out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Check-in: </span>
                <span className="font-medium">
                  {listing?.check_in_date
                    ? format(new Date(listing.check_in_date), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Check-out: </span>
                <span className="font-medium">
                  {listing?.check_out_date
                    ? format(new Date(listing.check_out_date), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Guest Count & Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {booking.guest_count} Guest{booking.guest_count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">
                ${booking.total_amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Booking Reference */}
          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              Ref: <span className="font-mono font-semibold tracking-wider">{booking.id.slice(0, 8).toUpperCase()}</span>
            </span>

            <div className="flex items-center gap-2">
              {listing && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/property/${listing.property_id}`}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    View Property
                  </Link>
                </Button>
              )}

              {booking.status === "confirmed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleCancelClick(booking)}
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBookingList = (list: BookingWithListing[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              You haven't made any bookings yet. Start browsing vacation rentals!
            </p>
            <Button asChild>
              <Link to="/rentals">Browse Rentals</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {list.map(renderBookingCard)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20 md:pt-24 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your vacation reservations.
            </p>
          </div>

          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="py-4">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                All ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderBookingList(bookings)}
            </TabsContent>

            <TabsContent value="upcoming">
              {renderBookingList(upcomingBookings)}
            </TabsContent>

            <TabsContent value="past">
              {renderBookingList(pastBookings)}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {selectedBooking && (
        <CancelBookingDialog
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            setCancelDialogOpen(open);
            if (!open) setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          totalAmount={selectedBooking.total_amount}
          checkInDate={selectedBooking.listing?.check_in_date}
          cancellationPolicy={selectedBooking.listing?.cancellation_policy || "moderate"}
          cancelledBy="renter"
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
};

export default MyBookings;
