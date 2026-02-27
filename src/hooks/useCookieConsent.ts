import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "rav_cookie_consent";

export interface CookiePreferences {
  necessary: true; // always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

export type ConsentStatus = "pending" | "accepted" | "customized";

interface StoredConsent {
  status: ConsentStatus;
  preferences: CookiePreferences;
  consentedAt: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function loadConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

function saveConsent(status: ConsentStatus, preferences: CookiePreferences) {
  const stored: StoredConsent = {
    status,
    preferences,
    consentedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export function useCookieConsent() {
  const [stored, setStored] = useState<StoredConsent | null>(() => loadConsent());

  const showBanner = stored === null;
  const preferences = stored?.preferences ?? DEFAULT_PREFERENCES;

  const acceptAll = useCallback(() => {
    const prefs: CookiePreferences = { necessary: true, analytics: true, marketing: true };
    saveConsent("accepted", prefs);
    setStored({ status: "accepted", preferences: prefs, consentedAt: new Date().toISOString() });
  }, []);

  const rejectNonEssential = useCallback(() => {
    const prefs: CookiePreferences = { necessary: true, analytics: false, marketing: false };
    saveConsent("customized", prefs);
    setStored({ status: "customized", preferences: prefs, consentedAt: new Date().toISOString() });
  }, []);

  const saveCustom = useCallback((prefs: CookiePreferences) => {
    saveConsent("customized", { ...prefs, necessary: true });
    setStored({ status: "customized", preferences: { ...prefs, necessary: true }, consentedAt: new Date().toISOString() });
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
  }, []);

  // Helper to check if a specific category is allowed
  const hasConsent = useCallback(
    (category: keyof CookiePreferences): boolean => {
      if (category === "necessary") return true;
      return preferences[category] ?? false;
    },
    [preferences]
  );

  return {
    showBanner,
    preferences,
    hasConsent,
    acceptAll,
    rejectNonEssential,
    saveCustom,
    resetConsent,
  };
}

/**
 * Standalone check for use outside React (e.g., script loading).
 */
export function getCookieConsent(): CookiePreferences | null {
  const stored = loadConsent();
  return stored?.preferences ?? null;
}
