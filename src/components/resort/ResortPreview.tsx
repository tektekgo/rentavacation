import type { Resort, ResortUnitType } from "@/types/database";
import { MapPin, Star, Phone, Clock, Car, PawPrint } from "lucide-react";

type ResortInfo = Pick<
  Resort,
  | "resort_name"
  | "location"
  | "guest_rating"
  | "description"
  | "resort_amenities"
  | "policies"
  | "contact"
>;

interface ResortPreviewProps {
  resort: ResortInfo;
  unitType?: ResortUnitType | null;
}

export function ResortPreview({ resort, unitType }: ResortPreviewProps) {
  if (!resort) return null;

  return (
    <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
      {/* Resort header */}
      <div>
        <h3 className="font-semibold text-lg">{resort.resort_name}</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {resort.location.city}, {resort.location.state}
        </p>
      </div>

      {/* Rating */}
      {resort.guest_rating && (
        <div className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-warning text-warning" />
          <span className="font-medium">{resort.guest_rating}</span>
          <span className="text-sm text-muted-foreground">Guest Rating</span>
        </div>
      )}

      {/* Description */}
      {resort.description && (
        <p className="text-sm text-muted-foreground">{resort.description}</p>
      )}

      {/* Unit type details */}
      {unitType && (
        <div className="border-t pt-3 mt-3">
          <h4 className="font-medium text-sm mb-2">
            Selected: {unitType.unit_type_name}
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Bedrooms: </span>
              <span className="font-medium">
                {unitType.bedrooms === 0 ? "Studio" : unitType.bedrooms}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Bathrooms: </span>
              <span className="font-medium">{unitType.bathrooms}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sleeps: </span>
              <span className="font-medium">{unitType.max_occupancy}</span>
            </div>
            {unitType.square_footage && (
              <div>
                <span className="text-muted-foreground">Size: </span>
                <span className="font-medium">
                  {unitType.square_footage} sq ft
                </span>
              </div>
            )}
            {unitType.kitchen_type && (
              <div>
                <span className="text-muted-foreground">Kitchen: </span>
                <span className="font-medium">{unitType.kitchen_type}</span>
              </div>
            )}
            {unitType.bedding_config && (
              <div>
                <span className="text-muted-foreground">Bedding: </span>
                <span className="font-medium">{unitType.bedding_config}</span>
              </div>
            )}
          </div>

          {/* Unit features */}
          {unitType.features && (
            <div className="flex flex-wrap gap-2 mt-2">
              {unitType.features.balcony && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  Balcony
                </span>
              )}
              {unitType.features.view_type && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  {unitType.features.view_type}
                </span>
              )}
              {unitType.features.washer_dryer && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  Washer/Dryer
                </span>
              )}
              {unitType.features.accessible && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  Accessible
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Policies */}
      {resort.policies && (
        <div className="border-t pt-3 mt-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Check-in: {resort.policies.check_in}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Check-out: {resort.policies.check_out}
            </div>
            {resort.policies.parking && (
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                {resort.policies.parking}
              </div>
            )}
            {resort.policies.pets && (
              <div className="flex items-center gap-1">
                <PawPrint className="h-3 w-3" />
                {resort.policies.pets}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      {resort.contact?.phone && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="h-3 w-3" />
          {resort.contact.phone}
        </div>
      )}

      {/* Amenities */}
      {resort.resort_amenities && resort.resort_amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {resort.resort_amenities.map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground border"
            >
              {amenity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
