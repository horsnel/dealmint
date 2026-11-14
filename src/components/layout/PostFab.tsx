import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Layers,
  Toolbox,
  ListTodo,
  UserPlus,
  FileBox,
} from 'lucide-react';
import type { User } from '@/types';

/**
 * "Create a new listing" entry point (mock b9119e frame 1): a floating action
 * button that opens a bottom sheet with every listing type. Visible on
 * marketplace surfaces for everyone; guests are routed to login on pick.
 */

// Per-type palette straight from the mock: violet gig, blue service,
// orange task, green job, pink digital.
const POST_OPTIONS = [
  {
    name: 'Post a Gig',
    desc: 'Sell a specific skill at a fixed price',
    href: '/post/gig',
    icon: Layers,
    tile: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    hover: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
  },
  {
    name: 'Offer a Local Service',
    desc: 'Hair, delivery, plumbing, etc.',
    href: '/post/service',
    icon: Toolbox,
    tile: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
  },
  {
    name: 'Post a Quick Task',
    desc: 'Hire someone for a quick errand',
    href: '/post/task',
    icon: ListTodo,
    tile: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
    hover: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
  },
  {
    name: 'Post a Full Job',
    desc: 'Hire for a long-term role',
    href: '/post/job',
    icon: UserPlus,
    tile: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-300',
    hover: 'hover:bg-green-50 dark:hover:bg-green-500/10',
  },
  {
    name: 'Sell a Digital Product',
    desc: 'Ebooks, templates, software',
    href: '/post/digital',
    icon: FileBox,
    tile: 'bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300',
    hover: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
  },
];

// Surfaces where posting is the primary action — strictly minimal. The FAB
// stays off the dashboard, detail pages, inbox and everywhere else so it
// never covers content or CTAs; the navbar "Post" menu covers the rest.
const FAB_PATHS = ['/browse', '/marketplace'];

function showOnPath(pathname: string) {
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

  // Shown to guests too — picking an option routes them to login first.
  const pathVisible = showOnPath(location.pathname);

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
      navigate('/login', { state: { from: href } });
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
        className={`fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition-all duration-300 ease-out hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 lg:bottom-8 lg:right-8 ${
          visible && !open
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-24 opacity-0'
        }`}
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Backdrop — dark, blurred page behind the sheet, as in the mock */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-[opacity,visibility] duration-300 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      />

      {/* Bottom sheet — centered phone-width column on desktop */}
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
        className={`fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-[2rem] bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-[transform,visibility] duration-300 ease-out dark:bg-violet-900 ${
          open ? 'visible translate-y-0' : 'invisible translate-y-full'
        }`}
      >
        <div className="pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          {/* Grab handle — swipe down to close */}
          <div aria-hidden="true" className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-gray-200 dark:bg-violet-700" />

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create a new listing
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full bg-gray-50 p-2 text-gray-500 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-violet-800 dark:text-gray-200 dark:hover:bg-violet-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <ul className="space-y-4">
            {POST_OPTIONS.map((opt) => (
              <li key={opt.name}>
                <button
                  type="button"
                  onClick={() => handleOption(opt.href)}
                  className={`group flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${opt.hover}`}
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${opt.tile}`}
                  >
                    <opt.icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-gray-900 dark:text-white">
                      {opt.name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
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
