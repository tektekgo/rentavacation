import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
  const { user, profile, signOut, isRavTeam } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (isRavTeam()) {
      navigate("/rentals");
    } else if (profile?.approval_status === "approved") {
      navigate("/rentals");
    }
  }, [user, profile, isRavTeam, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is currently being reviewed by our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">Why the wait?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We're currently in beta and carefully reviewing all new
                  accounts to ensure the best experience for our community.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">What happens next?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You'll receive an email at{" "}
                  <strong>{profile?.email}</strong> within 24 hours once your
                  account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Questions? Contact us at{" "}
              <a
                href="mailto:support@rent-a-vacation.com"
                className="text-primary hover:underline"
              >
                support@rent-a-vacation.com
              </a>
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
