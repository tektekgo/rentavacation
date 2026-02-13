import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed, Bath, Users, Maximize, UtensilsCrossed } from "lucide-react";
import type { ResortUnitType } from "@/types/database";

interface UnitTypeSpecsProps {
  unitType: ResortUnitType;
}

export function UnitTypeSpecs({ unitType }: UnitTypeSpecsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Unit Specifications</CardTitle>
        <p className="text-sm text-muted-foreground">{unitType.unit_type_name}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <Bed className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">
              {unitType.bedrooms === 0 ? "S" : unitType.bedrooms}
            </p>
            <p className="text-xs text-muted-foreground">
              {unitType.bedrooms === 0 ? "Studio" : "Bedrooms"}
            </p>
          </div>

          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <Bath className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{unitType.bathrooms}</p>
            <p className="text-xs text-muted-foreground">Bathrooms</p>
          </div>

          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{unitType.max_occupancy}</p>
            <p className="text-xs text-muted-foreground">Sleeps</p>
          </div>

          {unitType.square_footage && (
            <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
              <Maximize className="h-5 w-5 text-primary mb-2" />
              <p className="text-lg font-bold">{unitType.square_footage}</p>
              <p className="text-xs text-muted-foreground">sq ft</p>
            </div>
          )}

          {unitType.kitchen_type && (
            <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
              <UtensilsCrossed className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-bold text-center">{unitType.kitchen_type}</p>
              <p className="text-xs text-muted-foreground">Kitchen</p>
            </div>
          )}
        </div>

        {/* Bedding Configuration */}
        {unitType.bedding_config && (
          <div>
            <p className="text-sm font-medium mb-1">Bedding Configuration</p>
            <p className="text-sm text-muted-foreground">{unitType.bedding_config}</p>
          </div>
        )}

        {/* Features */}
        {unitType.features && (
          <div>
            <p className="text-sm font-medium mb-2">Features</p>
            <div className="flex flex-wrap gap-2">
              {unitType.features.balcony && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  Private Balcony
                </span>
              )}
              {unitType.features.view_type && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  {unitType.features.view_type}
                </span>
              )}
              {unitType.features.washer_dryer && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  In-Unit Washer/Dryer
                </span>
              )}
              {unitType.features.accessible && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                  Accessible Unit
                </span>
              )}
            </div>
          </div>
        )}

        {/* Unit Amenities */}
        {unitType.unit_amenities && unitType.unit_amenities.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Unit Amenities</p>
            <div className="flex flex-wrap gap-2">
              {unitType.unit_amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="text-xs bg-secondary px-2.5 py-1 rounded-md"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
