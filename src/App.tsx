import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Rentals from "./pages/Rentals";
import HowItWorksPage from "./pages/HowItWorksPage";
import ListProperty from "./pages/ListProperty";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Destinations from "./pages/Destinations";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BookingSuccess from "./pages/BookingSuccess";
import BiddingMarketplace from "./pages/BiddingMarketplace";
import MyBidsDashboard from "./pages/MyBidsDashboard";
import TravelerCheckin from "./pages/TravelerCheckin";
import Documentation from "./pages/Documentation";
import UserGuide from "./pages/UserGuide";
import PendingApproval from "./pages/PendingApproval";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isRavTeam, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // RAV team always has access
    if (isRavTeam()) return;

    // Redirect pending users to the pending page
    if (profile?.approval_status === "pending_approval") {
      navigate("/pending-approval");
    }
  }, [user, profile, isRavTeam, isLoading, navigate, location]);

  // Show nothing while checking auth (prevents flash of content)
  if (isLoading) return null;
  if (!user) return null;
  if (!isRavTeam() && profile?.approval_status !== "approved") return null;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/property/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/user-guide" element={<UserGuide />} />

            {/* Protected routes — require approved account */}
            <Route path="/rentals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
            <Route path="/list-property" element={<ProtectedRoute><ListProperty /></ProtectedRoute>} />
            <Route path="/owner-dashboard" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
            <Route path="/bidding" element={<ProtectedRoute><BiddingMarketplace /></ProtectedRoute>} />
            <Route path="/my-bids" element={<ProtectedRoute><MyBidsDashboard /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><TravelerCheckin /></ProtectedRoute>} />

            {/* Legacy routes - redirect to new paths */}
            <Route path="/deals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
            <Route path="/owner-resources" element={<HowItWorksPage />} />
            <Route path="/pricing" element={<HowItWorksPage />} />
            <Route path="/success-stories" element={<HowItWorksPage />} />
            <Route path="/owner-faq" element={<FAQ />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
