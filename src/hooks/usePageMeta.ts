import { useEffect } from 'react';

const DEFAULT_TITLE = 'Rent-A-Vacation | Where Luxury Becomes Affordable';

/**
 * Sets document.title and meta description for the current page.
 * Resets to defaults on unmount.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} — Rent-A-Vacation`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', description);
    }
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description]);
}
