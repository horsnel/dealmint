import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Store,
  Compass,
  LayoutGrid,
  MapPin,
  Package,
  Wallet,
  MessageSquare,
  Heart,
  Settings,
  LogOut,
  Bell,
  X,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

// The app shell carries BOTH historical sidebar designs, switched app-wide by
// the Settings toggle (navSide) instead of by page:
//   'left'  — the dashboard design: fixed left w-64 white sidebar with violet
//             active states (Sidebar Version 2).
//   'right' — the marketplace design: the old Navigation menu (profile card,
//             gray links, notifications inline, amber accents, pinned logout)
//             anchored as a fixed right w-64 sidebar; its drawer slides in
//             from the right on mobile.
const SITE_LINKS = [
  { label: 'Marketplace', href: '/marketplace', icon: Store },
  { label: 'Browse', href: '/browse', icon: Compass },
  { label: 'Categories', href: '/categories', icon: LayoutGrid },
  { label: 'Safe Spots', href: '/safe-spots', icon: MapPin },
];

const ACCOUNT_LINKS = [
  { label: 'Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Favourites', href: '/dashboard/favourites', icon: Heart },
];

// Routes that render chrome-free (no shell): the immersive inbox keeps its own
// conversation sidebar; the auth/onboarding flows are focused, full-screen.
const CHROME_FREE_PATHS = [
  '/dashboard/messages',
  '/login',
  '/register',
  '/onboarding',
  '/role-selection',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-phone',
  '/oauth/callback',
  '/auth/magic',
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, unreadMessages, unreadNotifications, logout, navSide } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isRight = navSide === 'right';

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // While the drawer is up: Escape closes it and the page behind stops scrolling.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const messagesBadge = unreadMessages > 0;

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/');
    toast.success('You have been logged out');
  };

  // ---- Left design nav (dashboard): violet active pill ----
  const leftLink = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      active
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-amber-400'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-violet-800'
    }`;

  const leftNav = (
    <nav className="space-y-1">
      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-violet-700">
        Menu
      </p>
      {SITE_LINKS.map(({ label, href, icon: Icon }) => (
        <Link key={href} to={href} onClick={() => setDrawerOpen(false)} className={leftLink(pathname === href)}>
          <Icon className="w-5 h-5 shrink-0" />
          {label}
        </Link>
      ))}
      {user && (
        <>
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-violet-700">
            My account
          </p>
          {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} onClick={() => setDrawerOpen(false)} className={leftLink(pathname === href)}>
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );

  // ---- Right design nav (marketplace): gray links, amber active pill ----
  const rightLink = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      active
        ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800'
    }`;

  const rightNav = (
    <nav className="space-y-1">
      {SITE_LINKS.map(({ label, href, icon: Icon }) => (
        <Link key={href} to={href} onClick={() => setDrawerOpen(false)} className={rightLink(pathname === href)}>
          <Icon className="w-5 h-5 shrink-0" />
          {label}
        </Link>
      ))}
      {user && (
        <>
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-violet-700">
            My account
          </p>
          {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} onClick={() => setDrawerOpen(false)} className={rightLink(pathname === href)}>
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );

  // Chrome-free routes render their children untouched. (Kept after the hooks
  // above so the hook order never differs between renders.)
  if (CHROME_FREE_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF] dark:bg-violet-950">
      {/* ---------- Desktop sidebar (design depends on navSide) ---------- */}
      {isRight ? (
        /* Marketplace design — fixed RIGHT column, restored from the old
           Navigation menu: profile card, gray links with amber active state,
           notifications inline, pinned logout. */
        <aside className="hidden md:flex fixed inset-y-0 right-0 w-64 z-50 flex-col bg-white dark:bg-violet-900 border-l border-gray-200 dark:border-violet-800">
          <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-violet-800 shrink-0">
            <Logo href="/" tone="auto" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            {user && (
              <Link
                to="/dashboard"
                className="flex items-center gap-3 rounded-2xl border border-violet-100 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-800/60 p-3 mb-4 transition-colors hover:bg-violet-100 dark:hover:bg-violet-800/80"
              >
                <img
                  src={user.avatar || '/images/avatar_default.jpg'}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-amber-500 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </Link>
            )}
            {rightNav}
            {user && (
              <div className="border-t border-gray-100 dark:border-violet-800 mt-3 pt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => setNotifOpen(true)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800 font-medium transition-colors"
                >
                  <Bell className="w-5 h-5 shrink-0" />
                  <span>Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ''}</span>
                </button>
                <Link to="/dashboard/settings" className={rightLink(pathname === '/dashboard/settings')}>
                  <Settings className="w-5 h-5 shrink-0" />
                  Settings
                </Link>
              </div>
            )}
          </div>
          <div className="px-3 py-3 border-t border-gray-100 dark:border-violet-800 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Log out
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center py-2 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-violet-600 rounded-lg hover:bg-gray-50 dark:hover:bg-violet-800 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/onboarding"
                  className="block w-full text-center py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </aside>
      ) : (
        /* Dashboard design — permanent fixed left column, never an overlay.
            z-50 keeps it above Leaflet map panes. */
        <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-50 flex-col bg-white dark:bg-violet-900 border-r border-gray-200 dark:border-violet-800">
          <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-violet-800 shrink-0">
            <Logo href="/" tone="auto" />
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{leftNav}</div>
          <div className="px-3 py-3 border-t border-gray-200 dark:border-violet-800 space-y-1 shrink-0">
            {user ? (
              <>
                <Link to="/dashboard/settings" className={leftLink(pathname === '/dashboard/settings')}>
                  <Settings className="w-5 h-5 shrink-0" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-violet-600 hover:bg-gray-50 dark:hover:bg-violet-800 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/onboarding"
                  className="flex items-center justify-center w-full rounded-xl px-4 py-2.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </aside>
      )}

      {/* ---------- Mobile header ---------- */}
      <header className="sticky top-0 z-50 bg-[#F5F3FF]/90 dark:bg-violet-950/90 backdrop-blur-md md:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Logo tone="auto" />
            <div className="flex items-center gap-1">
              {user && (
                <Link
                  to="/dashboard/messages"
                  aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ''}`}
                  className="relative p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
                className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Mobile drawer: the active sidebar's design, sliding in
          from the matching side ---------- */}
      {drawerOpen && (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-[55] bg-black/40 animate-in fade-in duration-200"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className={`fixed inset-y-0 w-72 max-w-[85vw] z-[56] flex flex-col bg-white dark:bg-violet-900 shadow-xl animate-in duration-200 ${
              isRight
                ? 'right-0 slide-in-from-right border-l border-gray-100 dark:border-violet-800'
                : 'left-0 slide-in-from-left border-r border-gray-100 dark:border-violet-800'
            }`}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-violet-800 shrink-0">
              <Logo href="/" tone="auto" />
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col">
              {isRight && user && (
                <Link
                  to="/dashboard"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-violet-100 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-800/60 p-3 mb-4 transition-colors active:bg-violet-100 dark:active:bg-violet-800/80"
                >
                  <img
                    src={user.avatar || '/images/avatar_default.jpg'}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </span>
                    <span className="block text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
              )}
              <div className="flex-1">
                {isRight ? rightNav : leftNav}
                {user && (
                  <div className="border-t border-gray-100 dark:border-violet-800 mt-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        setNotifOpen(true);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800 font-medium transition-colors"
                    >
                      <Bell className="w-5 h-5 shrink-0" />
                      <span>Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ''}</span>
                    </button>
                  </div>
                )}
              </div>
              {/* Pinned bottom actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-violet-800 space-y-1">
                {user ? (
                  <>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setDrawerOpen(false)}
                      className={isRight ? rightLink(pathname === '/dashboard/settings') : leftLink(pathname === '/dashboard/settings')}
                    >
                      <Settings className="w-5 h-5 shrink-0" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-medium transition-colors"
                    >
                      <LogOut className="w-5 h-5 shrink-0" />
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 pt-1">
                    <Link
                      to="/login"
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center justify-center w-full py-2 rounded-lg border ${
                        isRight
                          ? 'text-gray-700 dark:text-gray-200 border-gray-200 dark:border-violet-600'
                          : 'rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 border-gray-200 dark:border-violet-600'
                      }`}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/onboarding"
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-center w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ---------- Desktop top bar (opposite the sidebar) ---------- */}
      <div className={`hidden md:block ${isRight ? 'md:pr-64' : 'md:pl-64'}`}>
        <div className="h-16 flex items-center justify-end gap-1 px-4 sm:px-6 lg:px-8">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
                aria-haspopup="dialog"
                className="relative p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
              <Link
                to="/dashboard/messages"
                aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ''}`}
                className="relative p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                {messagesBadge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-amber-400 transition-colors px-3 py-2"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      {/* Main content — beside the sidebar on the active side, below the
          header on mobile. Pages provide their own max-width containers. */}
      <div className={isRight ? 'md:mr-64' : 'md:ml-64'}>
        <main>{children}</main>
      </div>

      <NotificationDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
