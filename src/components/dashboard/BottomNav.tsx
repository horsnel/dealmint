import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Wallet, User as UserIcon } from 'lucide-react';

// Mobile bottom navigation — rendered only on the dashboard (for now) and
// portalled to <body> so the route-in transform can never hijack the
// fixed positioning (the Task 27 lesson).
const LEFT_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Search', href: '/browse', icon: Search },
];

const RIGHT_ITEMS = [
  { label: 'Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export function BottomNav({ onPost }: { onPost: () => void }) {
  const { pathname } = useLocation();

  const item = ({ label, href, icon: Icon }: (typeof LEFT_ITEMS)[number]) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        to={href}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-col items-center gap-0.5 py-1 transition-colors ${
          active
            ? 'text-violet-600 dark:text-amber-400'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
      >
        <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
        <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
      </Link>
    );
  };

  return createPortal(
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-violet-100 dark:border-violet-800 bg-white/95 dark:bg-violet-900/95 backdrop-blur-md pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center">
        {LEFT_ITEMS.map(item)}
        {/* Center create button — raised, highlighted, ring blends into page bg */}
        <button
          type="button"
          onClick={onPost}
          aria-label="Post new"
          className="flex flex-col items-center justify-center"
        >
          <span className="w-12 h-12 -mt-5 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 ring-4 ring-[#F5F3FF] dark:ring-violet-950 transition active:scale-95">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </span>
        </button>
        {RIGHT_ITEMS.map(item)}
      </div>
    </nav>,
    document.body
  );
}
