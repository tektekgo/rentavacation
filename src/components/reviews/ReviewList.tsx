import { usePropertyReviews, type Review } from "@/hooks/useReviews";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/reviews/StarRating";
import { MessageSquare, User } from "lucide-react";
import { format } from "date-fns";

interface ReviewListProps {
  propertyId: string;
}

const ReviewCard = ({ review }: { review: Review }) => {
  const reviewerName = review.reviewer?.full_name || "Guest";
  const reviewDate = format(new Date(review.created_at), "MMM d, yyyy");

  return (
    <div className="border-b last:border-b-0 py-5 first:pt-0">
      {/* Reviewer info + rating */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{reviewerName}</p>
            <p className="text-xs text-muted-foreground">{reviewDate}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-semibold text-sm mb-1">{review.title}</h4>
      )}

      {/* Body */}
      {review.body && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.body}
        </p>
      )}

      {/* Owner response */}
      {review.owner_response && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/20">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Owner Response</span>
            {review.owner_responded_at && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.owner_responded_at), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{review.owner_response}</p>
        </div>
      )}
    </div>
  );
};

const ReviewList = ({ propertyId }: ReviewListProps) => {
  const { data: reviews, isLoading } = usePropertyReviews(propertyId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-b pb-5">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4 mt-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No reviews yet</p>
          <p className="text-xs text-muted-foreground">
            Be the first to share your experience at this property.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
};

export default ReviewList;
