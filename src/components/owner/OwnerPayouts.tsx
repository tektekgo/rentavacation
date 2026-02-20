import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, Clock, CheckCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useOwnerPayouts, useOwnerPayoutStats } from '@/hooks/usePayouts';

const PAYOUT_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  processed: { label: 'Paid', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
};

export function OwnerPayouts() {
  const { data: payouts = [], isLoading } = useOwnerPayouts();
  const { pendingAmount, processedAmount, completedCount, pendingCount } = useOwnerPayoutStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payouts</h2>
        <p className="text-muted-foreground">
          Track your earnings and payout history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} booking{pendingCount !== 1 ? 's' : ''} awaiting payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${processedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount} payout{completedCount !== 1 ? 's' : ''} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(pendingAmount + processedAmount).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payouts yet</h3>
              <p className="text-muted-foreground text-center">
                Payouts will appear here once you have confirmed bookings.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Stay Dates</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid On</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => {
                  const statusKey = payout.payout_status === 'processed' ? 'processed' : 'pending';
                  const config = PAYOUT_STATUS_CONFIG[statusKey];

                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <p className="font-medium">
                          {payout.listing?.property?.resort_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.listing?.property?.location}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {payout.listing?.check_in_date && (
                          <>
                            {format(new Date(payout.listing.check_in_date), 'MMM d')} -{' '}
                            {format(new Date(payout.listing.check_out_date), 'MMM d')}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(payout.payout_amount || payout.owner_payout).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>
                          {statusKey === 'processed' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.payout_date
                          ? format(new Date(payout.payout_date), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.payout_reference || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
