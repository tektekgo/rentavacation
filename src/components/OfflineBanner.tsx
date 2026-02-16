import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-destructive text-destructive-foreground text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline — some features may be unavailable</span>
    </div>
  );
}
