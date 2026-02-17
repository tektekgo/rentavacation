import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  Home, 
  Building2, 
  Gavel, 
  CreditCard, 
  Shield, 
  Download,
  Menu,
  X,
  CheckCircle2,
  DollarSign,
  MapPin,
  Calendar,
  Search,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  User,
  Key,
  Camera,
  MessageSquare,
  Clock,
  Plane
} from "lucide-react";

const UserGuide = () => {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeRole, setActiveRole] = useState<"owner" | "renter">("owner");
  const navigate = useNavigate();

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const ownerSections = [
    { id: "getting-started", label: "Getting Started", icon: Home },
    { id: "register-property", label: "Register Your Property", icon: Building2 },
    { id: "create-listing", label: "Create a Listing", icon: FileCheck },
    { id: "manage-bids", label: "Manage Bids & Proposals", icon: Gavel },
    { id: "confirm-bookings", label: "Confirm Bookings", icon: Calendar },
    { id: "receive-payouts", label: "Receive Payouts", icon: DollarSign },
    { id: "owner-faq", label: "Owner FAQ", icon: MessageSquare },
  ];

  const renterSections = [
    { id: "getting-started", label: "Getting Started", icon: Home },
    { id: "search-book", label: "Search & Book", icon: Search },
    { id: "travel-requests", label: "Submit Travel Requests", icon: Plane },
    { id: "place-bids", label: "Place Bids on Listings", icon: Gavel },
    { id: "checkin", label: "Check-In Process", icon: Key },
    { id: "protection", label: "Renter Protection", icon: Shield },
    { id: "renter-faq", label: "Renter FAQ", icon: MessageSquare },
  ];

  const sections = activeRole === "owner" ? ownerSections : renterSections;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 print:hidden">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img src="/rav-logo.png" alt="RAV Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Rent-A-Vacation</h1>
              <p className="text-xs text-muted-foreground">User Guide</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed md:sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card z-40
          transition-transform duration-200 print:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <ScrollArea className="h-full py-4">
            {/* Role Toggle */}
            <div className="px-3 mb-4">
              <div className="bg-muted rounded-lg p-1 flex">
                <button
                  onClick={() => {
                    setActiveRole("owner");
                    setActiveSection("getting-started");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeRole === "owner" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Property Owner
                </button>
                <button
                  onClick={() => {
                    setActiveRole("renter");
                    setActiveSection("getting-started");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeRole === "renter" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Renter
                </button>
              </div>
            </div>

            <nav className="space-y-1 px-3">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${activeSection === section.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.label}</span>
                    {activeSection === section.id && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-6 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Print Cover Page */}
            {isPrinting && (
              <section className="print:break-after-page hidden print:block">
                <div className="min-h-[90vh] flex flex-col items-center justify-center text-center">
                  <img src="/rav-logo.png" alt="RAV Logo" className="h-24 w-24 mb-8" />
                  <h1 className="text-5xl font-bold text-foreground mb-4">Rent-A-Vacation</h1>
                  <p className="text-2xl text-primary font-medium mb-2">
                    {activeRole === "owner" ? "Property Owner Guide" : "Renter Guide"}
                  </p>
                  <p className="text-xl text-muted-foreground mb-8">Name Your Price. Book Your Paradise.</p>
                  <div className="bg-muted/50 rounded-xl p-6 max-w-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Version:</strong> 1.0<br />
                      <strong>Last Updated:</strong> {currentDate}
                    </p>
                  </div>
                  <div className="mt-auto pt-16">
                    <p className="text-sm text-muted-foreground">A Techsilon Group Company</p>
                    <p className="text-xs text-muted-foreground mt-1">Jacksonville, FL • rentavacation.com</p>
                  </div>
                </div>
              </section>
            )}

            {/* ============ OWNER SECTIONS ============ */}
            
            {/* Owner Getting Started */}
            {activeRole === "owner" && (isPrinting || activeSection === "getting-started") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Welcome, Property Owner!</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Turn your vacation club or timeshare ownership into income by renting directly to renters 
                    on the Rent-A-Vacation marketplace.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-8 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">✓</span>
                    <h2 className="text-2xl font-semibold">Why List on RAV?</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">85%</p>
                      <p className="text-sm text-muted-foreground">You Keep</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">0</p>
                      <p className="text-sm text-muted-foreground">Upfront Fees</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">100%</p>
                      <p className="text-sm text-muted-foreground">Control</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Quick Start Checklist</h3>
                  {[
                    { step: 1, title: "Create your account", desc: "Sign up with your email. Your account will be reviewed by our team before you can access the platform." },
                    { step: 2, title: "Register your property", desc: "Once approved, add your vacation club resort and unit details" },
                    { step: 3, title: "Get verified", desc: "Upload ID and ownership documents for the verified badge" },
                    { step: 4, title: "Create your first listing", desc: "Set dates, pricing, and open for bookings" },
                    { step: 5, title: "Receive bookings", desc: "Confirm reservations and collect payouts" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 p-4 bg-card rounded-xl border">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Register Property */}
            {activeRole === "owner" && (isPrinting || activeSection === "register-property") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Register Your Property</h1>
                  <p className="text-xl text-muted-foreground">
                    Add your vacation club or timeshare property to start creating rental listings.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Step-by-Step Instructions</h3>
                  <ol className="space-y-4">
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <div>
                        <h4 className="font-medium">Navigate to Owner Dashboard</h4>
                        <p className="text-sm text-muted-foreground">Click "List Your Property" in the main navigation, or go to /owner-dashboard</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-medium">Select "My Properties" Tab</h4>
                        <p className="text-sm text-muted-foreground">Click "Add New Property" to open the registration form</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <div>
                        <h4 className="font-medium">Enter Property Details</h4>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>• <strong>Resort/Club Name:</strong> e.g., "Hilton Grand Vacations Las Vegas"</li>
                          <li>• <strong>Location:</strong> Full address of the resort</li>
                          <li>• <strong>Unit Type:</strong> Studio, 1BR, 2BR, etc.</li>
                          <li>• <strong>Max Occupancy:</strong> Maximum guests allowed</li>
                          <li>• <strong>Amenities:</strong> Kitchen, pool access, parking, etc.</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Upload Photos
                        </h4>
                        <p className="text-sm text-muted-foreground">Add high-quality photos of the unit interior, view, and resort amenities</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">5</span>
                      <div>
                        <h4 className="font-medium">Submit for Review</h4>
                        <p className="text-sm text-muted-foreground">Our team reviews new properties within 24-48 hours</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Important: Get Verified First
                  </h4>
                  <p className="text-sm text-amber-700">
                    Properties from verified owners are prioritized in search results and receive the "Verified Owner ✓" 
                    badge, increasing trust and booking rates by up to 40%.
                  </p>
                </div>
              </section>
            )}

            {/* Create Listing */}
            {activeRole === "owner" && (isPrinting || activeSection === "create-listing") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Create a Listing</h1>
                  <p className="text-xl text-muted-foreground">
                    Once your property is registered, create listings for specific date ranges to attract renters.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Listing Creation Steps</h3>
                  <ol className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Select your property</strong> — Choose from your registered properties
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Set check-in and check-out dates</strong> — When is your unit available?
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Set your price</strong> — Total price for the stay (you'll receive 85% after platform commission)
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Choose cancellation policy</strong> — Flexible, Moderate, Strict, or Super Strict
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Optionally enable bidding</strong> — Allow renters to submit competitive bids
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Submit for approval</strong> — RAV team reviews within 24-48 hours
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h4 className="font-semibold mb-3">Standard Listing</h4>
                    <p className="text-sm text-muted-foreground">
                      Set a fixed price. Renters book directly at your listed rate through Stripe secure checkout.
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      Open for Bidding
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Enable competitive bidding. Set a reserve price (minimum you'll accept) and bidding deadline. 
                      Review and accept the best offer.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Manage Bids */}
            {activeRole === "owner" && (isPrinting || activeSection === "manage-bids") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Manage Bids & Proposals</h1>
                  <p className="text-xl text-muted-foreground">
                    The RAV marketplace offers two ways to connect with renters through price negotiation.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    Receiving Bids on Your Listings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    When you enable "Open for Bidding" on a listing, renters can submit offers below your asking price.
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to Owner Dashboard → "My Bids" tab</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Review incoming bids with renter details and offer amounts</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Accept the best bid before the deadline (or let bidding continue)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Accepted bids convert to confirmed bookings</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    Responding to Travel Requests
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Renters can post "Travel Requests" specifying their destination, dates, and budget. 
                    You can submit proposals offering your property.
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Browse the Marketplace for matching travel requests</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Click "Submit Proposal" on a request that fits your property</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Enter your proposed price and any special notes</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>If the renter accepts, you'll be notified to confirm</span>
                    </li>
                  </ol>
                </div>
              </section>
            )}

            {/* Confirm Bookings */}
            {activeRole === "owner" && (isPrinting || activeSection === "confirm-bookings") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Confirm Bookings</h1>
                  <p className="text-xl text-muted-foreground">
                    After a renter books, you must confirm you can fulfill the reservation within 48 hours.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    48-Hour Confirmation Deadline
                  </h4>
                  <p className="text-sm text-red-700">
                    You have 48 hours from booking to confirm. Unconfirmed bookings are automatically cancelled 
                    with a full refund to the renter. Repeated failures may result in account suspension.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Confirm a Booking</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Go to Owner Dashboard → "Booking Confirmations" tab</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review the booking details (dates, guest count, special requests)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Verify you can provide the unit as described</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Upload your booking confirmation from the resort (if available)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Click "Confirm Booking" to finalize</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h4 className="font-medium text-green-800 mb-2">After Confirmation</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Renter receives confirmation email with your contact info</li>
                    <li>• Provide check-in instructions 24 hours before arrival</li>
                    <li>• Funds remain in escrow until 5 days after checkout</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Receive Payouts */}
            {activeRole === "owner" && (isPrinting || activeSection === "receive-payouts") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Receive Payouts</h1>
                  <p className="text-xl text-muted-foreground">
                    Get paid securely after successful guest stays.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Payout Timeline</h3>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    {[
                      { stage: "Booking", desc: "Payment collected and held in escrow" },
                      { stage: "Check-in", desc: "Renter confirms arrival at property" },
                      { stage: "Checkout", desc: "Stay completes successfully" },
                      { stage: "+5 Days", desc: "Funds released to your account" },
                    ].map((item, i) => (
                      <div key={i} className="relative flex gap-4 pb-6">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 z-10">
                          {i + 1}
                        </div>
                        <div className="pt-1">
                          <h4 className="font-medium text-sm">{item.stage}</h4>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Payout Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Booking Total</span>
                      <span className="font-medium">$1,000</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Commission (15%)</span>
                      <span>-$150</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-primary">
                      <span>Your Payout</span>
                      <span>$850</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-3">Track Your Earnings</h3>
                  <p className="text-sm text-muted-foreground">
                    View all earnings, pending payouts, and transaction history in Owner Dashboard → "Earnings" tab.
                  </p>
                </div>
              </section>
            )}

            {/* Owner FAQ */}
            {activeRole === "owner" && (isPrinting || activeSection === "owner-faq") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Owner FAQ</h1>
                  <p className="text-xl text-muted-foreground">
                    Common questions from property owners.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { q: "How much does it cost to list?", a: "Listing is free. We only charge a 15% commission when your property is booked." },
                    { q: "What if I need to cancel a booking?", a: "Contact RAV support immediately. Depending on timing and reason, refund policies apply. Repeated cancellations may affect your account standing." },
                    { q: "How do I get the verified badge?", a: "Upload your government ID and vacation club membership documentation in Owner Dashboard → Verification tab." },
                    { q: "Can I set a minimum bid amount?", a: "Yes, when enabling bidding you can set a 'reserve price' - the minimum you'll accept. Bids below this are marked accordingly." },
                    { q: "What cancellation policy should I choose?", a: "Flexible policies attract more bookings but carry more risk. Strict policies protect your income but may reduce bookings. Start with Moderate." },
                    { q: "How do I provide check-in instructions?", a: "After confirming a booking, you can add check-in details that are shared with the renter 24 hours before arrival." },
                    { q: "What if the renter reports an issue?", a: "RAV support will contact you to resolve. Maintain accurate listings and prompt communication to avoid disputes." },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border">
                      <h4 className="font-medium mb-2">{item.q}</h4>
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ============ TRAVELER SECTIONS ============ */}

            {/* Renter Getting Started */}
            {activeRole === "renter" && (isPrinting || activeSection === "getting-started") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Welcome, Renter!</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Discover premium vacation club resorts at prices you name. Book directly from verified owners 
                    and enjoy protected transactions.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-8 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🧳</span>
                    <h2 className="text-2xl font-semibold">Why Book on RAV?</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Escrow Protected</p>
                    </div>
                    <div className="text-center">
                      <Gavel className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Name Your Price</p>
                    </div>
                    <div className="text-center">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Premium Resorts</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Approval Required
                  </h4>
                  <p className="text-sm text-amber-700">
                    After signing up, your account will be reviewed by our team. You'll receive an email once approved,
                    typically within 24 hours. Until then, you'll see a "Pending Approval" page when you log in.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Voice Search</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use our AI-powered voice search to find properties by speaking naturally. Just click the microphone
                    icon on the search page and say what you're looking for.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You must be logged in to use voice search</li>
                    <li>• Regular users get 10 voice searches per day (resets at midnight)</li>
                    <li>• Manual text search is always available with no limits</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Three Ways to Book</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl p-6 border text-center">
                      <Search className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-medium mb-2">Book Directly</h4>
                      <p className="text-xs text-muted-foreground">Browse listings and book at listed prices</p>
                    </div>
                    <div className="bg-card rounded-xl p-6 border text-center">
                      <Gavel className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-medium mb-2">Place a Bid</h4>
                      <p className="text-xs text-muted-foreground">Offer your price on open listings</p>
                    </div>
                    <div className="bg-card rounded-xl p-6 border text-center">
                      <Plane className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-medium mb-2">Post a Request</h4>
                      <p className="text-xs text-muted-foreground">Tell us where you want to go; owners come to you</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Search & Book */}
            {activeRole === "renter" && (isPrinting || activeSection === "search-book") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Search & Book</h1>
                  <p className="text-xl text-muted-foreground">
                    Find your perfect vacation rental and book securely.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Search</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Enter your destination (city, state, or resort name)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Select your check-in and check-out dates</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Filter by price, amenities, or resort brand</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Click on a listing to view details and photos</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                  <h3 className="font-semibold text-lg mb-4">Voice Search</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the microphone icon next to the search button and speak naturally:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                    <li>• "Find 2-bedroom properties in Orlando near Disney"</li>
                    <li>• "Show me Hilton properties in Hawaii"</li>
                    <li>• "Properties with pool under $300 per night"</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Voice search requires a logged-in account. You have 10 voice searches per day.
                    A quota indicator next to the search bar shows your remaining searches.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Book</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review listing details, cancellation policy, and total price</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Click "Book Now" to proceed to checkout</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Complete secure payment via Stripe</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Owner confirms within 48 hours</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Receive confirmation email with details</span>
                    </li>
                  </ol>
                </div>
              </section>
            )}

            {/* Travel Requests */}
            {activeRole === "renter" && (isPrinting || activeSection === "travel-requests") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Submit Travel Requests</h1>
                  <p className="text-xl text-muted-foreground">
                    Tell us where you want to go and let property owners compete for your booking.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border">
                  <h3 className="font-semibold mb-3">How Travel Requests Work</h3>
                  <p className="text-sm text-muted-foreground">
                    Post your travel plans publicly. Property owners see your request and submit proposals 
                    with their best offers. You choose the one that fits your needs and budget.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Create a Travel Request</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to Marketplace and click "Post Travel Request"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Enter your destination (be specific or flexible)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Select your travel dates (or date range if flexible)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Set your budget (this is your target, not a binding offer)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                      <span>Add preferences (unit size, amenities, etc.)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">6</span>
                      <span>Submit and wait for owner proposals</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h4 className="font-medium mb-2">Review & Accept Proposals</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your dashboard for incoming proposals. Compare properties, prices, and owner ratings. 
                    Accept the best offer to proceed to booking.
                  </p>
                </div>
              </section>
            )}

            {/* Place Bids */}
            {activeRole === "renter" && (isPrinting || activeSection === "place-bids") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Place Bids on Listings</h1>
                  <p className="text-xl text-muted-foreground">
                    Found a property you love? Offer your price and see if the owner accepts.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Place a Bid</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Find listings marked "Open for Bidding" in search results</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Review the listing details and current asking price</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Click "Place Bid" and enter your offer amount</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Add a note to the owner (optional)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                      <span>Submit your bid before the deadline</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2">Bidding Tips</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Research similar listings to make competitive offers</li>
                    <li>• Bids closer to asking price are more likely to be accepted</li>
                    <li>• You can update your bid until the deadline</li>
                    <li>• If accepted, you'll proceed to payment immediately</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Check-in Process */}
            {activeRole === "renter" && (isPrinting || activeSection === "checkin") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Check-In Process</h1>
                  <p className="text-xl text-muted-foreground">
                    Confirm your arrival and report any issues for protected stays.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Before You Arrive
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Check-in instructions sent 24 hours before arrival</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Save owner contact information for arrival questions</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review property amenities and resort check-in procedures</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h4 className="font-medium text-green-800 mb-3">Confirm Your Check-In</h4>
                  <p className="text-sm text-green-700 mb-3">
                    After arriving, confirm check-in through your dashboard or the link in your confirmation email. 
                    This starts the countdown for owner payout and confirms everything is as expected.
                  </p>
                  <div className="bg-white rounded-lg p-4">
                    <ol className="text-sm text-green-800 space-y-2">
                      <li>1. Go to your booking details page</li>
                      <li>2. Click "Confirm Check-In"</li>
                      <li>3. Select "Everything looks great!" or report an issue</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Report an Issue
                  </h4>
                  <p className="text-sm text-red-700">
                    If something is wrong (access problems, cleanliness, safety concerns), report it immediately 
                    during check-in. RAV support will work with you and the owner to resolve the issue.
                  </p>
                </div>
              </section>
            )}

            {/* Renter Protection */}
            {activeRole === "renter" && (isPrinting || activeSection === "protection") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Renter Protection</h1>
                  <p className="text-xl text-muted-foreground">
                    Your booking is protected from payment to checkout.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-6 border">
                    <Shield className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">Escrow Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely until 5 days after checkout. Owners aren't paid until 
                      you've had a successful stay.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <FileCheck className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">Owner Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Verified owners have confirmed their identity and property ownership. Look for the 
                      "Verified Owner ✓" badge.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <Clock className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">48h Confirmation Guarantee</h4>
                    <p className="text-sm text-muted-foreground">
                      Owners must confirm within 48 hours. If they don't, you receive a full automatic refund.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <DollarSign className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">Guarantee Fund</h4>
                    <p className="text-sm text-muted-foreground">
                      3% of every transaction goes to a reserve fund for emergency resolutions when things go wrong.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Renter FAQ */}
            {activeRole === "renter" && (isPrinting || activeSection === "renter-faq") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Renter FAQ</h1>
                  <p className="text-xl text-muted-foreground">
                    Common questions from renters.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { q: "Why can't I use voice search?", a: "Voice search requires a logged-in, approved account. If you see a disabled microphone icon, sign in first. If your account is pending approval, wait for the approval email. If you've reached the daily limit of 10 searches, try again tomorrow or use manual text search." },
                    { q: "How do I get my account approved?", a: "After signing up, your account is reviewed by our team. You'll receive an email notification once approved (typically within 24 hours). Until then, you'll see a 'Pending Approval' page." },
                    { q: "What is the daily voice search limit?", a: "Regular users can perform up to 10 voice searches per day, resetting at midnight. A badge near the search bar shows your remaining searches. Manual text search has no limits." },
                    { q: "Is my payment secure?", a: "Yes, all payments are processed through Stripe and held in escrow until your stay completes successfully." },
                    { q: "What if the owner doesn't confirm?", a: "If the owner doesn't confirm within 48 hours, your booking is automatically cancelled with a full refund." },
                    { q: "Can I cancel my booking?", a: "Yes, but refund amount depends on the listing's cancellation policy (Flexible, Moderate, Strict, Super Strict)." },
                    { q: "What if the property isn't as described?", a: "Report the issue during check-in. RAV support will work to resolve it, potentially including relocation or refund." },
                    { q: "How do I contact the owner?", a: "Owner contact information is provided after booking confirmation, 24 hours before check-in." },
                    { q: "Are these real vacation club properties?", a: "Yes, all properties are from verified vacation club and timeshare owners. Verified owners have confirmed ownership documents." },
                    { q: "What's the Guarantee Fund?", a: "3% of each transaction is held in reserve to cover emergency situations requiring platform intervention." },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border">
                      <h4 className="font-medium mb-2">{item.q}</h4>
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>Rent-A-Vacation © 2024 — A Techsilon Group Company</p>
              <p className="mt-1">Jacksonville, FL • 1-800-RAV-0800 • rentavacation.com</p>
            </footer>
          </div>
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:break-after-page { page-break-after: always; }
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact;
          }
          aside { display: none !important; }
          header { display: none !important; }
          main { 
            padding: 0 !important; 
            margin: 0 !important;
          }
          section {
            page-break-inside: avoid;
            page-break-after: always;
            margin-bottom: 2rem;
          }
          section:last-of-type {
            page-break-after: auto;
          }
          .max-w-4xl {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default UserGuide;
