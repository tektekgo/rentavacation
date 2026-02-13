import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Star, ExternalLink, Clock, Car, PawPrint, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResortAmenities } from "./ResortAmenities";
import type { Resort } from "@/types/database";

interface ResortInfoCardProps {
  resort: Resort;
}

export function ResortInfoCard({ resort }: ResortInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">{resort.resort_name}</span>
          {resort.guest_rating && (
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-warning text-warning" />
              <span className="font-semibold">{resort.guest_rating}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Location</p>
            <p className="text-sm text-muted-foreground">
              {resort.location.city}, {resort.location.state}, {resort.location.country}
            </p>
          </div>
        </div>

        {/* Contact */}
        {resort.contact?.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Contact</p>
              <p className="text-sm text-muted-foreground">{resort.contact.phone}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {resort.description && (
          <div>
            <p className="font-medium mb-2">About This Resort</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resort.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        {resort.resort_amenities && resort.resort_amenities.length > 0 && (
          <div>
            <p className="font-medium mb-3">Resort Amenities</p>
            <ResortAmenities amenities={resort.resort_amenities} />
          </div>
        )}

        {/* Policies */}
        {resort.policies && (
          <div>
            <p className="font-medium mb-3">Resort Policies</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Check-in:</span>
                <span className="font-medium">{resort.policies.check_in}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Check-out:</span>
                <span className="font-medium">{resort.policies.check_out}</span>
              </div>
              {resort.policies.parking && (
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{resort.policies.parking}</span>
                </div>
              )}
              {resort.policies.pets && (
                <div className="flex items-center gap-2">
                  <PawPrint className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{resort.policies.pets}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nearby Airports */}
        {resort.nearby_airports && resort.nearby_airports.length > 0 && (
          <div>
            <p className="font-medium mb-2">Nearby Airports</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {resort.nearby_airports.map((airport, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Plane className="h-3.5 w-3.5 flex-shrink-0" />
                  {airport}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Official Website Link */}
        {resort.contact?.website && (
          <Button variant="outline" className="w-full" asChild>
            <a
              href={resort.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              View Official Resort Website
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
