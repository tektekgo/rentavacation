import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCookieConsent, getCookieConsent } from './useCookieConsent';

const STORAGE_KEY = 'rav_cookie_consent';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useCookieConsent', () => {
  it('shows banner when no consent stored', () => {
    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(true);
  });

  it('hides banner after accepting all', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => result.current.acceptAll());

    expect(result.current.showBanner).toBe(false);
    expect(result.current.preferences.analytics).toBe(true);
    expect(result.current.preferences.marketing).toBe(true);
    expect(result.current.preferences.necessary).toBe(true);
  });

  it('hides banner after rejecting non-essential', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => result.current.rejectNonEssential());

    expect(result.current.showBanner).toBe(false);
    expect(result.current.preferences.analytics).toBe(false);
    expect(result.current.preferences.marketing).toBe(false);
    expect(result.current.preferences.necessary).toBe(true);
  });

  it('saves custom preferences', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => result.current.saveCustom({ necessary: true, analytics: true, marketing: false }));

    expect(result.current.showBanner).toBe(false);
    expect(result.current.preferences.analytics).toBe(true);
    expect(result.current.preferences.marketing).toBe(false);
  });

  it('always forces necessary to true in custom save', () => {
    const { result } = renderHook(() => useCookieConsent());

    // Even if someone tries to pass necessary: false, it stays true
    act(() => result.current.saveCustom({
      necessary: false as unknown as true,
      analytics: true,
      marketing: true,
    }));

    expect(result.current.preferences.necessary).toBe(true);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => result.current.acceptAll());

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.status).toBe('accepted');
    expect(stored.preferences.analytics).toBe(true);
    expect(stored.consentedAt).toBeDefined();
  });

  it('loads existing consent on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status: 'customized',
      preferences: { necessary: true, analytics: true, marketing: false },
      consentedAt: '2026-01-01T00:00:00Z',
    }));

    const { result } = renderHook(() => useCookieConsent());

    expect(result.current.showBanner).toBe(false);
    expect(result.current.preferences.analytics).toBe(true);
    expect(result.current.preferences.marketing).toBe(false);
  });

  it('resetConsent clears storage and shows banner', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => result.current.acceptAll());
    expect(result.current.showBanner).toBe(false);

    act(() => result.current.resetConsent());
    expect(result.current.showBanner).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('hasConsent returns correct values', () => {
    const { result } = renderHook(() => useCookieConsent());

    act(() => result.current.saveCustom({ necessary: true, analytics: true, marketing: false }));

    expect(result.current.hasConsent('necessary')).toBe(true);
    expect(result.current.hasConsent('analytics')).toBe(true);
    expect(result.current.hasConsent('marketing')).toBe(false);
  });

  it('hasConsent always returns true for necessary', () => {
    const { result } = renderHook(() => useCookieConsent());
    // Even before any consent action
    expect(result.current.hasConsent('necessary')).toBe(true);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');

    const { result } = renderHook(() => useCookieConsent());
    expect(result.current.showBanner).toBe(true);
  });
});

describe('getCookieConsent', () => {
  it('returns null when no consent stored', () => {
    expect(getCookieConsent()).toBeNull();
  });

  it('returns preferences when consent exists', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status: 'accepted',
      preferences: { necessary: true, analytics: true, marketing: true },
      consentedAt: '2026-01-01T00:00:00Z',
    }));

    const prefs = getCookieConsent();
    expect(prefs).toEqual({ necessary: true, analytics: true, marketing: true });
  });
});
