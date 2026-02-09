import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Home, 
  Building2, 
  Calendar, 
  DollarSign, 
  Plus,
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Shield
} from "lucide-react";
import type { Property, Listing, Booking, ListingStatus, BookingStatus } from "@/types/database";
import OwnerProperties from "@/components/owner/OwnerProperties";
import OwnerListings from "@/components/owner/OwnerListings";
import OwnerBookings from "@/components/owner/OwnerBookings";
import OwnerEarnings from "@/components/owner/OwnerEarnings";
import { OwnerProposals } from "@/components/owner/OwnerProposals";
import { OwnerVerification } from "@/components/owner/OwnerVerification";

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  pendingBookings: number;
  totalEarnings: number;
  completedBookings: number;
}

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isPropertyOwner, isRavTeam, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeListings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    completedBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const activeTab = searchParams.get("tab") || "overview";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/owner-dashboard");
    }
  }, [user, authLoading, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch properties count
        const { count: propertiesCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);

        // Fetch active listings count
        const { count: activeListingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .eq("status", "active");

        // Fetch bookings for owner's listings
        const { data: ownerListings } = await supabase
          .from("listings")
          .select("id")
          .eq("owner_id", user.id);

        const listingIds = (ownerListings as { id: string }[] | null)?.map((l) => l.id) || [];

        let pendingBookingsCount = 0;
        let completedBookingsCount = 0;
        let totalEarnings = 0;

        if (listingIds.length > 0) {
          // Pending bookings
          const { count: pending } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .in("listing_id", listingIds)
            .eq("status", "pending");
          pendingBookingsCount = pending || 0;

          // Completed bookings and earnings
          const { data: completedBookings } = await supabase
            .from("bookings")
            .select("owner_payout")
            .in("listing_id", listingIds)
            .eq("status", "completed");

          const bookingsData = completedBookings as { owner_payout: number }[] | null;
          completedBookingsCount = bookingsData?.length || 0;
          totalEarnings = bookingsData?.reduce((sum, b) => sum + (b.owner_payout || 0), 0) || 0;
        }

        setStats({
          totalProperties: propertiesCount || 0,
          activeListings: activeListingsCount || 0,
          pendingBookings: pendingBookingsCount,
          totalEarnings,
          completedBookings: completedBookingsCount,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has property owner or RAV team role
  const canAccess = isPropertyOwner() || isRavTeam();

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          You need to be a property owner to access this dashboard. 
          Contact us if you'd like to list your vacation property.
        </p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button onClick={() => navigate("/list-property")}>
            Become an Owner
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Owner Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your properties, listings, and bookings
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveTab("properties")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Properties Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Vacation club properties
                  </p>
                </CardContent>
              </Card>

              {/* Active Listings Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.activeListings}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Available for booking
                  </p>
                </CardContent>
              </Card>

              {/* Pending Bookings Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.pendingBookings}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Awaiting confirmation
                  </p>
                </CardContent>
              </Card>

              {/* Total Earnings Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      ${stats.totalEarnings.toLocaleString()}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    From {stats.completedBookings} completed bookings
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setActiveTab("properties")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Plus className="h-5 w-5 text-primary" />
                      Add New Property
                    </CardTitle>
                    <CardDescription>
                      Register a vacation club property you own
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setActiveTab("listings")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-5 w-5 text-primary" />
                      Create Listing
                    </CardTitle>
                    <CardDescription>
                      List available dates for your properties
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setActiveTab("earnings")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      View Earnings
                    </CardTitle>
                    <CardDescription>
                      Track your payouts and performance
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Getting Started Guide */}
            {stats.totalProperties === 0 && !isLoading && (
              <Card className="mt-8 border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Follow these steps to start earning from your vacation club membership
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                    <li>
                      <span className="font-medium text-foreground">Add your property</span> — 
                      Enter details about your vacation club membership
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Create a listing</span> — 
                      Select available dates and set your asking price
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Get approved</span> — 
                      Our team will review and publish your listing
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Receive bookings</span> — 
                      Renters book and pay through our platform
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Get paid</span> — 
                      Receive your payout after the stay is complete
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            <OwnerProperties />
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <OwnerListings />
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Your Proposals</h2>
              <p className="text-muted-foreground">
                Proposals you've submitted for traveler requests
              </p>
            </div>
            <OwnerProposals />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <OwnerBookings />
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="mt-6">
            <OwnerEarnings />
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Owner Verification</h2>
              <p className="text-muted-foreground">
                Verify your ownership to unlock more features and build trust
              </p>
            </div>
            <OwnerVerification />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;
