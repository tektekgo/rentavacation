import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test the module in isolation, so we dynamically import after resetting
describe("analytics (GA4)", () => {
  let initGA4: () => void;
  let trackGA4PageView: (path: string) => void;
  let trackGA4Event: (name: string, params?: Record<string, unknown>) => void;
  let trackSignUp: (method: string) => void;
  let trackSearch: (term: string) => void;
  let isGA4Initialized: () => boolean;

  beforeEach(async () => {
    // Reset module state by re-importing
    vi.resetModules();
    // Clean up any injected scripts
    document.querySelectorAll('script[src*="googletagmanager"]').forEach((s) => s.remove());
    delete (window as Record<string, unknown>).dataLayer;
    delete (window as Record<string, unknown>).gtag;

    const mod = await import("./analytics");
    initGA4 = mod.initGA4;
    trackGA4PageView = mod.trackGA4PageView;
    trackGA4Event = mod.trackGA4Event;
    trackSignUp = mod.trackSignUp;
    trackSearch = mod.trackSearch;
    isGA4Initialized = mod.isGA4Initialized;
  });

  it("does not track before initialization", () => {
    trackGA4PageView("/test");
    expect(window.gtag).toBeUndefined();
  });

  it("initializes gtag and injects script", () => {
    initGA4();
    expect(isGA4Initialized()).toBe(true);
    expect(window.gtag).toBeDefined();
    expect(window.dataLayer).toBeDefined();

    const script = document.querySelector('script[src*="googletagmanager"]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute("src")).toContain("G-G2YCVHNS25");
  });

  it("does not double-initialize", () => {
    initGA4();
    initGA4();
    const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
    expect(scripts.length).toBe(1);
  });

  it("tracks page views after initialization", () => {
    initGA4();
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackGA4PageView("/rentals");
    expect(gtagSpy).toHaveBeenCalledWith("event", "page_view", expect.objectContaining({
      page_path: "/rentals",
    }));
  });

  it("tracks custom events", () => {
    initGA4();
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackGA4Event("test_event", { foo: "bar" });
    expect(gtagSpy).toHaveBeenCalledWith("event", "test_event", { foo: "bar" });
  });

  it("tracks sign_up event", () => {
    initGA4();
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackSignUp("google");
    expect(gtagSpy).toHaveBeenCalledWith("event", "sign_up", { method: "google" });
  });

  it("tracks search event", () => {
    initGA4();
    const gtagSpy = vi.fn();
    window.gtag = gtagSpy;

    trackSearch("hawaii resort");
    expect(gtagSpy).toHaveBeenCalledWith("event", "search", { search_term: "hawaii resort" });
  });
});
