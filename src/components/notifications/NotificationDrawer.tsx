import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Gift,
  Info,
  MessageSquare,
  Package,
  ShieldCheck,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { timeAgo } from '@/lib/format';
import type { Notification } from '@/types';

/* Per-type icon + brand-tinted bubble (violet = activity, amber = money &
   rewards, green = safety), matching the dashboard activity card. */
const typeMeta: Record<
  Notification['type'],
  { icon: typeof Bell; bubble: string; ink: string }
> = {
  order: { icon: Package, bubble: 'bg-violet-100 dark:bg-violet-500/20', ink: 'text-violet-600 dark:text-violet-300' },
  message: { icon: MessageSquare, bubble: 'bg-violet-100 dark:bg-violet-500/20', ink: 'text-violet-600 dark:text-violet-300' },
  system: { icon: Info, bubble: 'bg-violet-100 dark:bg-violet-500/20', ink: 'text-violet-600 dark:text-violet-300' },
  payment: { icon: Wallet, bubble: 'bg-amber-100 dark:bg-amber-500/20', ink: 'text-amber-600 dark:text-amber-300' },
  review: { icon: Star, bubble: 'bg-amber-100 dark:bg-amber-500/20', ink: 'text-amber-600 dark:text-amber-300' },
  referral: { icon: Gift, bubble: 'bg-amber-100 dark:bg-amber-500/20', ink: 'text-amber-600 dark:text-amber-300' },
  safety: { icon: ShieldCheck, bubble: 'bg-green-100 dark:bg-green-500/20', ink: 'text-green-600 dark:text-green-300' },
};

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Quiet in-app notification drawer — opens from the bell (bottom sheet on
 * phones, side panel on desktop). Business events land here instead of
 * popping up; toasts stay reserved for direct action confirmations.
 */
export function NotificationDrawer({ open, onOpenChange }: NotificationDrawerProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useApp();

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  const openNotification = (n: Notification) => {
    markNotificationRead(n.id);
    if (n.link) {
      onOpenChange(false);
      navigate(n.link);
    }
  };

  const renderItem = (n: Notification) => {
    const meta = typeMeta[n.type] ?? typeMeta.system;
    const Icon = meta.icon;
    return (
      <button
        key={n.id}
        type="button"
        onClick={() => openNotification(n)}
        aria-label={`${n.title}${n.isRead ? '' : ' — unread'}`}
        className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-violet-700/40 focus-visible:outline-none focus-visible:bg-violet-50 dark:focus-visible:bg-violet-700/40 ${
          n.isRead ? '' : 'bg-violet-50/70 dark:bg-violet-500/10'
        }`}
      >
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.bubble}`}
        >
          <Icon className={`w-[18px] h-[18px] ${meta.ink}`} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center justify-between gap-3">
            <span
              className={`text-sm truncate text-gray-900 dark:text-white ${
                n.isRead ? 'font-medium' : 'font-semibold'
              }`}
            >
              {n.title}
            </span>
            <span className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 leading-none">
                {timeAgo(n.createdAt)}
              </span>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-violet-600 dark:bg-violet-400" aria-hidden="true" />
              )}
            </span>
          </span>
          <span className="block text-[13px] leading-snug text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
            {n.message}
          </span>
        </span>
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={`p-0 gap-0 flex flex-col bg-white dark:bg-violet-900 border-gray-200 dark:border-violet-700 ${
          isMobile
            ? 'h-[min(78dvh,600px)] rounded-t-3xl'
            : 'w-[400px] sm:max-w-[400px]'
        }`}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isMobile && (
          <div className="pt-2.5 pb-1 shrink-0" aria-hidden="true">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300 dark:bg-violet-600" />
          </div>
        )}

        <SheetHeader className="shrink-0 px-5 pb-3 pt-3 border-b border-gray-200 dark:border-violet-700">
          <div className="flex items-center gap-2.5">
            <SheetTitle className="font-display font-bold text-lg text-gray-900 dark:text-white m-0">
              Notifications
            </SheetTitle>
            {unreadNotifications > 0 && (
              <span className="min-w-6 h-6 px-2 rounded-full bg-violet-600 text-white text-[11px] font-semibold flex items-center justify-center">
                {unreadNotifications > 99 ? '99+' : unreadNotifications} new
              </span>
            )}
          </div>
          <SheetDescription className="sr-only">
            Your Dealmint notifications — orders, messages, payments and safety updates
          </SheetDescription>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <button
                type="button"
                disabled={unreadNotifications === 0}
                onClick={markAllNotificationsRead}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-amber-400 rounded-full px-2 py-1 hover:bg-violet-50 dark:hover:bg-violet-800 disabled:opacity-40 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
              <span className="w-px h-3.5 bg-gray-200 dark:bg-violet-700" aria-hidden="true" />
              <button
                type="button"
                onClick={() => clearNotifications()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 rounded-full px-2 py-1 hover:bg-gray-100 dark:hover:bg-violet-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>
          )}
        </SheetHeader>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-8 text-center py-12">
              <span className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-violet-500 dark:text-violet-300" />
              </span>
              <p className="font-display font-semibold text-gray-900 dark:text-white">
                You're all caught up
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[26ch]">
                Order updates, messages and payments will land here quietly.
              </p>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <div>
                  <p className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    New
                  </p>
                  {unread.map(renderItem)}
                </div>
              )}
              {read.length > 0 && (
                <div className="pb-2">
                  {unread.length > 0 && (
                    <p className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Earlier
                    </p>
                  )}
                  {read.map(renderItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="shrink-0 border-t border-gray-200 dark:border-violet-700 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate('/dashboard/notifications');
              }}
              className="w-full text-center text-sm font-semibold text-violet-600 dark:text-amber-400 rounded-full py-2 hover:bg-violet-50 dark:hover:bg-violet-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              View all notifications
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
