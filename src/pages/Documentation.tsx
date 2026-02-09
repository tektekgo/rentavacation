import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronRight, 
  Home, 
  Users, 
  Building2, 
  Gavel, 
  CreditCard, 
  Shield, 
  FileCheck, 
  Mail, 
  Settings,
  Download,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  UserCheck,
  MapPin,
  Calendar,
  Briefcase
} from "lucide-react";

const Documentation = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sections = [
    { id: "overview", label: "Platform Overview", icon: Home },
    { id: "user-roles", label: "User Roles & Access", icon: Users },
    { id: "property-management", label: "Property Management", icon: Building2 },
    { id: "bidding-system", label: "Bidding & Marketplace", icon: Gavel },
    { id: "booking-flow", label: "Booking Flow", icon: Calendar },
    { id: "payments", label: "Payments & Payouts", icon: CreditCard },
    { id: "trust-safety", label: "Trust & Safety", icon: Shield },
    { id: "owner-verification", label: "Owner Verification", icon: UserCheck },
    { id: "confirmations", label: "Booking Confirmations", icon: FileCheck },
    { id: "cancellations", label: "Cancellation Policies", icon: AlertTriangle },
    { id: "notifications", label: "Email Notifications", icon: Mail },
    { id: "admin", label: "Admin Dashboard", icon: Settings },
  ];

  const handlePrint = () => {
    window.print();
  };

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
          <div className="flex items-center gap-3">
            <img src="/rav-logo.png" alt="RAV Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Rent-A-Vacation</h1>
              <p className="text-xs text-muted-foreground">Product Documentation v1.0</p>
            </div>
          </div>
          <div className="ml-auto">
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
            
            {/* Overview Section */}
            {activeSection === "overview" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Platform Overview</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Rent-A-Vacation is a premier vacation rental marketplace connecting vacation club and timeshare owners 
                    directly with travelers seeking authentic resort experiences at competitive prices.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-8 border">
                  <h2 className="text-2xl font-semibold mb-4">Name Your Price. Book Your Paradise.</h2>
                  <p className="text-muted-foreground">
                    Unlike traditional vacation rental platforms, Rent-A-Vacation empowers both owners and travelers 
                    through innovative price discovery mechanisms including reverse auctions and competitive bidding.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-card rounded-xl p-6 border shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Gavel className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Bidding Marketplace</h3>
                    <p className="text-sm text-muted-foreground">
                      Travelers submit travel requests; owners compete with proposals. Or owners open listings for competitive bidding.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Protected Transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Escrow holds funds until 5 days post-checkout. Owner verification and check-in confirmations ensure trust.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Premium Resorts</h3>
                    <p className="text-sm text-muted-foreground">
                      Access to major vacation club brands including Hilton, Marriott, Disney, Wyndham, and more.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Key Platform Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">15%</p>
                      <p className="text-sm text-muted-foreground">Platform Commission</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">48h</p>
                      <p className="text-sm text-muted-foreground">Confirmation Deadline</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">3%</p>
                      <p className="text-sm text-muted-foreground">Guarantee Fund</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">5 days</p>
                      <p className="text-sm text-muted-foreground">Post-Checkout Escrow</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* User Roles Section */}
            {activeSection === "user-roles" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">User Roles & Access</h1>
                  <p className="text-xl text-muted-foreground">
                    Rent-A-Vacation uses Role-Based Access Control (RBAC) to manage permissions across the platform.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">👑</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">RAV Owner</h3>
                        <p className="text-sm text-muted-foreground mb-3">Platform superuser with complete system access</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Full administrative dashboard access</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> User role management</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Financial reports and payout processing</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Listing approval/rejection</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🛡️</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">RAV Admin</h3>
                        <p className="text-sm text-muted-foreground mb-3">Platform administrator with operational access</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Administrative dashboard access</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Listing management and approval</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Booking oversight</li>
                          <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> Cannot manage user roles</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">RAV Staff</h3>
                        <p className="text-sm text-muted-foreground mb-3">Support staff with view and limited management access</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> View listings and bookings</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Customer support functions</li>
                          <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> No financial access</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">✓</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Property Owner</h3>
                        <p className="text-sm text-muted-foreground mb-3">Vacation club/timeshare owners listing their properties</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Owner Dashboard access</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Create and manage own properties</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Create listings and manage bids</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> View earnings and payout history</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Submit booking confirmations</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🧳</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Renter (Traveler)</h3>
                        <p className="text-sm text-muted-foreground mb-3">Default role for all new users</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Browse and search listings</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Book properties via Stripe</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Submit travel requests</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Place bids on open listings</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Confirm check-in on arrival</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Property Management Section */}
            {activeSection === "property-management" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Property Management</h1>
                  <p className="text-xl text-muted-foreground">
                    Owners register their vacation club properties and create rental listings for specific date ranges.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Supported Vacation Club Brands</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["Hilton Grand Vacations", "Marriott Vacation Club", "Disney Vacation Club", "Wyndham", 
                      "Hyatt Residence Club", "Bluegreen Vacations", "Holiday Inn Club", "Westgate Resorts"].map((brand) => (
                      <div key={brand} className="bg-muted/50 rounded-lg p-3 text-center text-sm">
                        {brand}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Property Workflow</h3>
                  
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 z-10">1</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Register Property</h4>
                        <p className="text-sm text-muted-foreground">Owner adds property details: resort name, location, unit type, amenities, and photos.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 z-10">2</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Verification (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Upload ownership documents for enhanced trust level and verification badge.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 z-10">3</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Create Listing</h4>
                        <p className="text-sm text-muted-foreground">Specify available dates, nightly rate, and cancellation policy for a rental period.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 z-10">4</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Pending Approval</h4>
                        <p className="text-sm text-muted-foreground">New listings default to 'pending_approval' status for admin review.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0 z-10">5</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Published</h4>
                        <p className="text-sm text-muted-foreground">Once approved, listing appears on marketplace and can receive bookings or bids.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Commission Structure</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Default Platform Commission</h4>
                      <p className="text-3xl font-bold text-primary">15%</p>
                      <p className="text-sm text-muted-foreground mt-1">Applied to the total booking amount</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Owner Payout</h4>
                      <p className="text-3xl font-bold text-primary">85%</p>
                      <p className="text-sm text-muted-foreground mt-1">Released 5 days after checkout</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Bidding System Section */}
            {activeSection === "bidding-system" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Bidding & Marketplace</h1>
                  <p className="text-xl text-muted-foreground">
                    Inspired by Priceline's "Name Your Own Price" model, our marketplace enables dynamic price discovery.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Gavel className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Owner-Led Bidding</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Owners open listings for competitive bidding with defined end dates and optional reserve prices.
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Set bidding end date and reserve price</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Travelers submit competing bids</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Owner selects winning bid</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Traveler Travel Requests</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Travelers post where they want to go, when, and their budget. Owners respond with proposals.
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Specify destination, dates, budget</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Receive proposals from multiple owners</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Accept best matching proposal</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Bidding Workflow</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Actions Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">open</span></td>
                          <td>Actively accepting bids/proposals</td>
                          <td>Submit bid, withdraw bid</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">pending</span></td>
                          <td>Bid submitted, awaiting response</td>
                          <td>Accept, reject, counter</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">accepted</span></td>
                          <td>Bid/proposal accepted</td>
                          <td>Proceed to checkout</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">rejected</span></td>
                          <td>Bid/proposal declined</td>
                          <td>Submit new bid</td>
                        </tr>
                        <tr>
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">expired</span></td>
                          <td>Bidding period ended</td>
                          <td>None</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Booking Flow Section */}
            {activeSection === "booking-flow" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Booking Flow</h1>
                  <p className="text-xl text-muted-foreground">
                    Complete end-to-end booking process from discovery to checkout confirmation.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-6">Standard Booking Journey</h3>
                  <div className="grid md:grid-cols-5 gap-4">
                    {[
                      { step: 1, title: "Browse", desc: "Search listings by location, dates, amenities" },
                      { step: 2, title: "Select", desc: "View property details and availability" },
                      { step: 3, title: "Book", desc: "Proceed to Stripe Checkout" },
                      { step: 4, title: "Confirm", desc: "Owner provides resort confirmation" },
                      { step: 5, title: "Stay", desc: "Check-in and enjoy vacation" },
                    ].map((item) => (
                      <div key={item.step} className="text-center">
                        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                          {item.step}
                        </div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment Processing
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Stripe Checkout</strong> - Secure payment collection</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Escrow Hold</strong> - Funds held until post-checkout</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Auto-confirmation</strong> - Booking recorded on success</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Post-Booking Requirements
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                        <span><strong>48h Deadline</strong> - Owner must submit resort confirmation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                        <span><strong>24h Check-in</strong> - Traveler confirms arrival</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <DollarSign className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>5-day Release</strong> - Payout after checkout</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-6 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">Important: Confirmation Deadlines</h3>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        If the owner fails to submit their resort confirmation number within 48 hours, 
                        the booking may be automatically cancelled and the traveler refunded in full.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Payments Section */}
            {activeSection === "payments" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Payments & Payouts</h1>
                  <p className="text-xl text-muted-foreground">
                    Secure payment processing with escrow protection and transparent payout tracking.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4">Payment Collection</h3>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <span className="font-medium">Powered by Stripe</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>• Secure credit/debit card processing</li>
                      <li>• PCI DSS compliant</li>
                      <li>• Support for major payment methods</li>
                      <li>• Automatic fraud detection</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4">Escrow Protection</h3>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">Funds Protected</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>• Funds held during entire stay</li>
                      <li>• Released 5 days after checkout</li>
                      <li>• Automatic refund on issues</li>
                      <li>• Admin dispute resolution</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Payout Lifecycle</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">Pending</span></td>
                          <td>Awaiting guest checkout</td>
                          <td>During stay</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">Processing</span></td>
                          <td>Stay completed, preparing payout</td>
                          <td>Checkout + 1-5 days</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Paid</span></td>
                          <td>Payout sent to owner</td>
                          <td>Checkout + 5 days</td>
                        </tr>
                        <tr>
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">Failed</span></td>
                          <td>Payout attempt failed</td>
                          <td>Requires admin action</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Payout Methods</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-medium mb-2">Zelle</h4>
                      <p className="text-sm text-muted-foreground">Instant bank transfers (US only)</p>
                    </div>
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-medium mb-2">Bank Transfer (ACH)</h4>
                      <p className="text-sm text-muted-foreground">Standard 1-3 business days</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * Payout processing is currently a manual administrative process
                  </p>
                </div>
              </section>
            )}

            {/* Trust & Safety Section */}
            {activeSection === "trust-safety" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Trust & Safety</h1>
                  <p className="text-xl text-muted-foreground">
                    Multi-layered protection framework ensuring secure transactions for all users.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      Owner Trust Levels
                    </h3>
                    <div className="space-y-3">
                      {[
                        { level: "New", desc: "Recently joined, building history", color: "bg-gray-100 text-gray-700" },
                        { level: "Verified", desc: "Identity & ownership confirmed", color: "bg-blue-100 text-blue-700" },
                        { level: "Trusted", desc: "Multiple successful bookings", color: "bg-green-100 text-green-700" },
                        { level: "Premium", desc: "Top-rated, exceptional track record", color: "bg-amber-100 text-amber-700" },
                      ].map((item) => (
                        <div key={item.level} className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.level}</span>
                          <span className="text-sm text-muted-foreground">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Protection Mechanisms
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Escrow</strong> - Funds held until post-checkout</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>48h Confirmation</strong> - Owner deadline for resort number</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Check-in Verification</strong> - Traveler confirms arrival</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>3% Guarantee Fund</strong> - Fraud protection reserve</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Issue Resolution Process</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { step: 1, title: "Report", desc: "Traveler reports issue at check-in" },
                      { step: 2, title: "Review", desc: "Admin reviews with evidence" },
                      { step: 3, title: "Resolve", desc: "Mediation or refund decision" },
                      { step: 4, title: "Close", desc: "Resolution and payout adjustment" },
                    ].map((item) => (
                      <div key={item.step} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-2">{item.step}</div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-6 border border-red-200 dark:border-red-900">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">Common Check-in Issues</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { issue: "No Access", desc: "Unable to access unit as booked" },
                      { issue: "Wrong Unit", desc: "Assigned different unit than reserved" },
                      { issue: "Safety Concern", desc: "Unsafe conditions or cleanliness" },
                    ].map((item) => (
                      <div key={item.issue} className="bg-white dark:bg-red-950 rounded-lg p-3">
                        <h4 className="font-medium text-red-700 dark:text-red-300">{item.issue}</h4>
                        <p className="text-xs text-red-600 dark:text-red-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Owner Verification Section */}
            {activeSection === "owner-verification" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Owner Verification</h1>
                  <p className="text-xl text-muted-foreground">
                    KYC and document verification process for property owners.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Verification Steps</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Identity Verification", desc: "Upload government-issued ID (driver's license, passport)", status: "Required" },
                      { step: 2, title: "Ownership Documentation", desc: "Timeshare deed, vacation club contract, or membership proof", status: "Required" },
                      { step: 3, title: "Contact Verification", desc: "Phone number and email confirmation", status: "Required" },
                      { step: 4, title: "Address Verification", desc: "Utility bill or bank statement with matching address", status: "Optional" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${item.status === 'Required' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-6 border border-green-200 dark:border-green-900">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Verified Owner Benefits</h3>
                    <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Verified badge on listings</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Higher search ranking</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Increased traveler trust</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Priority support</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-3">Document Storage</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      All verification documents are stored securely in private Supabase storage buckets 
                      with encrypted access controls.
                    </p>
                    <ul className="text-sm space-y-2">
                      <li>• Documents visible only to RAV admins</li>
                      <li>• 256-bit AES encryption at rest</li>
                      <li>• Automatic expiration reminders</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Booking Confirmations Section */}
            {activeSection === "confirmations" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Booking Confirmations</h1>
                  <p className="text-xl text-muted-foreground">
                    Two-stage confirmation system ensuring booking validity and successful stays.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Owner Confirmation</h3>
                        <p className="text-xs text-muted-foreground">48 hours after booking</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Owner must submit their resort confirmation number to validate the booking with the property.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>Failure to confirm:</strong> Booking cancelled, full refund to traveler
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Traveler Check-in</h3>
                        <p className="text-xs text-muted-foreground">24 hours after arrival</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Traveler confirms successful check-in or reports any issues encountered at the property.
                    </p>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        <strong>Successful check-in:</strong> Escrow countdown begins for payout release
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Automated Reminder System</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The platform automatically sends email reminders to ensure timely confirmations.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Reminder</th>
                          <th className="text-left py-2 font-medium">Recipient</th>
                          <th className="text-left py-2 font-medium">Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">New Booking Notification</td>
                          <td>Owner</td>
                          <td>Immediately after booking</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">Standard Reminder</td>
                          <td>Owner</td>
                          <td>6-12 hours before deadline</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">Urgent Reminder</td>
                          <td>Owner</td>
                          <td>&lt; 6 hours before deadline</td>
                        </tr>
                        <tr>
                          <td className="py-3">Check-in Reminder</td>
                          <td>Traveler</td>
                          <td>Around check-in time</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Cancellation Policies Section */}
            {activeSection === "cancellations" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Cancellation Policies</h1>
                  <p className="text-xl text-muted-foreground">
                    Four platform-defined cancellation tiers with automated refund calculations.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Flexible",
                      color: "bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-800",
                      textColor: "text-green-800 dark:text-green-200",
                      rules: [
                        { timing: "7+ days before check-in", refund: "100% refund" },
                        { timing: "3-7 days before check-in", refund: "50% refund" },
                        { timing: "< 3 days before check-in", refund: "No refund" },
                      ]
                    },
                    {
                      name: "Moderate",
                      color: "bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800",
                      textColor: "text-blue-800 dark:text-blue-200",
                      rules: [
                        { timing: "14+ days before check-in", refund: "100% refund" },
                        { timing: "7-14 days before check-in", refund: "50% refund" },
                        { timing: "< 7 days before check-in", refund: "No refund" },
                      ]
                    },
                    {
                      name: "Strict",
                      color: "bg-amber-100 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800",
                      textColor: "text-amber-800 dark:text-amber-200",
                      rules: [
                        { timing: "30+ days before check-in", refund: "100% refund" },
                        { timing: "14-30 days before check-in", refund: "50% refund" },
                        { timing: "< 14 days before check-in", refund: "No refund" },
                      ]
                    },
                    {
                      name: "Super Strict",
                      color: "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800",
                      textColor: "text-red-800 dark:text-red-200",
                      rules: [
                        { timing: "60+ days before check-in", refund: "100% refund" },
                        { timing: "30-60 days before check-in", refund: "50% refund" },
                        { timing: "< 30 days before check-in", refund: "No refund" },
                      ]
                    },
                  ].map((policy) => (
                    <div key={policy.name} className={`rounded-xl p-6 border ${policy.color}`}>
                      <h3 className={`font-semibold text-lg mb-4 ${policy.textColor}`}>{policy.name}</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {policy.rules.map((rule, idx) => (
                          <div key={idx} className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                            <p className={`text-sm font-medium ${policy.textColor}`}>{rule.timing}</p>
                            <p className={`text-lg font-bold ${policy.textColor}`}>{rule.refund}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Special Circumstances</h3>
                  <p className="text-sm text-muted-foreground">
                    In cases where the standard policy doesn't apply (e.g., owner-initiated cancellation, property issues, 
                    natural disasters), travelers and owners can negotiate directly with admin mediation available.
                  </p>
                </div>
              </section>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Email Notifications</h1>
                  <p className="text-xl text-muted-foreground">
                    Automated email delivery via Resend for all transactional communications.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Email Types</h3>
                  <div className="space-y-3">
                    {[
                      { type: "Welcome Email", recipient: "New Users", trigger: "On signup" },
                      { type: "New Booking Alert", recipient: "Owner", trigger: "When traveler books" },
                      { type: "Booking Confirmation", recipient: "Traveler", trigger: "After payment success" },
                      { type: "Confirmation Reminder", recipient: "Owner", trigger: "6-12h before deadline" },
                      { type: "Urgent Reminder", recipient: "Owner", trigger: "< 6h before deadline" },
                      { type: "Check-in Reminder", recipient: "Traveler", trigger: "Around check-in time" },
                      { type: "Verification Approved", recipient: "Owner", trigger: "On document approval" },
                      { type: "Payout Sent", recipient: "Owner", trigger: "After payout processed" },
                    ].map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{email.type}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{email.recipient}</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">{email.trigger}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-3">Sender Configuration</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-mono">rav@mail.ai-focus.org</p>
                      <p className="text-xs text-muted-foreground mt-1">Rent-A-Vacation Official</p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-3">Delivery Provider</h3>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
                        <span className="text-white font-bold text-sm">R</span>
                      </div>
                      <div>
                        <p className="font-medium">Resend</p>
                        <p className="text-xs text-muted-foreground">Transactional email delivery</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Admin Dashboard Section */}
            {activeSection === "admin" && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Admin Dashboard</h1>
                  <p className="text-xl text-muted-foreground">
                    Comprehensive administrative interface for platform management.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Dashboard Sections</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Overview", desc: "Key metrics and platform health", icon: Home },
                      { name: "Users", desc: "User management and roles", icon: Users },
                      { name: "Properties", desc: "All registered properties", icon: Building2 },
                      { name: "Listings", desc: "Listing approval queue", icon: Briefcase },
                      { name: "Bookings", desc: "All platform bookings", icon: Calendar },
                      { name: "Verifications", desc: "Owner document review", icon: UserCheck },
                      { name: "Confirmations", desc: "Booking confirmation status", icon: FileCheck },
                      { name: "Check-in Issues", desc: "Dispute resolution queue", icon: AlertTriangle },
                      { name: "Payouts", desc: "Payout processing", icon: DollarSign },
                      { name: "Financials", desc: "Revenue and commission reports", icon: CreditCard },
                      { name: "Escrow", desc: "Held funds management", icon: Shield },
                    ].map((section) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.name} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">{section.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">{section.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Access Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    Admin Dashboard is accessible only to users with <strong>rav_owner</strong> or <strong>rav_admin</strong> roles.
                    Access the dashboard at <code className="bg-muted px-2 py-1 rounded">/admin</code>
                  </p>
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
          .print\\:break-after-page { page-break-after: always; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default Documentation;
