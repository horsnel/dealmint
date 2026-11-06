import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the top on navigation, or to the #anchor when there is one
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      const attempt = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (tries < 20) {
          tries += 1;
          setTimeout(attempt, 100);
        }
      };
      attempt();
      return;
    }
    // Force an instant jump: global CSS sets `scroll-behavior: smooth`, which
    // would otherwise turn every route change into a slow glide back to the
    // top (old page visibly flying past) instead of a clean, seamless swap.
    // In-page anchor scrolling keeps its smooth behaviour via the hash branch.
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      document.documentElement.style.scrollBehavior = prev;
    });
  }, [pathname, hash]);

  return null;
}
