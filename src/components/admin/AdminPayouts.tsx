import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Clock, CheckCircle, DollarSign, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Booking, Listing, Property, Profile } from "@/types/database";

interface BookingWithDetails extends Booking {
  listing: Listing & { property: Property };
  owner: Profile;
}

interface OwnerPayout {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  totalPending: number;
  totalCompleted: number;
  pendingBookings: BookingWithDetails[];
  completedBookings: BookingWithDetails[];
}

const AdminPayouts = () => {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<OwnerPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOwner, setExpandedOwner] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      // Fetch confirmed and completed bookings with owner info
      const { data: bookingsData, error } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(
            *,
            property:properties(*),
            owner_id
          )
        `)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique owner IDs
      const ownerIds = [...new Set((bookingsData || []).map((b: { listing: { owner_id: string } }) => b.listing?.owner_id))];

      // Fetch owner profiles
      const { data: ownersData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ownerIds);

      const ownersMap = new Map((ownersData || []).map((o: Profile) => [o.id, o]));

      // Group bookings by owner
      const payoutsByOwner = new Map<string, OwnerPayout>();

      for (const booking of (bookingsData || [])) {
        const ownerId = booking.listing?.owner_id;
        if (!ownerId) continue;

        const owner = ownersMap.get(ownerId);
        
        if (!payoutsByOwner.has(ownerId)) {
          payoutsByOwner.set(ownerId, {
            ownerId,
            ownerName: owner?.full_name || "Unknown",
            ownerEmail: owner?.email || "",
            totalPending: 0,
            totalCompleted: 0,
            pendingBookings: [],
            completedBookings: [],
          });
        }

        const payout = payoutsByOwner.get(ownerId)!;
        const bookingWithOwner = { ...booking, owner } as BookingWithDetails;

        if (booking.status === "confirmed") {
          payout.totalPending += booking.owner_payout;
          payout.pendingBookings.push(bookingWithOwner);
        } else {
          payout.totalCompleted += booking.owner_payout;
          payout.completedBookings.push(bookingWithOwner);
        }
      }

      setPayouts(Array.from(payoutsByOwner.values()));
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleMarkAsPaid = async (bookingId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Booking Completed",
        description: "Booking marked as completed and payout processed.",
      });

      fetchPayouts();
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status.",
        variant: "destructive",
      });
    }
  };

  const totalPending = payouts.reduce((sum, p) => sum + p.totalPending, 0);
  const totalCompleted = payouts.reduce((sum, p) => sum + p.totalCompleted, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
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
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Owner Payouts</h2>
        <p className="text-muted-foreground">
          Track and manage payouts to property owners
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting stay completion
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalCompleted.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully paid out
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Payout Info */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Manual Payout Process</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Payouts are currently processed manually via Zelle or bank transfer. 
                After completing a payout, mark the booking as "Completed" to update the records.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts by Owner */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts by Owner</CardTitle>
          <CardDescription>
            Click on an owner to see their booking details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
              <p className="text-muted-foreground text-center">
                Payout data will appear when bookings are confirmed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.ownerId} className="border rounded-lg">
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedOwner(
                      expandedOwner === payout.ownerId ? null : payout.ownerId
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium">{payout.ownerName}</p>
                        <p className="text-sm text-muted-foreground">{payout.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {payout.totalPending > 0 && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending: ${payout.totalPending.toLocaleString()}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Paid: ${payout.totalCompleted.toLocaleString()}
                      </Badge>
                    </div>
                  </button>

                  {expandedOwner === payout.ownerId && (
                    <div className="border-t p-4 bg-muted/30">
                      {payout.pendingBookings.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            Pending Payouts
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payout.pendingBookings.map((booking) => (
                                <TableRow key={booking.id}>
                                  <TableCell>
                                    {booking.listing?.property?.resort_name}
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(booking.listing?.check_in_date), "MMM d")} -{" "}
                                    {format(new Date(booking.listing?.check_out_date), "MMM d")}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    ${booking.owner_payout.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleMarkAsPaid(booking.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Mark Paid
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {payout.completedBookings.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Completed Payouts
                          </h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payout.completedBookings.map((booking) => (
                                <TableRow key={booking.id}>
                                  <TableCell>
                                    {booking.listing?.property?.resort_name}
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(booking.listing?.check_in_date), "MMM d")} -{" "}
                                    {format(new Date(booking.listing?.check_out_date), "MMM d")}
                                  </TableCell>
                                  <TableCell className="font-medium text-green-600">
                                    ${booking.owner_payout.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayouts;
