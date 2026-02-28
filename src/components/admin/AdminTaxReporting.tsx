import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import type { Booking, Listing, Property, Profile } from "@/types/database";

interface BookingWithDetails extends Booking {
  listing: Listing & { property: Property; owner: Profile };
}

interface OwnerEarningsSummary {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  totalEarnings: number;
  totalBookings: number;
  w9Submitted: boolean;
  over1099Threshold: boolean;
  taxIdLast4: string | null;
}

interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2026"
  totalRevenue: number;
  serviceFees: number;
  ownerPayouts: number;
  taxCollected: number;
  bookingCount: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const THRESHOLD_1099K = 600;

const AdminTaxReporting = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            *,
            listing:listings(
              *,
              property:properties(*),
              owner:profiles!listings_owner_id_fkey(*)
            )
          `)
          .in("status", ["confirmed", "completed"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBookings(data as BookingWithDetails[] || []);
      } catch (error) {
        console.error("Error fetching tax data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter bookings by selected year
  const yearBookings = useMemo(() => {
    return bookings.filter((b) => {
      const year = new Date(b.created_at).getFullYear();
      return year === Number(selectedYear);
    });
  }, [bookings, selectedYear]);

  // Monthly revenue breakdown
  const monthlyRevenue = useMemo<MonthlyRevenue[]>(() => {
    const months = new Map<string, MonthlyRevenue>();

    yearBookings.forEach((b) => {
      const date = new Date(b.created_at);
      const key = format(date, "yyyy-MM");
      const label = format(date, "MMM yyyy");

      if (!months.has(key)) {
        months.set(key, {
          month: key,
          label,
          totalRevenue: 0,
          serviceFees: 0,
          ownerPayouts: 0,
          taxCollected: 0,
          bookingCount: 0,
        });
      }

      const m = months.get(key)!;
      m.totalRevenue += b.total_amount;
      m.serviceFees += b.rav_commission;
      m.ownerPayouts += b.owner_payout;
      m.taxCollected += b.tax_amount || 0;
      m.bookingCount += 1;
    });

    return Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [yearBookings]);

  // Owner earnings summary for 1099-K
  const ownerEarnings = useMemo<OwnerEarningsSummary[]>(() => {
    const owners = new Map<string, OwnerEarningsSummary>();

    yearBookings.forEach((b) => {
      const owner = b.listing?.owner;
      if (!owner) return;

      if (!owners.has(owner.id)) {
        owners.set(owner.id, {
          ownerId: owner.id,
          ownerName: owner.full_name || "Unknown",
          ownerEmail: owner.email,
          totalEarnings: 0,
          totalBookings: 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          w9Submitted: !!(owner as any).w9_submitted_at,
          over1099Threshold: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          taxIdLast4: (owner as any).tax_id_last4 || null,
        });
      }

      const o = owners.get(owner.id)!;
      o.totalEarnings += b.owner_payout;
      o.totalBookings += 1;
      o.over1099Threshold = o.totalEarnings >= THRESHOLD_1099K;
    });

    return Array.from(owners.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [yearBookings]);

  // Annual totals
  const annualTotals = useMemo(() => {
    const totalRevenue = yearBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const totalServiceFees = yearBookings.reduce((sum, b) => sum + b.rav_commission, 0);
    const totalOwnerPayouts = yearBookings.reduce((sum, b) => sum + b.owner_payout, 0);
    const totalTaxCollected = yearBookings.reduce((sum, b) => sum + (b.tax_amount || 0), 0);
    const ownersOver1099 = ownerEarnings.filter((o) => o.over1099Threshold).length;
    const ownersNeedW9 = ownerEarnings.filter((o) => o.over1099Threshold && !o.w9Submitted).length;

    return {
      totalRevenue,
      totalServiceFees,
      totalOwnerPayouts,
      totalTaxCollected,
      bookingCount: yearBookings.length,
      ownersOver1099,
      ownersNeedW9,
    };
  }, [yearBookings, ownerEarnings]);

  // Available years from bookings
  const availableYears = useMemo(() => {
    const years = new Set(bookings.map((b) => String(new Date(b.created_at).getFullYear())));
    if (!years.has(String(CURRENT_YEAR))) years.add(String(CURRENT_YEAR));
    return Array.from(years).sort().reverse();
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Tax & Revenue Reporting</h2>
          <p className="text-muted-foreground">
            Revenue reports, tax tracking, and 1099-K compliance
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${annualTotals.totalServiceFees.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Service fees from {annualTotals.bookingCount} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${annualTotals.totalOwnerPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Paid to property owners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${annualTotals.totalTaxCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {annualTotals.totalTaxCollected === 0
                ? "Stripe Tax not yet activated"
                : "For government remittance"}
            </p>
          </CardContent>
        </Card>

        <Card className={annualTotals.ownersNeedW9 > 0
          ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
          : ""
        }>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1099-K Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {annualTotals.ownersOver1099}
            </div>
            <p className="text-xs text-muted-foreground">
              {annualTotals.ownersOver1099 === 0
                ? "No owners over $600 threshold"
                : `${annualTotals.ownersNeedW9} missing W-9`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Monthly Revenue & Tax Report — {selectedYear}
          </CardTitle>
          <CardDescription>
            Breakdown of platform revenue, owner payouts, and tax collected by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRevenue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No revenue data</h3>
              <p className="text-muted-foreground">
                No confirmed or completed bookings in {selectedYear}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Service Fees (RAV)</TableHead>
                  <TableHead className="text-right">Owner Payouts</TableHead>
                  <TableHead className="text-right">Tax Collected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyRevenue.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-right">{m.bookingCount}</TableCell>
                    <TableCell className="text-right">${m.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${m.serviceFees.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">${m.ownerPayouts.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {m.taxCollected > 0
                        ? `$${m.taxCollected.toLocaleString()}`
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{annualTotals.bookingCount}</TableCell>
                  <TableCell className="text-right">${annualTotals.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">
                    ${annualTotals.totalServiceFees.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">${annualTotals.totalOwnerPayouts.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {annualTotals.totalTaxCollected > 0
                      ? `$${annualTotals.totalTaxCollected.toLocaleString()}`
                      : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 1099-K Owner Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Owner Earnings — 1099-K Tracking ({selectedYear})
          </CardTitle>
          <CardDescription>
            Owners earning over ${THRESHOLD_1099K.toLocaleString()}/year require a 1099-K form by January 31 of the following year
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownerEarnings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No owner earnings</h3>
              <p className="text-muted-foreground">
                No payouts to owners in {selectedYear}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Total Earnings</TableHead>
                  <TableHead>1099-K Required</TableHead>
                  <TableHead>W-9 Status</TableHead>
                  <TableHead>Tax ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownerEarnings.map((owner) => (
                  <TableRow key={owner.ownerId}>
                    <TableCell>
                      <p className="font-medium">{owner.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{owner.ownerEmail}</p>
                    </TableCell>
                    <TableCell className="text-right">{owner.totalBookings}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${owner.totalEarnings.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {owner.over1099Threshold ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Below threshold</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {owner.w9Submitted ? (
                        <Badge className="bg-green-500 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Submitted
                        </Badge>
                      ) : owner.over1099Threshold ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Missing
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {owner.taxIdLast4 ? (
                        <span className="font-mono text-sm">***-**-{owner.taxIdLast4}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTaxReporting;
