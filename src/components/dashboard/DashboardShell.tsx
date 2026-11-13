import { useState, type ReactNode } from 'react';
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
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { NotificationDrawer } from '@/components/notifications/NotificationDrawer';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

// The dashboard app-shell. Below md: the tinted sticky header from Navigation
// owns the screen (its hamburger opens a full-screen overlay menu); from md:
// up this shell draws a permanent fixed left sidebar + a plain top bar, and
// the content takes the remaining width at max-w-7xl.
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

const linkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
    active
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-amber-400'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-violet-800'
  }`;

export function DashboardShell({ children }: { children: ReactNode }) {
  const { user, unreadMessages, unreadNotifications, logout } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('You have been logged out');
  };

  // Protected routes guarantee a user; the guard just keeps TS honest.
  if (!user) {
    return (
      <main className="min-h-screen bg-[#F5F3FF] dark:bg-violet-950 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    );
  }

  const messagesBadge = unreadMessages > 0;

  return (
    <div className="min-h-screen bg-[#F5F3FF] dark:bg-violet-950">
      {/* Desktop sidebar — a permanent fixed column from md: up, never an
          overlay. z-50 keeps it above Leaflet map panes. */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-50 flex-col bg-white dark:bg-violet-900 border-r border-gray-200 dark:border-violet-800">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-violet-800 shrink-0">
          <Logo href="/" tone="auto" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-violet-700">
            Menu
          </p>
          {SITE_LINKS.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} className={linkClass(pathname === href)}>
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-violet-700">
            My account
          </p>
          {ACCOUNT_LINKS.map(({ label, href, icon: Icon }) => (
            <Link key={href} to={href} className={linkClass(pathname === href)}>
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-gray-200 dark:border-violet-800 space-y-1 shrink-0">
          <Link to="/dashboard/settings" className={linkClass(pathname === '/dashboard/settings')}>
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
        </div>
      </aside>

      {/* Desktop top bar — sits next to the sidebar, not sticky */}
      <div className="hidden md:block md:pl-64">
        <div className="h-16 flex items-center justify-end gap-1 px-4 sm:px-6 lg:px-8">
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
        </div>
      </div>

      {/* Main content — right of the sidebar, full remaining width */}
      <div className="md:ml-64">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>

      <NotificationDrawer open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
