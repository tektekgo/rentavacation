import { useState } from 'react';
import { Check, Edit2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateMaintenanceFees } from '@/hooks/owner/useOwnerDashboardStats';

interface MaintenanceFeeTrackerProps {
  annualFees: number | null;
  totalEarnedYtd: number;
}

export function MaintenanceFeeTracker({ annualFees, totalEarnedYtd }: MaintenanceFeeTrackerProps) {
  const [editing, setEditing] = useState(false);
  const [feeInput, setFeeInput] = useState(annualFees?.toString() || '');
  const updateFees = useUpdateMaintenanceFees();

  const handleSave = () => {
    const val = Number(feeInput);
    if (val > 0) {
      updateFees.mutate(val, {
        onSuccess: () => setEditing(false),
      });
    }
  };

  // Prompt state — no fees entered yet
  if (annualFees == null && !editing) {
    return (
      <Card id="fees">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Maintenance Fee Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter your annual maintenance fees to track your break-even progress.
            </p>
            <div className="flex items-center gap-2 max-w-xs mx-auto">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  placeholder="2,800"
                  className="pl-7"
                  value={feeInput}
                  onChange={(e) => setFeeInput(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={handleSave} disabled={updateFees.isPending}>
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const fees = annualFees ?? 0;
  const netEarnings = totalEarnedYtd - fees;
  const isFullyCovered = totalEarnedYtd >= fees && fees > 0;
  const coveragePercent = fees > 0 ? Math.round((totalEarnedYtd / fees) * 100) : 0;

  return (
    <Card id="fees">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Maintenance Fee Tracker
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setEditing(!editing); setFeeInput(fees.toString()); }}
        >
          <Edit2 className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                min={0}
                step={100}
                className="pl-7"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleSave} disabled={updateFees.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual maintenance fees</span>
                <span className="font-medium">${fees.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Earned so far this year</span>
                <span className="font-medium flex items-center gap-1">
                  ${totalEarnedYtd.toLocaleString()}
                  {isFullyCovered && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="font-medium">
                  {netEarnings >= 0 ? 'Net earnings after fees' : 'Remaining to cover'}
                </span>
                <span className={`font-bold ${netEarnings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netEarnings >= 0 ? '+' : ''}${netEarnings.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Coverage bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{coveragePercent}% covered</span>
                {isFullyCovered && (
                  <span className="text-emerald-600 font-medium">Fees fully covered!</span>
                )}
              </div>
              <div className="bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    coveragePercent >= 100 ? 'bg-emerald-500' : coveragePercent >= 50 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
