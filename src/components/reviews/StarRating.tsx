import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const StarRating = ({
  rating,
  maxStars = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
  const sizeClass = SIZE_CLASSES[size];

  const handleClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex);
    }
  };

  const handleMouseEnter = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? "Rating selector" : `Rating: ${rating} out of ${maxStars} stars`}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFull = starIndex <= Math.floor(displayRating);
        const isHalf = !isFull && starIndex === Math.ceil(displayRating) && displayRating % 1 >= 0.25;

        return (
          <button
            key={starIndex}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            className={cn(
              "relative p-0 border-0 bg-transparent",
              interactive
                ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                : "cursor-default"
            )}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? starIndex === rating : undefined}
            aria-label={interactive ? `${starIndex} star${starIndex !== 1 ? "s" : ""}` : undefined}
            tabIndex={interactive ? 0 : -1}
          >
            {/* Background (empty) star */}
            <Star className={cn(sizeClass, "text-gray-300")} />

            {/* Filled overlay */}
            {(isFull || isHalf) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: isFull ? "100%" : "50%" }}
              >
                <Star className={cn(sizeClass, "fill-current text-yellow-400")} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
