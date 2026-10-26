import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Briefcase,
  Wrench,
  ClipboardList,
  FileText,
  Download,
} from 'lucide-react';
import type { User } from '@/types';

/**
 * Mobile "Post" entry point: a floating action button that opens a bottom
 * sheet listing every listing type. Replaces the Post links that used to
 * live in the mobile hamburger menu (desktop keeps its Post dropdown).
 */

const POST_OPTIONS = [
  {
    name: 'Post a Gig',
    desc: 'Sell your skills at a fixed price',
    href: '/post/gig',
    icon: Briefcase,
  },
  {
    name: 'Offer a Service',
    desc: 'Offer a local service like hair or delivery',
    href: '/post/service',
    icon: Wrench,
  },
  {
    name: 'Post a Task',
    desc: 'Hire someone for a quick errand',
    href: '/post/task',
    icon: ClipboardList,
  },
  {
    name: 'Post a Job',
    desc: 'Hire someone for a role or project',
    href: '/post/job',
    icon: FileText,
  },
  {
    name: 'Sell Digital',
    desc: 'Sell templates, ebooks, and files',
    href: '/post/digital',
    icon: Download,
  },
];

// Surfaces where posting is relevant. The FAB stays off the landing page,
// auth screens, forms and the inbox so it never covers CTAs or the composer.
const FAB_PATHS = ['/browse', '/categories', '/listing/', '/seller/', '/dashboard/favourites'];

function showOnPath(pathname: string) {
  if (pathname === '/dashboard') return true;
  return FAB_PATHS.some((p) => pathname.startsWith(p));
}

export function PostFab({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const pathVisible = !!user && showOnPath(location.pathname);

  // Hide while scrolling down, reveal on scroll up (Material convention)
  useEffect(() => {
    if (!pathVisible) return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) setVisible(false);
      else if (y < lastScrollY.current) setVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathVisible]);

  // Close the sheet on navigation (also covers the logged-out redirect below)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes the sheet
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Move focus to the close button when the sheet opens (a11y)
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!pathVisible) return null;

  const handleOption = (href: string) => {
    setOpen(false);
    if (!user) {
      // The FAB only renders for logged-in users; this guards any future
      // guest entry point by routing straight to login.
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    navigate(href);
  };

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create a new listing"
        aria-expanded={open}
        className={`lg:hidden fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition-all duration-300 ease-out hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
          visible && !open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-24 opacity-0'
        }`}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`lg:hidden fixed inset-0 z-50 bg-black/40 transition-[opacity,visibility] duration-300 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create a new listing"
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchStartY.current === null) return;
          if (e.changedTouches[0].clientY - touchStartY.current > 60) setOpen(false);
          touchStartY.current = null;
        }}
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-[transform,visibility] duration-300 ease-out dark:bg-violet-900 ${
          open ? 'visible translate-y-0' : 'invisible translate-y-full'
        }`}
      >
        <div className="pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2.5">
          {/* Grab handle — swipe down to close */}
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-gray-300 dark:bg-violet-700" />

          <div className="flex items-center justify-between pb-1 pl-5 pr-4 pt-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Create a new listing
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 active:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-violet-800 dark:text-gray-200 dark:hover:bg-violet-700"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <ul className="space-y-1 px-3 pt-1.5">
            {POST_OPTIONS.map((opt) => (
              <li key={opt.name}>
                <button
                  type="button"
                  onClick={() => handleOption(opt.href)}
                  className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-violet-50 active:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:hover:bg-violet-800/60 dark:active:bg-violet-800"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-800 dark:text-amber-400">
                    <opt.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-gray-900 dark:text-white">
                      {opt.name}
                    </span>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">
                      {opt.desc}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
