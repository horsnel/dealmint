import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  MessageSquare, 
  Wallet, 
  Star, 
  Package, 
  Plus,
  ArrowRight,
  Bell,
  Bookmark,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/AppContext';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

const activityIcons = {
  message: MessageSquare,
  order: Package,
  payment: Wallet,
  review: Star,
  system: Bell,
  referral: Gift,
  safety: Bell,
} as const;

export function DashboardPage() {
  usePageTitle('Dashboard');
  const { user, myListings, unreadMessages, unreadNotifications, notifications, orders, getSellerStats } = useApp();

  if (!user) return null;

  const rating = getSellerStats(user.id);
  const activeListings = myListings.filter((l) => l.isActive && !l.isDraft).length;
  const ordersNeedingAction = orders.filter(
    (o) =>
      (o.sellerId === user.id && (o.status === 'pending' || o.status === 'in_progress')) ||
      (o.buyerId === user.id && o.status === 'delivered')
  ).length;

  const stats = [
    { label: 'Active Listings', value: String(activeListings), icon: Briefcase, href: '/dashboard/listings' },
    { label: 'Unread Messages', value: String(unreadMessages), icon: MessageSquare, href: '/dashboard/messages' },
    { label: 'Wallet Balance', value: `₦${user.walletBalance.toLocaleString()}`, icon: Wallet, href: '/dashboard/wallet' },
    { label: 'Rating', value: rating.count > 0 ? String(rating.rating) : 'N/A', icon: Star, href: '/dashboard/reviews' },
  ];

  const quickActions = [
    { label: 'Post a Gig', href: '/post/gig', icon: Plus, color: 'bg-violet-600' },
    { label: 'Post a Task', href: '/post/task', icon: Plus, color: 'bg-amber-500' },
    { label: 'My Orders', href: '/dashboard/orders', icon: Package, color: 'bg-green-500' },
    { label: 'Browse Jobs', href: '/browse?category=jobs', icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Saved Searches', href: '/dashboard/saved-searches', icon: Bookmark, color: 'bg-pink-500' },
    { label: 'Referrals', href: '/dashboard/referrals', icon: Gift, color: 'bg-violet-500' },
  ];

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
              Welcome back, {user.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {ordersNeedingAction > 0
                ? `You have ${ordersNeedingAction} order${ordersNeedingAction === 1 ? '' : 's'} that need${ordersNeedingAction === 1 ? 's' : ''} your attention`
                : "Here's what's happening with your account"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/post/gig">
              <Button className="rounded-full bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Post New
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:shadow-lg transition-shadow dark:bg-violet-800 dark:border-violet-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-violet-800 dark:border-violet-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      to={action.href}
                      className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-violet-700/50 hover:bg-gray-100 dark:hover:bg-violet-700 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-3`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                        {action.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6 dark:bg-violet-800 dark:border-violet-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white">Recent Activity</CardTitle>
                <Link to="/dashboard/notifications" className="inline-block py-2.5 -my-2.5 text-sm text-violet-600 dark:text-amber-400 hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                    No activity yet. Orders, messages and payments will appear here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notifications.slice(0, 4).map((n) => {
                      const Icon = activityIcons[n.type] || Bell;
                      return (
                        <Link
                          key={n.id}
                          to={n.link || '/dashboard/notifications'}
                          className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-violet-700/30 hover:bg-gray-100 dark:hover:bg-violet-700/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-violet-600 dark:text-violet-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white truncate">{n.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{timeAgo(n.createdAt)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="dark:bg-violet-800 dark:border-violet-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <img
                    src={user.avatar || '/images/avatar_default.jpg'}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-amber-500"
                  />
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-gray-900 dark:text-white">{rating.count > 0 ? rating.rating : 'N/A'}</span>
                    <span className="text-gray-500 dark:text-gray-400">({rating.count} reviews)</span>
                  </div>
                  <Link to="/dashboard/profile">
                    <Button variant="outline" className="mt-4 w-full dark:border-violet-600 dark:text-white">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status */}
            <Card className="dark:bg-violet-800 dark:border-violet-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-base">Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Phone', status: user.phoneVerified ? 'Verified' : 'Pending', ok: user.phoneVerified, href: '/verify-phone' },
                    {
                      label: 'ID',
                      status: user.idStatus === 'verified' || user.idVerified ? 'Verified' : user.idStatus === 'pending' ? 'In review' : 'Pending',
                      ok: user.idStatus === 'verified' || user.idVerified,
                      href: '/dashboard/verify',
                    },
                    { label: 'Student', status: user.studentVerified ? 'Verified' : 'Not verified', ok: !!user.studentVerified, href: '/dashboard/profile' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                      {item.ok ? (
                        <span className="text-sm text-green-500">{item.status}</span>
                      ) : (
                        <Link to={item.href} className="inline-block py-2.5 -my-2.5 text-sm text-amber-500 hover:underline">
                          {item.status}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="dark:bg-violet-800 dark:border-violet-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-900 dark:text-white text-base">Notifications</CardTitle>
                <Bell className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unreadNotifications > 0
                    ? `You have ${unreadNotifications} unread notification${unreadNotifications === 1 ? '' : 's'}`
                    : 'You are all caught up'}
                </p>
                <Link to="/dashboard/notifications">
                  <Button variant="link" className="p-0 h-auto py-2.5 -my-2.5 px-1 -mx-1 text-violet-600 dark:text-amber-400">
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
