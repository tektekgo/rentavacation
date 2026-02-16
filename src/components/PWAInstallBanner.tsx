import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { canShow, install, dismiss } = usePWAInstall();

  if (!canShow) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-card border-t shadow-lg p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
      <div className="flex items-center gap-3 min-w-0">
        <Download className="h-5 w-5 text-primary shrink-0" />
        <p className="text-sm font-medium truncate">
          Install Rent-A-Vacation for a faster experience
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" onClick={install}>
          Install
        </Button>
        <button
          onClick={dismiss}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
