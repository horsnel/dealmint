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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
