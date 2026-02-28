import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, X } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";

interface DateRangeFilterProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}

const PRESETS = [
  { label: "Last 7 days", getDates: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: "Last 30 days", getDates: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: "This month", getDates: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last month", getDates: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
] as const;

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const handlePreset = (preset: typeof PRESETS[number]) => {
    onChange(preset.getDates());
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setOpen(false);
  };

  const label = value?.from
    ? value.to
      ? `${format(value.from, "MMM d")} - ${format(value.to, "MMM d, yyyy")}`
      : format(value.from, "MMM d, yyyy")
    : "Date range";

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-sm">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col sm:flex-row">
            <div className="border-b sm:border-b-0 sm:border-r p-2 space-y-1">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              mode="range"
              selected={value}
              onSelect={(range) => {
                onChange(range);
                if (range?.from && range?.to) setOpen(false);
              }}
              numberOfMonths={1}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleClear} title="Clear date filter">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
