import { usePropertyReviewSummary } from "@/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StarRating from "@/components/reviews/StarRating";
import { Star } from "lucide-react";

interface ReviewSummaryProps {
  propertyId: string;
}

const SUB_RATING_LABELS: { key: string; label: string }[] = [
  { key: "avg_cleanliness", label: "Cleanliness" },
  { key: "avg_accuracy", label: "Accuracy" },
  { key: "avg_communication", label: "Communication" },
  { key: "avg_location", label: "Location" },
  { key: "avg_value", label: "Value" },
];

const RatingBar = ({ label, value }: { label: string; value: number | null }) => {
  if (value === null) return null;

  const percentage = (value / 5) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-24 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium w-7 text-right">{value}</span>
    </div>
  );
};

const ReviewSummary = ({ propertyId }: ReviewSummaryProps) => {
  const { data: summary, isLoading } = usePropertyReviewSummary(propertyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.review_count === 0) {
    return null;
  }

  const hasSubRatings = SUB_RATING_LABELS.some(
    ({ key }) => (summary as Record<string, unknown>)[key] !== null
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          Guest Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main rating */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{summary.avg_rating}</span>
          <div>
            <StarRating rating={Number(summary.avg_rating) || 0} size="sm" />
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.review_count} review{summary.review_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Sub-rating progress bars */}
        {hasSubRatings && (
          <div className="space-y-2 pt-2 border-t">
            {SUB_RATING_LABELS.map(({ key, label }) => (
              <RatingBar
                key={key}
                label={label}
                value={
                  (summary as Record<string, number | null>)[key] ?? null
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSummary;
