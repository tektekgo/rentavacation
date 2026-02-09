import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ShieldCheck,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  AlertTriangle,
  User,
  Star,
  TrendingUp,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import type { 
  Profile, 
  OwnerVerification, 
  VerificationDocument, 
  OwnerTrustLevel, 
  VerificationStatus,
  VerificationDocType 
} from "@/types/database";
import { TRUST_LEVEL_LABELS, TRUST_LEVEL_DESCRIPTIONS } from "@/types/database";

interface VerificationWithOwner extends OwnerVerification {
  owner: Profile;
  documents: VerificationDocument[];
}

const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Review", color: "bg-yellow-500", icon: <Clock className="h-4 w-4" /> },
  under_review: { label: "Under Review", color: "bg-blue-500", icon: <Eye className="h-4 w-4" /> },
  approved: { label: "Approved", color: "bg-green-500", icon: <CheckCircle2 className="h-4 w-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500", icon: <XCircle className="h-4 w-4" /> },
  expired: { label: "Expired", color: "bg-gray-500", icon: <AlertTriangle className="h-4 w-4" /> },
};

const DOC_TYPE_LABELS: Record<VerificationDocType, string> = {
  timeshare_deed: "Timeshare Deed",
  membership_certificate: "Membership Certificate",
  resort_contract: "Resort Contract",
  points_statement: "Points Statement",
  government_id: "Government ID",
  utility_bill: "Utility Bill",
  other: "Other Document",
};

const TRUST_LEVEL_COLORS: Record<OwnerTrustLevel, string> = {
  new: "bg-muted-foreground",
  verified: "bg-primary",
  trusted: "bg-accent",
  premium: "bg-primary",
};

const AdminVerifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<VerificationWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedVerification, setSelectedVerification] = useState<VerificationWithOwner | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [newTrustLevel, setNewTrustLevel] = useState<OwnerTrustLevel>("new");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVerifications = async () => {
    try {
      // Fetch all verifications with owner profile
      const { data: verificationsData, error: verificationsError } = await supabase
        .from("owner_verifications")
        .select(`
          *,
          owner:profiles!owner_id(*)
        `)
        .order("created_at", { ascending: false });

      if (verificationsError) throw verificationsError;

      // Fetch documents for each verification
      const { data: documentsData, error: documentsError } = await supabase
        .from("verification_documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (documentsError) throw documentsError;

      // Combine verifications with their documents
      const verificationsWithDocs: VerificationWithOwner[] = (verificationsData || []).map((v) => ({
        ...v,
        owner: v.owner,
        documents: (documentsData || []).filter((d) => d.verification_id === v.id),
      }));

      setVerifications(verificationsWithDocs);
    } catch (error) {
      console.error("Error fetching verifications:", error);
      toast({
        title: "Error",
        description: "Failed to load verifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleOpenReview = (verification: VerificationWithOwner) => {
    setSelectedVerification(verification);
    setNewTrustLevel(verification.trust_level);
    setReviewNotes("");
    setRejectionReason(verification.rejection_reason || "");
    setIsReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedVerification || !user) return;

    setIsSubmitting(true);
    try {
      // Update verification status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: verificationError } = await (supabase as any)
        .from("owner_verifications")
        .update({
          verification_status: "approved",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          trust_level: newTrustLevel,
          rejection_reason: null,
        })
        .eq("id", selectedVerification.id);

      if (verificationError) throw verificationError;

      // Update all pending documents to approved
      if (selectedVerification.documents.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: docsError } = await (supabase as any)
          .from("verification_documents")
          .update({
            status: "approved",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_notes: reviewNotes || null,
          })
          .eq("verification_id", selectedVerification.id)
          .in("status", ["pending", "under_review"]);

        if (docsError) throw docsError;
      }

      // Send email notification to owner
      try {
        await supabase.functions.invoke("send-verification-notification", {
          body: {
            ownerId: selectedVerification.owner_id,
            ownerEmail: selectedVerification.owner?.email,
            ownerName: selectedVerification.owner?.full_name || "",
            status: "approved",
            trustLevel: newTrustLevel,
          },
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Verification Approved",
        description: `Owner verified and trust level set to ${TRUST_LEVEL_LABELS[newTrustLevel]}. Notification sent.`,
      });

      setIsReviewDialogOpen(false);
      fetchVerifications();
    } catch (error) {
      console.error("Error approving verification:", error);
      toast({
        title: "Error",
        description: "Failed to approve verification.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !user || !rejectionReason.trim()) return;

    setIsSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: verificationError } = await (supabase as any)
        .from("owner_verifications")
        .update({
          verification_status: "rejected",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedVerification.id);

      if (verificationError) throw verificationError;

      // Update all pending documents to rejected
      if (selectedVerification.documents.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: docsError } = await (supabase as any)
          .from("verification_documents")
          .update({
            status: "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            rejection_reason: rejectionReason,
          })
          .eq("verification_id", selectedVerification.id)
          .in("status", ["pending", "under_review"]);

        if (docsError) throw docsError;
      }

      // Send email notification to owner
      try {
        await supabase.functions.invoke("send-verification-notification", {
          body: {
            ownerId: selectedVerification.owner_id,
            ownerEmail: selectedVerification.owner?.email,
            ownerName: selectedVerification.owner?.full_name || "",
            status: "rejected",
            rejectionReason: rejectionReason,
          },
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Verification Rejected",
        description: "Owner has been notified of the rejection via email.",
      });

      setIsReviewDialogOpen(false);
      fetchVerifications();
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast({
        title: "Error",
        description: "Failed to reject verification.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkUnderReview = async (verificationId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("owner_verifications")
        .update({
          verification_status: "under_review",
        })
        .eq("id", verificationId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: "Verification marked as under review.",
      });

      fetchVerifications();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("verification-documents")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting document URL:", error);
      toast({
        title: "Error",
        description: "Failed to access document.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleViewDocument = async (doc: VerificationDocument) => {
    const url = await getDocumentUrl(doc.file_path);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch =
      v.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || v.verification_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = verifications.filter((v) => v.verification_status === "pending").length;
  const underReviewCount = verifications.filter((v) => v.verification_status === "under_review").length;

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
          <h2 className="text-2xl font-bold">Owner Verifications</h2>
          <p className="text-muted-foreground">
            {pendingCount} pending, {underReviewCount} under review
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{underReviewCount}</p>
                <p className="text-sm text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {verifications.filter((v) => v.verification_status === "approved").length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {verifications.filter((v) => v.verification_status === "rejected").length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardContent className="p-0">
          {filteredVerifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No verifications found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all"
                  ? "Try different filters"
                  : "No owner verification requests yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Trust Level</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{verification.owner?.full_name || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{verification.owner?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${TRUST_LEVEL_COLORS[verification.trust_level]}`}>
                        {TRUST_LEVEL_LABELS[verification.trust_level]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{verification.documents.length} document(s)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_CONFIG[verification.verification_status].color} flex items-center gap-1 w-fit`}>
                        {STATUS_CONFIG[verification.verification_status].icon}
                        {STATUS_CONFIG[verification.verification_status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(verification.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {verification.verification_status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkUnderReview(verification.id)}
                          >
                            Start Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleOpenReview(verification)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Review Verification
            </DialogTitle>
            <DialogDescription>
              Review owner documents and update verification status
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Owner Details</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents ({selectedVerification.documents.length})
                </TabsTrigger>
                <TabsTrigger value="history">Track Record</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Name</Label>
                        <p className="font-medium">{selectedVerification.owner?.full_name || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium">{selectedVerification.owner?.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="font-medium">
                          {selectedVerification.phone_number || "Not provided"}
                          {selectedVerification.phone_verified && (
                            <CheckCircle2 className="inline h-4 w-4 ml-1 text-green-500" />
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">KYC Status</Label>
                        <p className="font-medium">
                          {selectedVerification.kyc_verified ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Verified
                            </span>
                          ) : (
                            <span className="text-yellow-600">Not Verified</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Set Trust Level</CardTitle>
                    <CardDescription>
                      Choose the appropriate trust level based on verification quality
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={newTrustLevel} onValueChange={(v) => setNewTrustLevel(v as OwnerTrustLevel)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["new", "verified", "trusted", "premium"] as OwnerTrustLevel[]).map((level) => (
                          <SelectItem key={level} value={level}>
                            <div className="flex items-center gap-2">
                              <Badge className={TRUST_LEVEL_COLORS[level]}>{TRUST_LEVEL_LABELS[level]}</Badge>
                              <span className="text-sm text-muted-foreground">
                                - {TRUST_LEVEL_DESCRIPTIONS[level]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                {selectedVerification.documents.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  selectedVerification.documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">{DOC_TYPE_LABELS[doc.doc_type]}</Badge>
                                <span>•</span>
                                <span>{format(new Date(doc.uploaded_at), "MMM d, yyyy")}</span>
                                {doc.file_size && (
                                  <>
                                    <span>•</span>
                                    <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={STATUS_CONFIG[doc.status].color}>
                              {STATUS_CONFIG[doc.status].label}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDocument(doc)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">{selectedVerification.successful_stays}</p>
                        <p className="text-sm text-muted-foreground">Successful Stays</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <FileText className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">{selectedVerification.total_bookings}</p>
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <XCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">{selectedVerification.cancellation_count}</p>
                        <p className="text-sm text-muted-foreground">Cancellations</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Star className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-2xl font-bold">
                          {selectedVerification.average_rating?.toFixed(1) || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Limits & Deposit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Max Active Listings</Label>
                        <p className="font-medium">{selectedVerification.max_active_listings}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Max Listing Value</Label>
                        <p className="font-medium">${selectedVerification.max_listing_value.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Security Deposit Required</Label>
                        <p className="font-medium">
                          {selectedVerification.security_deposit_required ? (
                            <span>${selectedVerification.security_deposit_amount?.toLocaleString() || 0}</span>
                          ) : (
                            <span className="text-green-600">Not Required</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Deposit Status</Label>
                        <p className="font-medium">
                          {selectedVerification.security_deposit_paid ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> Paid
                            </span>
                          ) : selectedVerification.security_deposit_required ? (
                            <span className="text-yellow-600">Pending</span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Review Notes */}
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                placeholder="Add any notes about this verification..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {selectedVerification?.verification_status !== "approved" && (
              <div>
                <Label htmlFor="rejectionReason">Rejection Reason (Required for rejection)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this verification is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsReviewDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerifications;
