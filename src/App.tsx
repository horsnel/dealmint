import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { PostFab } from '@/components/layout/PostFab';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { AppProvider, useApp } from '@/context/AppContext';
import { HomePage } from '@/pages/HomePage';
import './App.css';

// Load every page except the home page on demand to keep the first download small
function page<T extends Record<string, ComponentType>>(loader: () => Promise<T>, name: keyof T) {
  return lazy(() => loader().then((m) => ({ default: m[name] })));
}

const BrowsePage = page(() => import('@/pages/BrowsePage'), 'BrowsePage');
const CategoriesPage = page(() => import('@/pages/CategoriesPage'), 'CategoriesPage');
const ListingDetailPage = page(() => import('@/pages/ListingDetailPage'), 'ListingDetailPage');
const SellerProfilePage = page(() => import('@/pages/SellerProfilePage'), 'SellerProfilePage');
const HowItWorksPage = page(() => import('@/pages/HowItWorksPage'), 'HowItWorksPage');
const SafetyCenterPage = page(() => import('@/pages/SafetyCenterPage'), 'SafetyCenterPage');
const SafeSpotsPage = page(() => import('@/pages/SafeSpotsPage'), 'SafeSpotsPage');
const AboutPage = page(() => import('@/pages/AboutPage'), 'AboutPage');
const ContactPage = page(() => import('@/pages/ContactPage'), 'ContactPage');
const NotFoundPage = page(() => import('@/pages/NotFoundPage'), 'NotFoundPage');

const TermsPage = page(() => import('@/pages/InfoPages'), 'TermsPage');
const PrivacyPage = page(() => import('@/pages/InfoPages'), 'PrivacyPage');
const CookiesPage = page(() => import('@/pages/InfoPages'), 'CookiesPage');
const CareersPage = page(() => import('@/pages/InfoPages'), 'CareersPage');
const BlogPage = page(() => import('@/pages/InfoPages'), 'BlogPage');
const PressPage = page(() => import('@/pages/InfoPages'), 'PressPage');
const HelpPage = page(() => import('@/pages/InfoPages'), 'HelpPage');
const CommunityPage = page(() => import('@/pages/InfoPages'), 'CommunityPage');

const LoginPage = page(() => import('@/pages/auth/LoginPage'), 'LoginPage');
const RegisterPage = page(() => import('@/pages/auth/RegisterPage'), 'RegisterPage');
const RoleSelectionPage = page(() => import('@/pages/auth/RoleSelectionPage'), 'RoleSelectionPage');
const ForgotPasswordPage = page(() => import('@/pages/auth/ForgotPasswordPage'), 'ForgotPasswordPage');
const VerifyPhonePage = page(() => import('@/pages/auth/VerifyPhonePage'), 'VerifyPhonePage');

const DashboardPage = page(() => import('@/pages/dashboard/DashboardPage'), 'DashboardPage');
const ListingsPage = page(() => import('@/pages/dashboard/ListingsPage'), 'ListingsPage');
const EditListingPage = page(() => import('@/pages/dashboard/EditListingPage'), 'EditListingPage');
const MessagesPage = page(() => import('@/pages/dashboard/MessagesPage'), 'MessagesPage');
const WalletPage = page(() => import('@/pages/dashboard/WalletPage'), 'WalletPage');
const ProfilePage = page(() => import('@/pages/dashboard/ProfilePage'), 'ProfilePage');
const OrdersPage = page(() => import('@/pages/dashboard/OrdersPage'), 'OrdersPage');
const OrderDetailPage = page(() => import('@/pages/dashboard/OrderDetailPage'), 'OrderDetailPage');
const FavouritesPage = page(() => import('@/pages/dashboard/FavouritesPage'), 'FavouritesPage');
const NotificationsPage = page(() => import('@/pages/dashboard/NotificationsPage'), 'NotificationsPage');
const ReviewsPage = page(() => import('@/pages/dashboard/ReviewsPage'), 'ReviewsPage');
const SettingsPage = page(() => import('@/pages/dashboard/SettingsPage'), 'SettingsPage');
const SavedSearchesPage = page(() => import('@/pages/dashboard/SavedSearchesPage'), 'SavedSearchesPage');
const ReferralsPage = page(() => import('@/pages/dashboard/ReferralsPage'), 'ReferralsPage');
const VerifyIdPage = page(() => import('@/pages/dashboard/VerifyIdPage'), 'VerifyIdPage');

const PostGigPage = page(() => import('@/pages/post/PostGigPage'), 'PostGigPage');
const PostTaskPage = page(() => import('@/pages/post/PostTaskPage'), 'PostTaskPage');
const PostJobPage = page(() => import('@/pages/post/PostJobPage'), 'PostJobPage');
const PostServicePage = page(() => import('@/pages/post/PostServicePage'), 'PostServicePage');
const SellDigitalPage = page(() => import('@/pages/post/SellDigitalPage'), 'SellDigitalPage');

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useApp();
  const location = useLocation();

  if (isLoading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, isDarkMode } = useApp();
  const location = useLocation();

  const protect = (el: ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <ScrollToTop />
      {/* The inbox renders chrome-free — its own conversation sidebar with
          page-size title and avatar — chat-app style */}
      {location.pathname !== '/dashboard/messages' && <Navigation user={user} />}
      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/listing/:id" element={<ListingDetailPage />} />
              <Route path="/seller/:id" element={<SellerProfilePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/safety" element={<SafetyCenterPage />} />
              <Route path="/safe-spots" element={<SafeSpotsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/press" element={<PressPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/community" element={<CommunityPage />} />

              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/role-selection" element={<RoleSelectionPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-phone" element={<VerifyPhonePage />} />

              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={protect(<DashboardPage />)} />
              <Route path="/dashboard/listings" element={protect(<ListingsPage />)} />
              <Route path="/dashboard/listings/:id/edit" element={protect(<EditListingPage />)} />
              <Route path="/dashboard/orders" element={protect(<OrdersPage />)} />
              <Route path="/dashboard/orders/:id" element={protect(<OrderDetailPage />)} />
              <Route path="/dashboard/messages" element={protect(<MessagesPage />)} />
              <Route path="/dashboard/wallet" element={protect(<WalletPage />)} />
              <Route path="/dashboard/profile" element={protect(<ProfilePage />)} />
              <Route path="/dashboard/favourites" element={protect(<FavouritesPage />)} />
              <Route path="/dashboard/notifications" element={protect(<NotificationsPage />)} />
              <Route path="/dashboard/reviews" element={protect(<ReviewsPage />)} />
              <Route path="/dashboard/settings" element={protect(<SettingsPage />)} />
              <Route path="/dashboard/saved-searches" element={protect(<SavedSearchesPage />)} />
              <Route path="/dashboard/referrals" element={protect(<ReferralsPage />)} />
              <Route path="/dashboard/verify" element={protect(<VerifyIdPage />)} />

              {/* Protected Post Routes */}
              <Route path="/post/gig" element={protect(<PostGigPage />)} />
              <Route path="/post/task" element={protect(<PostTaskPage />)} />
              <Route path="/post/job" element={protect(<PostJobPage />)} />
              <Route path="/post/service" element={protect(<PostServicePage />)} />
              <Route path="/post/digital" element={protect(<SellDigitalPage />)} />

              {/* Legacy paths */}
              <Route path="/favorites" element={<Navigate to="/dashboard/favourites" replace />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {/* Footer is only part of the landing page */}
      {location.pathname === '/' && <Footer />}
      {/* Mobile-only: floating "Post" button + bottom sheet (replaces the mobile menu Post links) */}
      <PostFab user={user} />
      <Toaster position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  );
}
