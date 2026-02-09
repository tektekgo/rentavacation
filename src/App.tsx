import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/list-property" element={<ListProperty />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/bidding" element={<BiddingMarketplace />} />
            <Route path="/my-bids" element={<MyBidsDashboard />} />
            <Route path="/checkin" element={<TravelerCheckin />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/user-guide" element={<UserGuide />} />
            {/* Legacy routes - redirect to new paths */}
            <Route path="/deals" element={<Rentals />} />
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
