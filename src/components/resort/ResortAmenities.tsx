import { Check } from "lucide-react";

interface ResortAmenitiesProps {
  amenities: string[];
  maxDisplay?: number;
}

export function ResortAmenities({ amenities, maxDisplay }: ResortAmenitiesProps) {
  const displayAmenities = maxDisplay ? amenities.slice(0, maxDisplay) : amenities;
  const remaining = maxDisplay && amenities.length > maxDisplay
    ? amenities.length - maxDisplay
    : 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {displayAmenities.map((amenity, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{amenity}</span>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-sm text-muted-foreground">
          +{remaining} more amenities
        </p>
      )}
    </div>
  );
}
