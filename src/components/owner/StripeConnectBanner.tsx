import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ExternalLink, Loader2, CreditCard } from "lucide-react";
import { useStripeConnectStatus, useCreateConnectAccount } from "@/hooks/usePayouts";

const StripeConnectBanner = () => {
  const { data: connectStatus, isLoading } = useStripeConnectStatus();
  const createAccount = useCreateConnectAccount();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleSetupPayouts = async () => {
    try {
      setIsRedirecting(true);
      const result = await createAccount.mutateAsync({});
      if (result.already_complete) {
        setIsRedirecting(false);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setIsRedirecting(false);
    }
  };

  if (isLoading) return null;

  // Fully onboarded — show success badge
  if (connectStatus?.stripe_onboarding_complete && connectStatus?.stripe_payouts_enabled) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Stripe Payouts Active</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your payouts are processed automatically via Stripe.
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              <CreditCard className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Account created but onboarding incomplete
  if (connectStatus?.stripe_account_id && !connectStatus?.stripe_onboarding_complete) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">Stripe Setup Incomplete</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Complete your Stripe verification to receive automated payouts.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSetupPayouts}
              disabled={isRedirecting || createAccount.isPending}
              size="sm"
            >
              {(isRedirecting || createAccount.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Complete Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No account yet — prompt to set up
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Set Up Automated Payouts</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Connect your bank account via Stripe to receive payouts automatically after bookings complete.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSetupPayouts}
            disabled={isRedirecting || createAccount.isPending}
            size="sm"
          >
            {(isRedirecting || createAccount.isPending) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Set Up Stripe
          </Button>
        </div>
        {createAccount.isError && (
          <p className="text-sm text-destructive mt-2">
            {createAccount.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeConnectBanner;
