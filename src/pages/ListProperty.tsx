import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ResortSelector } from "@/components/resort/ResortSelector";
import { UnitTypeSelector } from "@/components/resort/UnitTypeSelector";
import { ResortPreview } from "@/components/resort/ResortPreview";
import {
  Home,
  Camera,
  Calendar,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Shield,
  Users,
  Star,
  Upload,
  MapPin,
} from "lucide-react";
import type { VacationClubBrand, Resort, ResortUnitType } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { RoleUpgradeDialog } from "@/components/RoleUpgradeDialog";

const benefits = [
  {
    icon: DollarSign,
    title: "Offset Maintenance Fees",
    description: "Earn money from your unused weeks to cover annual fees and more.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description: "We handle all payments securely. No chasing renters for money.",
  },
  {
    icon: Users,
    title: "Verified Renters",
    description: "All renters go through our verification process for your peace of mind.",
  },
  {
    icon: Star,
    title: "Full Control",
    description: "Set your own prices, availability, and approve every booking request.",
  },
];

const steps = [
  {
    number: 1,
    title: "Create Your Account",
    description: "Sign up for free and verify your email to get started.",
  },
  {
    number: 2,
    title: "Add Property Details",
    description: "Select your resort, unit type, and we'll auto-fill the details.",
  },
  {
    number: 3,
    title: "Verify Ownership",
    description: "Upload proof of ownership for verification (usually takes 24-48 hours).",
  },
  {
    number: 4,
    title: "Set Pricing & Availability",
    description: "Choose your nightly rate and mark available dates on your calendar.",
  },
  {
    number: 5,
    title: "Start Earning",
    description: "Your listing goes live and renters can book your property!",
  },
];

const BRAND_LABELS: Record<string, string> = {
  hilton_grand_vacations: "Hilton Grand Vacations",
  marriott_vacation_club: "Marriott Vacation Club",
  disney_vacation_club: "Disney Vacation Club",
  other: "Other / Not Listed",
};

type ResortSummary = Pick<
  Resort,
  "id" | "brand" | "resort_name" | "location" | "guest_rating"
>;

