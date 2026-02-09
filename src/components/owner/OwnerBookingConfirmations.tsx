import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Phone,
  Shield,
  Timer,
  Upload,
  User,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes, isPast } from "date-fns";
import type { BookingConfirmation, Booking, Listing, Property, Profile, EscrowStatus } from "@/types/database";

interface ConfirmationWithDetails extends BookingConfirmation {
  booking: Booking & {
    listing: Listing & { property: Property };
    renter: Profile;
  };
}

const ESCROW_STATUS_CONFIG: Record<EscrowStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending_confirmation: { 
    label: "Awaiting Confirmation", 
    color: "bg-yellow-500", 
    icon: <Clock className="h-4 w-4" /> 
  },
  confirmation_submitted: { 
    label: "Confirmation Submitted", 
    color: "bg-blue-500", 
    icon: <FileText className="h-4 w-4" /> 
  },
  verified: { 
    label: "Verified", 
    color: "bg-green-500", 
    icon: <CheckCircle2 className="h-4 w-4" /> 
  },
  released: { 
    label: "Funds Released", 
    color: "bg-primary", 
    icon: <Shield className="h-4 w-4" /> 
  },
  refunded: { 
    label: "Refunded", 
    color: "bg-red-500", 
    icon: <XCircle className="h-4 w-4" /> 
  },
  disputed: { 
    label: "Disputed", 
    color: "bg-destructive", 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
};

