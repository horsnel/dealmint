import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  MessageCircle,
  Star,
  Plus,
  Inbox,
  Heart,
  Bookmark,
  Gift,
  UserPlus,
  ChevronRight,
  Package,
  MessageSquare,
  Wallet,
  Bell,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MODES, modesOf } from '@/lib/modes';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { PostNewSheet } from '@/components/dashboard/PostNewSheet';

const activityIcons = {
  message: MessageSquare,
  order: Package,
  payment: Wallet,
  review: Star,
  system: Bell,
  referral: Gift,
  safety: Bell,
} as const;

// Layout order (top to bottom): welcome → hero wallet → metrics → quick
// actions (floating, never in cards) → action banners → recent activity →
// profile → verification. One breathable column, no nested cards.
export function DashboardPage() {
  usePageTitle('Dashboard');
  const { user, myListings, unreadMessages, notifications, orders, getSellerStats } = useApp();
  const [postOpen, setPostOpen] = useState(false);

  if (!user) return null;

  const rating = getSellerStats(user.id);
  const activeListings = myListings.filter((l) => l.isActive && !l.isDraft).length;
  const ordersNeedingAction = orders.filter(
    (o) =>
      (o.sellerId === user.id && (o.status === 'pending' || o.status === 'in_progress')) ||
      (o.buyerId === user.id && o.status === 'delivered')
  ).length;

  // Provider modes personalize the dashboard (preference, not permission —
  // every action stays available to everyone).
  const myModes = modesOf(user);

  // Profile completeness — the same checks the Verification list shows plus
  // the basics (name, photo), so the bar and the list never disagree.
  const completenessChecks = [
    true, // email — a given once signed in
    user.phoneVerified,
    user.idVerified || user.idStatus === 'verified',
    !!user.studentVerified,
    !!user.avatar,
    !!user.name,
  ];
  const profilePct = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  const metrics = [
    {
      label: 'Active Listings',
      value: String(activeListings),
      icon: Briefcase,
      href: '/dashboard/listings',
      circle: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    },
    {
      label: 'Unread Messages',
      value: String(unreadMessages),
      icon: MessageCircle,
      href: '/dashboard/messages',
      circle: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    },
    {
      label: 'Rating',
      value: rating.count > 0 ? String(rating.rating) : 'N/A',
      icon: Star,
      href: '/dashboard/reviews',
      circle: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    },
  ];

  const quickActions = [
    { label: 'Find Work', href: '/browse', icon: Briefcase, circle: 'bg-blue-500', shadow: 'shadow-blue-500/30' },
    { label: 'Favourites', href: '/dashboard/favourites', icon: Heart, circle: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
    { label: 'Saved', href: '/dashboard/saved-searches', icon: Bookmark, circle: 'bg-pink-500', shadow: 'shadow-pink-500/30' },
    { label: 'Referrals', href: '/dashboard/referrals', icon: Gift, circle: 'bg-violet-600', shadow: 'shadow-violet-600/30' },
  ];

  const verificationItems = [
    {
      label: 'Phone',
      status: user.phoneVerified ? 'Verified' : 'Pending',
      ok: user.phoneVerified,
      href: '/verify-phone',
    },
    {
      label: 'ID',
      status:
        user.idVerified || user.idStatus === 'verified'
          ? 'Verified'
          : user.idStatus === 'pending'
            ? 'In review'
            : 'Not verified',
      ok: user.idVerified || user.idStatus === 'verified',
      href: '/dashboard/verify',
    },
    {
      label: 'Student',
      status: user.studentVerified ? 'Verified' : 'Not verified',
      ok: !!user.studentVerified,
      href: '/dashboard/profile',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3FF] dark:bg-violet-950">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-32 md:pb-12 space-y-6">
        {/* Welcome */}
        <section>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {ordersNeedingAction > 0
              ? `You have ${ordersNeedingAction} order${ordersNeedingAction === 1 ? '' : 's'} that need${ordersNeedingAction === 1 ? 's' : ''} your attention.`
              : "Here's what's happening with your account."}
          </p>
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            <div className="flex flex-wrap items-center gap-1.5">
              {MODES.filter((m) => myModes.includes(m.id)).map((m) => (
                <Link
                  key={m.id}
                  to="/dashboard/settings"
                  title="Edit modes in Settings"
                  className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25 transition-colors"
                >
                  {m.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPostOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-700 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              Post New
            </button>
          </div>
        </section>

        {/* Hero wallet card */}
        <section className="card-tactile rounded-3xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-6">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wallet Balance</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tracking-tight">
            ₦{user.walletBalance.toLocaleString()}
          </p>
          <div className="flex gap-3 mt-5">
            <Link
              to="/dashboard/wallet"
              className="flex-1 rounded-full border border-violet-200 py-2.5 text-center text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-800 transition-colors"
            >
              Withdraw
            </Link>
            <Link
              to="/dashboard/wallet"
              className="flex-1 rounded-full bg-violet-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              Add Funds
            </Link>
          </div>
        </section>

        {/* Metrics row */}
        <section className="grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <Link
              key={m.label}
              to={m.href}
              className="card-tactile rounded-2xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-4 flex flex-col gap-3"
            >
              <span className={`w-9 h-9 rounded-full p-2 flex items-center justify-center ${m.circle}`}>
                <m.icon className="w-full h-full" />
              </span>
              <span>
                <span className="block text-lg font-bold text-gray-900 dark:text-white leading-none">
                  {m.value}
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                  {m.label}
                </span>
              </span>
            </Link>
          ))}
        </section>

        {/* Quick actions — floating on the background, never inside cards */}
        <section>
          <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href} className="group flex flex-col items-center gap-2">
                <span
                  className={`w-14 h-14 rounded-full ${action.circle} ${action.shadow} shadow-lg flex items-center justify-center text-white transition-transform group-hover:scale-105 group-active:scale-95`}
                >
                  <action.icon className="w-6 h-6" />
                </span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Action banners */}
        <section className="space-y-3">
          <Link
            to="/dashboard/profile"
            className="card-tactile flex items-center gap-4 rounded-2xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-4"
          >
            <span className="w-11 h-11 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-gray-900 dark:text-white">
                Complete your profile
              </span>
              <span className="block h-1.5 rounded-full bg-gray-100 dark:bg-violet-800 mt-2 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all"
                  style={{ width: `${profilePct}%` }}
                />
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
          <Link
            to="/dashboard/referrals"
            className="card-tactile flex items-center gap-4 rounded-2xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-4"
          >
            <span className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-gray-900 dark:text-white">
                Invite friends
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Share your invite code and grow the community
              </span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        </section>

        {/* Recent activity */}
        <section className="rounded-3xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Link
              to="/dashboard/notifications"
              className="inline-block py-2.5 -my-2.5 px-1 -mx-1 text-sm font-medium text-violet-600 dark:text-amber-400 hover:underline"
            >
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 flex flex-col items-center text-center gap-2">
              <span className="w-12 h-12 rounded-full bg-gray-100 dark:bg-violet-800 flex items-center justify-center text-gray-400">
                <Inbox className="w-6 h-6" />
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px]">
                No activity yet. Orders, messages and payments will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-violet-800/60">
              {notifications.slice(0, 4).map((n) => {
                const Icon = activityIcons[n.type] || Bell;
                return (
                  <Link
                    key={n.id}
                    to={n.link || '/dashboard/notifications'}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
                  >
                    <span className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">
                        {n.title}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-violet-700 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Profile card */}
        <section className="rounded-3xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-6 text-center">
          <img
            src={user.avatar || '/images/avatar_default.jpg'}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-amber-500"
          />
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mt-3">
            {user.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              {rating.count > 0 ? rating.rating : 'N/A'}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">({rating.count} reviews)</span>
          </div>
          <Link
            to="/dashboard/profile"
            className="block w-full mt-5 rounded-lg bg-gray-100 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-200 dark:bg-violet-800 dark:text-gray-100 dark:hover:bg-violet-700 transition-colors"
          >
            Edit Profile
          </Link>
        </section>

        {/* Verification status */}
        <section className="rounded-3xl bg-white dark:bg-violet-900 dark:border dark:border-violet-800 p-5">
          <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-1">
            Verification Status
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-violet-800/60">
            {verificationItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3.5">
                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                {item.ok ? (
                  <span className="text-sm font-medium text-green-500">{item.status}</span>
                ) : (
                  <Link
                    to={item.href}
                    className={`text-sm font-medium hover:underline py-2.5 -my-2.5 ${
                      item.status === 'Not verified' ? 'text-red-500' : 'text-orange-500'
                    }`}
                  >
                    {item.status}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Mobile bottom navigation + shared post-new sheet */}
      <BottomNav onPost={() => setPostOpen(true)} />
      <PostNewSheet open={postOpen} onOpenChange={setPostOpen} user={user} />
    </div>
  );
}
