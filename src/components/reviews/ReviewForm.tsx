import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitReview } from "@/hooks/useReviews";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StarRating from "@/components/reviews/StarRating";
import { Loader2, CheckCircle } from "lucide-react";

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  listingId: string;
  propertyId: string;
  ownerId: string;
  resortName: string;
}

const SUB_RATING_LABELS = [
  { key: "rating_cleanliness", label: "Cleanliness" },
  { key: "rating_accuracy", label: "Accuracy" },
  { key: "rating_communication", label: "Communication" },
  { key: "rating_location", label: "Location" },
  { key: "rating_value", label: "Value" },
] as const;

type SubRatingKey = typeof SUB_RATING_LABELS[number]["key"];

const ReviewForm = ({
  open,
  onOpenChange,
  bookingId,
  listingId,
  propertyId,
  ownerId,
  resortName,
}: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const submitReview = useSubmitReview();

  const [overallRating, setOverallRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [subRatings, setSubRatings] = useState<Record<SubRatingKey, number>>({
    rating_cleanliness: 0,
    rating_accuracy: 0,
    rating_communication: 0,
    rating_location: 0,
    rating_value: 0,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubRatingChange = (key: SubRatingKey, value: number) => {
    setSubRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!user || overallRating === 0) return;

    const reviewData: Parameters<typeof submitReview.mutate>[0] = {
      booking_id: bookingId,
      listing_id: listingId,
      property_id: propertyId,
      reviewer_id: user.id,
      owner_id: ownerId,
      rating: overallRating,
    };

    if (title.trim()) reviewData.title = title.trim();
    if (body.trim()) reviewData.body = body.trim();

    // Only include sub-ratings that were set (non-zero)
    for (const { key } of SUB_RATING_LABELS) {
      if (subRatings[key] > 0) {
        reviewData[key] = subRatings[key];
      }
    }

    submitReview.mutate(reviewData, {
      onSuccess: () => {
        setSubmitted(true);
        toast({
          title: "Review submitted",
          description: "Thank you for sharing your experience!",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to submit review",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      // Reset form state when closing
      setOverallRating(0);
      setTitle("");
      setBody("");
      setSubRatings({
        rating_cleanliness: 0,
        rating_accuracy: 0,
        rating_communication: 0,
        rating_location: 0,
        rating_value: 0,
      });
      setSubmitted(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-6">
              Your review for {resortName} has been published.
            </p>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
              <DialogDescription>
                Share your experience at {resortName}. Your review helps other
                travelers make informed decisions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Overall Rating */}
              <div className="space-y-2">
                <Label>Overall Rating *</Label>
                <div className="flex items-center gap-3">
                  <StarRating
                    rating={overallRating}
                    size="lg"
                    interactive
                    onChange={setOverallRating}
                  />
                  {overallRating > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {overallRating} / 5
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="review-title">Title</Label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  maxLength={100}
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="review-body">Your Review</Label>
                <Textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What did you enjoy? Anything to improve?"
                  rows={4}
                />
              </div>

              {/* Sub-ratings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Detailed Ratings{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUB_RATING_LABELS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {label}
                      </span>
                      <StarRating
                        rating={subRatings[key]}
                        size="sm"
                        interactive
                        onChange={(v) => handleSubRatingChange(key, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={overallRating === 0 || submitReview.isPending}
                >
                  {submitReview.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewForm;
