import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, CheckCircle, Loader2 } from 'lucide-react';

interface EmailVerificationBannerProps {
  /** What action is blocked — shown in the message */
  blockedAction: string;
}

/**
 * Full-page-blocking banner shown when an unverified user tries to
 * perform a financial action (checkout, list property).
 */
export function EmailVerificationBanner({ blockedAction }: EmailVerificationBannerProps) {
  const { user, resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    const { error: resendError } = await resendVerificationEmail();
    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResent(true);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-warning" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-3">
        Verify Your Email
      </h2>

      <p className="text-muted-foreground mb-2">
        You need to verify your email address before you can {blockedAction}.
      </p>

      <p className="text-sm text-muted-foreground mb-6">
        We sent a verification link to{' '}
        <span className="font-medium text-foreground">{user?.email}</span>.
        Check your inbox and spam folder.
      </p>

      {resent ? (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
          <CheckCircle className="w-4 h-4" />
          Verification email sent! Check your inbox.
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resending}
          className="mb-4"
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Resend Verification Email
            </>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      <p className="text-xs text-muted-foreground mt-6">
        Already verified? Try refreshing the page or logging out and back in.
      </p>
    </div>
  );
}