const ListProperty = () => {
  const navigate = useNavigate();
  const { user, isPropertyOwner } = useAuth();
  const [formStep, setFormStep] = useState(1);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  // Resort selection state
  const [selectedBrand, setSelectedBrand] = useState<VacationClubBrand | "">("");
  const [selectedResort, setSelectedResort] = useState<ResortSummary | null>(null);
  const [resortDetails, setResortDetails] = useState<Resort | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<ResortUnitType | null>(null);
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Form fields (auto-populated from resort/unit selection)
  const [resortName, setResortName] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [sleeps, setSleeps] = useState("");
  const [description, setDescription] = useState("");

  // Load full resort details when selected
  useEffect(() => {
    if (selectedResort) {
      loadResortDetails(selectedResort.id);
    }
  }, [selectedResort]);

  async function loadResortDetails(resortId: string) {
    const { data } = await supabase
      .from("resorts")
      .select("*")
      .eq("id", resortId)
      .single();

    if (data) {
      setResortDetails(data as Resort);
      const resort = data as Record<string, unknown>;
      const loc = resort.location as Record<string, string> | null;
      setResortName(resort.resort_name as string);
      setLocation(loc?.full_address || `${loc?.city}, ${loc?.state}`);
      setDescription((resort.description as string) || "");
    }
  }

  function handleBrandChange(brand: string) {
    setSelectedBrand(brand as VacationClubBrand);
    setSelectedResort(null);
    setResortDetails(null);
    setSelectedUnitType(null);
    setIsManualEntry(brand === "other");
    if (brand === "other") {
      setResortName("");
      setLocation("");
      setBedrooms("");
      setBathrooms("");
      setSleeps("");
      setDescription("");
    }
  }

  function handleResortSelect(resort: ResortSummary) {
    setSelectedResort(resort);
    setSelectedUnitType(null);
  }

  function handleUnitTypeSelect(unitType: ResortUnitType) {
    setSelectedUnitType(unitType);
    // Auto-populate from unit type
    setBedrooms(unitType.bedrooms.toString());
    setBathrooms(unitType.bathrooms.toString());
    setSleeps(unitType.max_occupancy.toString());
  }

  const canProceedStep1 =
    isManualEntry
      ? resortName && location && bedrooms && bathrooms && sleeps
      : selectedResort && selectedUnitType;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 hero-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Turn Your Timeshare Into Income
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            List your vacation ownership for free. Rent out your unused weeks and
            offset your maintenance fees or earn extra income.
          </p>
          <Button
            variant="hero"
            size="xl"
            onClick={() => {
              if (user) {
                navigate("/owner-dashboard?tab=properties");
              } else {
                document.getElementById('listing-form')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            {user ? "Go to Owner Dashboard" : "List Your Property Free"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-card text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How to List Your Property
            </h2>
            <p className="text-muted-foreground text-lg">
              Get started in just a few minutes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />

              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`relative flex items-start gap-6 mb-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div
                    className={`bg-card rounded-xl p-6 shadow-card flex-1 ${
                      index % 2 === 0 ? "md:mr-auto md:max-w-[calc(50%-3rem)]" : "md:ml-auto md:max-w-[calc(50%-3rem)]"
                    }`}
                  >
                    <h3 className="font-display font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Listing Form */}
      <section id="listing-form" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Start Your Listing
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below to get started. It only takes a few minutes!
              </p>
            </div>

            <div className="bg-card rounded-2xl shadow-card-hover p-8">
              {/* Progress */}
              <div className="flex items-center justify-between mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        formStep >= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {formStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-24 h-1 mx-2 ${
                          formStep > step ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Property Information with Resort Selection */}
              {formStep === 1 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg mb-4">Property Information</h3>

                  {/* Brand Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Vacation Club Brand
                    </label>
                    <Select
                      value={selectedBrand}
                      onValueChange={handleBrandChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your vacation club" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BRAND_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resort Selection (for known brands) */}
                  {selectedBrand && selectedBrand !== "other" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Your Resort
                      </label>
                      <ResortSelector
                        selectedBrand={selectedBrand}
                        onResortSelect={handleResortSelect}
                        selectedResortId={selectedResort?.id}
                      />
                      {/* Resort not listed fallback */}
                      <button
                        type="button"
                        className="mt-2 text-xs text-primary hover:underline"
                        onClick={() => {
                          setIsManualEntry(true);
                          setSelectedResort(null);
                          setResortDetails(null);
                          setSelectedUnitType(null);
                          setResortName("");
                          setLocation("");
                          setBedrooms("");
                          setBathrooms("");
                          setSleeps("");
                          setDescription("");
                        }}
                      >
                        My resort is not listed
                      </button>
                    </div>
                  )}

                  {/* Unit Type Selection */}
                  {selectedResort && !isManualEntry && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Unit Type
                      </label>
                      <UnitTypeSelector
                        resortId={selectedResort.id}
                        onUnitTypeSelect={handleUnitTypeSelect}
                        selectedUnitTypeId={selectedUnitType?.id}
                      />
                    </div>
                  )}

                  {/* Resort Preview */}
                  {resortDetails && !isManualEntry && (
                    <ResortPreview
                      resort={resortDetails}
                      unitType={selectedUnitType}
                    />
                  )}

                  {/* Manual Entry Fields (for "other" brand or "not listed") */}
                  {isManualEntry && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Resort Name</label>
                        <Input
                          placeholder="e.g., Marriott's Ko Olina Beach Club"
                          value={resortName}
                          onChange={(e) => setResortName(e.target.value)}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="City, State/Country"
                              className="pl-10"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Bedrooms</label>
                          <Input
                            type="number"
                            placeholder="e.g., 2"
                            value={bedrooms}
                            onChange={(e) => setBedrooms(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Sleeps</label>
                          <Input
                            type="number"
                            placeholder="e.g., 6"
                            value={sleeps}
                            onChange={(e) => setSleeps(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Bathrooms</label>
                          <Input
                            type="number"
                            placeholder="e.g., 2"
                            value={bathrooms}
                            onChange={(e) => setBathrooms(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <Textarea
                          placeholder="Describe your property, views, nearby attractions..."
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      {/* Back to resort selector */}
                      {selectedBrand && selectedBrand !== "other" && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            setIsManualEntry(false);
                          }}
                        >
                          Back to resort selector
                        </button>
                      )}
                    </>
                  )}

                  {/* Auto-populated summary (for resort selection mode) */}
                  {selectedUnitType && !isManualEntry && (
                    <div className="bg-primary/5 rounded-lg p-4 space-y-1">
                      <p className="text-sm font-medium text-primary">
                        Auto-populated from resort data:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {resortName} — {selectedUnitType.unit_type_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUnitType.bedrooms === 0 ? "Studio" : `${selectedUnitType.bedrooms} Bedrooms`},{" "}
                        {selectedUnitType.bathrooms} Bathrooms, Sleeps {selectedUnitType.max_occupancy}
                      </p>
                      {selectedUnitType.square_footage && (
                        <p className="text-sm text-muted-foreground">
                          {selectedUnitType.square_footage} sq ft — {selectedUnitType.kitchen_type}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => setFormStep(2)}
                    disabled={!canProceedStep1}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Photos */}
              {formStep === 2 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg mb-4">Photos</h3>
                  <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">
                      Drag & drop photos here, or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Upload at least 5 photos. High quality images get more bookings!
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Camera className="w-4 h-4 mr-2" />
                      Select Photos
                    </Button>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setFormStep(1)}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setFormStep(3)}>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {formStep === 3 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg mb-4">Pricing & Availability</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nightly Rate ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="number" placeholder="e.g., 199" className="pl-10" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set your own price — you control your earnings
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Available Dates</label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="pl-10" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="font-medium">No listing fees</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We only charge a small service fee when you receive a booking.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setFormStep(2)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        if (!user) {
                          navigate("/signup");
                        } else if (isPropertyOwner()) {
                          navigate("/owner-dashboard?tab=properties");
                        } else {
                          setUpgradeDialogOpen(true);
                        }
                      }}
                    >
                      {!user
                        ? "Create Account & List"
                        : isPropertyOwner()
                          ? "Go to Owner Dashboard"
                          : "Become a Property Owner"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  <RoleUpgradeDialog
                    open={upgradeDialogOpen}
                    onOpenChange={setUpgradeDialogOpen}
                    requestedRole="property_owner"
                    context="list your property"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-12">
            What Owners Are Saying
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                quote: "I've covered my entire maintenance fee for the year plus made extra income!",
                name: "Michael T.",
                location: "Orlando, FL",
              },
              {
                quote: "The process was so easy. I had my first booking within a week of listing.",
                name: "Patricia K.",
                location: "San Diego, CA",
              },
              {
                quote: "Finally a platform that treats timeshare owners fairly. Highly recommend!",
                name: "Robert M.",
                location: "Las Vegas, NV",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex gap-1 justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.quote}"</p>
                <div className="text-sm text-muted-foreground">
                  {testimonial.name} • {testimonial.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ListProperty;
