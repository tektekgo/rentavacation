import { useState } from "react";
import { useCookieConsent, type CookiePreferences } from "@/hooks/useCookieConsent";
import { initGA4 } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Cookie, Settings2, X } from "lucide-react";

export function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectNonEssential, saveCustom } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  if (!showBanner) return null;

  const handleAcceptAll = () => {
    acceptAll();
    initGA4(); // Start GA4 immediately on consent
  };

  const handleSaveCustom = () => {
    const prefs: CookiePreferences = { necessary: true, analytics, marketing };
    saveCustom(prefs);
    if (analytics) initGA4();
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-2xl p-4">
        <div className="bg-card border rounded-lg shadow-lg p-5">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Cookie Preferences</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                We use cookies to provide essential site functionality. With your consent,
                we also use cookies for analytics to improve your experience.{" "}
                <a href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
              </p>

              {showSettings && (
                <div className="mt-4 space-y-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Necessary</p>
                      <p className="text-xs text-muted-foreground">
                        Authentication, security, and core functionality
                      </p>
                    </div>
                    <Switch checked disabled aria-label="Necessary cookies (always on)" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">
                        Usage data to improve the platform
                      </p>
                    </div>
                    <Switch
                      checked={analytics}
                      onCheckedChange={setAnalytics}
                      aria-label="Analytics cookies"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Marketing</p>
                      <p className="text-xs text-muted-foreground">
                        Personalized recommendations and promotions
                      </p>
                    </div>
                    <Switch
                      checked={marketing}
                      onCheckedChange={setMarketing}
                      aria-label="Marketing cookies"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {showSettings ? (
                  <>
                    <Button size="sm" onClick={handleSaveCustom}>
                      Save Preferences
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSettings(false)}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={handleAcceptAll}>
                      Accept All
                    </Button>
                    <Button size="sm" variant="outline" onClick={rejectNonEssential}>
                      Essential Only
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowSettings(true)}
                    >
                      <Settings2 className="h-3.5 w-3.5 mr-1" />
                      Customize
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
