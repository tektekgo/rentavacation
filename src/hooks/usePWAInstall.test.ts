import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePWAInstall } from "./usePWAInstall";

describe("usePWAInstall", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    matchMediaMock = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", {
      value: matchMediaMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with canShow false", () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canShow).toBe(false);
  });

  it("sets canShow to true when beforeinstallprompt fires", () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    expect(result.current.canShow).toBe(true);
  });

  it("does not show when already in standalone mode", () => {
    matchMediaMock.mockReturnValue({ matches: true });
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      window.dispatchEvent(event);
    });

    expect(result.current.canShow).toBe(false);
  });

  it("does not show when dismissed recently", () => {
    localStorage.setItem(
      "pwa-install-dismissed-at",
      String(Date.now())
    );
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      window.dispatchEvent(event);
    });

    expect(result.current.canShow).toBe(false);
  });

  it("shows again after dismiss period expires", () => {
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      "pwa-install-dismissed-at",
      String(fifteenDaysAgo)
    );
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    expect(result.current.canShow).toBe(true);
  });

  it("dismiss sets localStorage and hides banner", () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

    expect(result.current.canShow).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.canShow).toBe(false);
    expect(localStorage.getItem("pwa-install-dismissed-at")).toBeTruthy();
  });

  it("install calls prompt and hides on accepted", async () => {
    const promptMock = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event("beforeinstallprompt");
      Object.assign(event, {
        prompt: promptMock,
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      window.dispatchEvent(event);
    });

    expect(result.current.canShow).toBe(true);

    await act(async () => {
      await result.current.install();
    });

    expect(promptMock).toHaveBeenCalled();
    expect(result.current.canShow).toBe(false);
  });
});
