import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VACATION_CLUB_BRANDS,
  UNIT_TYPES,
  type CalculatorInputs,
} from '@/lib/calculatorLogic';

interface OwnershipFormProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
}

export function OwnershipForm({ inputs, onChange }: OwnershipFormProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm border p-6 space-y-5">
      <h2 className="text-lg font-semibold text-foreground">Your Ownership Details</h2>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Vacation Club Brand</Label>
        <Select
          value={inputs.brand}
          onValueChange={(v) => onChange({ ...inputs, brand: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your brand" />
          </SelectTrigger>
          <SelectContent>
            {VACATION_CLUB_BRANDS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Unit Type</Label>
        <Select
          value={inputs.unitType}
          onValueChange={(v) => onChange({ ...inputs, unitType: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select unit type" />
          </SelectTrigger>
          <SelectContent>
            {UNIT_TYPES.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Annual Maintenance Fees ($)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            min={0}
            step={100}
            placeholder="2,800"
            className="pl-7"
            value={inputs.annualMaintenanceFees || ''}
            onChange={(e) =>
              onChange({ ...inputs, annualMaintenanceFees: Number(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Weeks Owned Per Year</Label>
        <Select
          value={String(inputs.weeksOwned)}
          onValueChange={(v) => onChange({ ...inputs, weeksOwned: Number(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 week</SelectItem>
            <SelectItem value="2">2 weeks</SelectItem>
            <SelectItem value="3">3+ weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
