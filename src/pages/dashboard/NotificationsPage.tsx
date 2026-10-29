import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Package, Wallet, Star, Info, CheckCheck, Trash2, Gift, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Notification } from '@/types';

const icons: Record<Notification['type'], typeof Bell> = {
  message: MessageSquare,
  order: Package,
  payment: Wallet,
  review: Star,
  system: Info,
  referral: Gift,
  safety: ShieldCheck,
};

export function NotificationsPage() {
  usePageTitle('Notifications');
  const navigate = useNavigate();
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useApp();

  const open = (n: Notification) => {
    markNotificationRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {unreadNotifications > 0 ? `${unreadNotifications} unread` : 'You are all caught up'}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={unreadNotifications === 0}
                onClick={() => {
                  markAllNotificationsRead();
                  toast.success('All marked as read');
                }}
                className="dark:border-violet-600 dark:text-white"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearNotifications();
                  toast.success('Notifications cleared');
                }}
                className="dark:border-violet-600 dark:text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="card-white dark:bg-violet-800 dark:border-violet-700">
            <EmptyState icon={Bell} title="No notifications" description="Order updates, messages and payments will show up here." />
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const Icon = icons[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => open(n)}
                  className={`w-full text-left card-white dark:bg-violet-800 dark:border-violet-700 p-4 flex items-start gap-4 hover:shadow-md transition-shadow ${
                    n.isRead ? '' : 'border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-violet-600 dark:text-violet-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-gray-900 dark:text-white truncate ${n.isRead ? 'font-medium' : 'font-semibold'}`}>
                        {n.title}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{n.message}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