const OwnerBookingConfirmations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [confirmations, setConfirmations] = useState<ConfirmationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfirmation, setSelectedConfirmation] = useState<ConfirmationWithDetails | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setCurrentTime] = useState(new Date());

  // Form state
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [resortContactName, setResortContactName] = useState("");
  const [resortContactPhone, setResortContactPhone] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchConfirmations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("booking_confirmations")
        .select(`
          *,
          booking:bookings(
            *,
            listing:listings(
              *,
              property:properties(*)
            ),
            renter:profiles(*)
          )
        `)
        .eq("owner_id", user.id)
        .order("confirmation_deadline", { ascending: true });

      if (error) throw error;
      setConfirmations(data as ConfirmationWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching confirmations:", error);
      toast({
        title: "Error",
        description: "Failed to load booking confirmations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchConfirmations();
  }, [fetchConfirmations]);

  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (isPast(deadlineDate)) {
      return { expired: true, text: "Deadline passed", urgent: true };
    }

    const hoursRemaining = differenceInHours(deadlineDate, now);
    const minutesRemaining = differenceInMinutes(deadlineDate, now) % 60;

    if (hoursRemaining < 6) {
      return { 
        expired: false, 
        text: `${hoursRemaining}h ${minutesRemaining}m remaining`, 
        urgent: true 
      };
    } else if (hoursRemaining < 24) {
      return { 
        expired: false, 
        text: `${hoursRemaining}h remaining`, 
        urgent: true 
      };
    } else {
      return { 
        expired: false, 
        text: formatDistanceToNow(deadlineDate, { addSuffix: true }), 
        urgent: false 
      };
    }
  };

  const handleOpenSubmitDialog = (confirmation: ConfirmationWithDetails) => {
    setSelectedConfirmation(confirmation);
    setConfirmationNumber(confirmation.resort_confirmation_number || "");
    setResortContactName(confirmation.resort_contact_name || "");
    setResortContactPhone(confirmation.resort_contact_phone || "");
    setAdditionalNotes("");
    setIsSubmitDialogOpen(true);
  };

  const handleSubmitConfirmation = async () => {
    if (!selectedConfirmation || !confirmationNumber.trim()) {
      toast({
        title: "Error",
        description: "Resort confirmation number is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("booking_confirmations")
        .update({
          resort_confirmation_number: confirmationNumber.trim(),
          resort_contact_name: resortContactName.trim() || null,
          resort_contact_phone: resortContactPhone.trim() || null,
          confirmation_submitted_at: new Date().toISOString(),
          escrow_status: "confirmation_submitted",
        })
        .eq("id", selectedConfirmation.id);

      if (error) throw error;

      toast({
        title: "Confirmation Submitted",
        description: "Your resort confirmation has been submitted for verification.",
      });

      setIsSubmitDialogOpen(false);
      fetchConfirmations();
    } catch (error) {
      console.error("Error submitting confirmation:", error);
      toast({
        title: "Error",
        description: "Failed to submit confirmation.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Separate pending confirmations for priority display
  const pendingConfirmations = confirmations.filter(
    (c) => c.escrow_status === "pending_confirmation"
  );
  const submittedConfirmations = confirmations.filter(
    (c) => c.escrow_status !== "pending_confirmation"
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Booking Confirmations</h2>
        <p className="text-muted-foreground">
          Submit resort confirmation numbers within 48 hours to release escrow funds
        </p>
      </div>

      {/* Urgent Confirmations Alert */}
      {pendingConfirmations.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                {pendingConfirmations.length} Confirmation{pendingConfirmations.length !== 1 ? "s" : ""} Required
              </CardTitle>
            </div>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Submit resort confirmation numbers before the deadline to avoid booking issues
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Pending Confirmations */}
      {pendingConfirmations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Timer className="h-5 w-5 text-yellow-600" />
            Action Required
          </h3>
          {pendingConfirmations.map((confirmation) => {
            const timeInfo = getTimeRemaining(confirmation.confirmation_deadline);
            return (
              <Card 
                key={confirmation.id} 
                className={timeInfo.urgent ? "border-yellow-500" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={ESCROW_STATUS_CONFIG[confirmation.escrow_status].color}>
                          {ESCROW_STATUS_CONFIG[confirmation.escrow_status].icon}
                          <span className="ml-1">{ESCROW_STATUS_CONFIG[confirmation.escrow_status].label}</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {confirmation.booking?.listing?.property?.resort_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {confirmation.booking?.listing?.property?.location}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Escrow Amount</p>
                      <p className="text-xl font-bold">${confirmation.escrow_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Countdown Timer */}
                  <div className={`flex items-center justify-between p-4 rounded-lg ${
                    timeInfo.urgent 
                      ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" 
                      : "bg-muted"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        timeInfo.urgent 
                          ? "bg-yellow-200 dark:bg-yellow-800" 
                          : "bg-background"
                      }`}>
                        <Clock className={`h-5 w-5 ${
                          timeInfo.urgent 
                            ? "text-yellow-700 dark:text-yellow-300" 
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div>
                        <p className={`font-semibold ${
                          timeInfo.urgent 
                            ? "text-yellow-800 dark:text-yellow-200" 
                            : ""
                        }`}>
                          {timeInfo.expired ? "⚠️ Deadline Passed" : "Deadline"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(confirmation.confirmation_deadline), "PPp")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        timeInfo.urgent 
                          ? "text-yellow-700 dark:text-yellow-300" 
                          : ""
                      }`}>
                        {timeInfo.text}
                      </p>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(confirmation.booking?.listing?.check_in_date), "MMM d")} -{" "}
                          {format(new Date(confirmation.booking?.listing?.check_out_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">Stay dates</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{confirmation.booking?.renter?.full_name || "Guest"}</p>
                        <p className="text-sm text-muted-foreground">
                          {confirmation.booking?.guest_count} guest{confirmation.booking?.guest_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    className="w-full" 
                    onClick={() => handleOpenSubmitDialog(confirmation)}
                    disabled={timeInfo.expired}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Resort Confirmation
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submitted/Completed Confirmations */}
      {submittedConfirmations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Submitted Confirmations
          </h3>
          {submittedConfirmations.map((confirmation) => (
            <Card key={confirmation.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={ESCROW_STATUS_CONFIG[confirmation.escrow_status].color}>
                        {ESCROW_STATUS_CONFIG[confirmation.escrow_status].icon}
                        <span className="ml-1">{ESCROW_STATUS_CONFIG[confirmation.escrow_status].label}</span>
                      </Badge>
                      {confirmation.verified_by_rav && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Shield className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {confirmation.booking?.listing?.property?.resort_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {confirmation.booking?.listing?.property?.location}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Escrow Amount</p>
                    <p className="text-xl font-bold">${confirmation.escrow_amount.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {confirmation.resort_confirmation_number && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{confirmation.resort_confirmation_number}</p>
                        <p className="text-sm text-muted-foreground">Confirmation #</p>
                      </div>
                    </div>
                  )}
                  {confirmation.confirmation_submitted_at && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(confirmation.confirmation_submitted_at), "PPp")}
                        </p>
                        <p className="text-sm text-muted-foreground">Submitted</p>
                      </div>
                    </div>
                  )}
                  {confirmation.resort_contact_name && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{confirmation.resort_contact_name}</p>
                        <p className="text-sm text-muted-foreground">Resort Contact</p>
                      </div>
                    </div>
                  )}
                  {confirmation.resort_contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{confirmation.resort_contact_phone}</p>
                        <p className="text-sm text-muted-foreground">Contact Phone</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stay Dates */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(confirmation.booking?.listing?.check_in_date), "MMM d")} -{" "}
                        {format(new Date(confirmation.booking?.listing?.check_out_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Guest: {confirmation.booking?.renter?.full_name || "Guest"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Update button for submitted but not verified */}
                {confirmation.escrow_status === "confirmation_submitted" && !confirmation.verified_by_rav && (
                  <Button 
                    variant="outline"
                    className="mt-4 w-full" 
                    onClick={() => handleOpenSubmitDialog(confirmation)}
                  >
                    Update Confirmation Details
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {confirmations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No booking confirmations</h3>
            <p className="text-muted-foreground text-center max-w-md">
              When travelers book your listings, you'll need to submit resort confirmation numbers here within 48 hours.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Resort Confirmation</DialogTitle>
            <DialogDescription>
              Enter the confirmation details from the resort for{" "}
              {selectedConfirmation?.booking?.listing?.property?.resort_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmation-number">
                Resort Confirmation Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmation-number"
                placeholder="e.g., RES-12345678"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resort-contact-name">Resort Contact Name</Label>
              <Input
                id="resort-contact-name"
                placeholder="e.g., John Smith"
                value={resortContactName}
                onChange={(e) => setResortContactName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resort-contact-phone">Resort Contact Phone</Label>
              <Input
                id="resort-contact-phone"
                placeholder="e.g., (555) 123-4567"
                value={resortContactPhone}
                onChange={(e) => setResortContactPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional-notes">Additional Notes</Label>
              <Textarea
                id="additional-notes"
                placeholder="Any additional information..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSubmitDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitConfirmation}
              disabled={isSubmitting || !confirmationNumber.trim()}
            >
              {isSubmitting ? "Submitting..." : "Submit Confirmation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerBookingConfirmations;
