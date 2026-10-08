import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollRestoration:
 * Preserves window scroll position across browser refreshes and route transitions.
 * When a page is refreshed, restores the user's scroll position instead of jumping to (0, 0).
 */
export function useScrollRestoration() {
  const location = useLocation();
  const isInitialMount = useRef(true);

  // Save scroll position throttled on scroll and on page unload/hide
  useEffect(() => {
    // Disable default browser scroll restoration so it doesn't fight React hydration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const saveScroll = () => {
      try {
        const key = `ay_scroll_${window.location.pathname}`;
        sessionStorage.setItem(key, String(window.scrollY));
      } catch {}
    };

    let timeoutId;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(saveScroll, 80);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', saveScroll);
    window.addEventListener('pagehide', saveScroll);

    return () => {
      clearTimeout(timeoutId);
      saveScroll();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', saveScroll);
      window.removeEventListener('pagehide', saveScroll);
    };
  }, []);

  // Restore scroll position when entering or refreshing a route
  useEffect(() => {
    const currentPath = location.pathname;
    const key = `ay_scroll_${currentPath}`;
    let savedY = 0;
    try {
      const val = sessionStorage.getItem(key);
      if (val !== null) savedY = parseInt(val, 10);
    } catch {}

    if (isNaN(savedY) || savedY <= 0) {
      if (!isInitialMount.current) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      isInitialMount.current = false;
      return;
    }

    isInitialMount.current = false;

    // Retry restoration until content height is loaded (handles async API hydration)
    let attempts = 0;
    const maxAttempts = 20;

    const restore = () => {
      attempts++;
      const scrollableHeight = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        document.body.scrollHeight - window.innerHeight,
        0
      );

      if (scrollableHeight >= savedY) {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      } else if (attempts < maxAttempts) {
        setTimeout(restore, 75);
      } else if (scrollableHeight > 0) {
        window.scrollTo({ top: scrollableHeight, behavior: 'instant' });
      }
    };

    // Immediate attempt + requestAnimationFrame
    requestAnimationFrame(restore);
    const retryTimer = setTimeout(restore, 100);

    return () => clearTimeout(retryTimer);
  }, [location.pathname]);
}
