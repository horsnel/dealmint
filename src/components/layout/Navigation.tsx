import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import {
  Menu,
  X,
  User as UserIcon,
  Briefcase,
  MessageSquare,
  Wallet,
  LogOut,
  ChevronDown,
  Bell,
  Heart,
  Package,
  Settings,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { User } from '@/types';

interface NavigationProps {
  user: User | null;
}

export function Navigation({ user }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, unreadMessages, unreadNotifications } = useApp();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Browse', href: '/browse' },
    { name: 'Categories', href: '/categories' },
  ];

  const postLinks = [
    { name: 'Post a Gig', href: '/post/gig', icon: Briefcase },
    { name: 'Post a Task', href: '/post/task', icon: Briefcase },
    { name: 'Post a Job', href: '/post/job', icon: Briefcase },
    { name: 'Offer a Service', href: '/post/service', icon: Briefcase },
    { name: 'Sell Digital', href: '/post/digital', icon: Briefcase },
  ];

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
    toast.success('You have been logged out');
  };

  const Badge = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isLandingPage
          ? 'bg-white/95 dark:bg-violet-900/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Logo tone={isScrolled || !isLandingPage ? 'auto' : 'light'} />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:opacity-80 ${
                  isScrolled || !isLandingPage
                    ? 'text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-amber-400'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Post Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80 ${
                      isScrolled || !isLandingPage
                        ? 'text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-amber-400'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    Post <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {postLinks.map((link) => (
                    <DropdownMenuItem key={link.name} onClick={() => navigate(link.href)}>
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <Link
                  to="/dashboard/notifications"
                  aria-label={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ''}`}
                  className={`relative p-2 rounded-full transition-colors ${
                    isScrolled || !isLandingPage
                      ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <Badge count={unreadNotifications} />
                </Link>

                {/* Messages */}
                <Link
                  to="/dashboard/messages"
                  aria-label={`Messages${unreadMessages ? `, ${unreadMessages} unread` : ''}`}
                  className={`relative p-2 rounded-full transition-colors ${
                    isScrolled || !isLandingPage
                      ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <Badge count={unreadMessages} />
                </Link>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button aria-label="Account menu" className="flex items-center gap-2 focus:outline-none">
                      <img
                        src={user.avatar || '/images/avatar_default.jpg'}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-amber-500"
                      />
                      <ChevronDown className={`w-4 h-4 ${
                        isScrolled || !isLandingPage
                          ? 'text-gray-700 dark:text-gray-200'
                          : 'text-white/90'
                      }`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <UserIcon className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/listings')}>
                      <Briefcase className="w-4 h-4 mr-2" />
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/orders')}>
                      <Package className="w-4 h-4 mr-2" />
                      Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/favourites')}>
                      <Heart className="w-4 h-4 mr-2" />
                      Favourites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/wallet')}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/reviews')}>
                      <Star className="w-4 h-4 mr-2" />
                      Reviews
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${
                    isScrolled || !isLandingPage
                      ? 'text-gray-700 dark:text-gray-200 hover:text-violet-600'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  Log in
                </Link>
                <Link to="/register">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: avatar (dashboard shortcut) + menu button */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Go to dashboard"
              className={`p-1.5 rounded-full transition-colors ${
                isScrolled || !isLandingPage
                  ? 'hover:bg-gray-100 dark:hover:bg-violet-800'
                  : 'hover:bg-white/10'
              }`}
            >
              {user ? (
                <img
                  src={user.avatar || '/images/avatar_default.jpg'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-amber-500"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-800 border-2 border-amber-500 flex items-center justify-center text-violet-600 dark:text-amber-400">
                  <UserIcon className="w-5 h-5" />
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className={`p-2 rounded-lg transition-colors ${
                isScrolled || !isLandingPage
                  ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-violet-800'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? (
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-violet-800 flex items-center justify-center text-gray-600 dark:text-gray-200"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </span>
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-violet-900 border-t dark:border-violet-800">
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-amber-400 font-medium"
              >
                {link.name}
              </Link>
            ))}
            
            {/* Post options moved to the mobile FAB bottom sheet (PostFab) */}

            {user ? (
              <div className="border-t dark:border-violet-800 pt-4 space-y-2">
                <Link
                  to="/dashboard/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-200"
                >
                  <Package className="w-4 h-4" />
                  Orders
                </Link>
                <Link
                  to="/dashboard/messages"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
                </Link>
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-200"
                >
                  <Bell className="w-4 h-4" />
                  Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ''}
                </Link>
                <Link
                  to="/dashboard/favourites"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-200"
                >
                  <Heart className="w-4 h-4" />
                  Favourites
                </Link>
                <Link
                  to="/dashboard/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-gray-700 dark:text-gray-200"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            ) : (
              <div className="border-t dark:border-violet-800 pt-4 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-2 text-gray-700 dark:text-gray-200 border rounded-lg"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center py-2 bg-amber-500 text-white rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
