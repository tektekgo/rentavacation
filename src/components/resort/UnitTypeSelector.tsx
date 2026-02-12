import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { ResortUnitType } from "@/types/database";
import { Loader2 } from "lucide-react";

interface UnitTypeSelectorProps {
  resortId: string;
  onUnitTypeSelect: (unitType: ResortUnitType) => void;
  selectedUnitTypeId?: string | null;
}

export function UnitTypeSelector({
  resortId,
  onUnitTypeSelect,
  selectedUnitTypeId,
}: UnitTypeSelectorProps) {
  const [unitTypes, setUnitTypes] = useState<ResortUnitType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resortId) {
      loadUnitTypes();
    } else {
      setUnitTypes([]);
    }
  }, [resortId]);

  async function loadUnitTypes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("resort_unit_types")
      .select("*")
      .eq("resort_id", resortId)
      .order("bedrooms");

    if (error) {
      console.error("Error loading unit types:", error.message);
    }
    setUnitTypes((data as ResortUnitType[]) || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading unit types...</span>
      </div>
    );
  }

  if (!resortId) {
    return null;
  }

  return (
    <Select
      value={selectedUnitTypeId || undefined}
      onValueChange={(id) => {
        const selected = unitTypes.find((ut) => ut.id === id);
        if (selected) onUnitTypeSelect(selected);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select unit type" />
      </SelectTrigger>
      <SelectContent>
        {unitTypes.map((ut) => (
          <SelectItem key={ut.id} value={ut.id}>
            {ut.unit_type_name} — {ut.bedrooms === 0 ? "Studio" : `${ut.bedrooms} BR`},{" "}
            {ut.bathrooms} BA, Sleeps {ut.max_occupancy}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
