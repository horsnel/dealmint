import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Briefcase,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { ListingCard } from '@/components/common/ListingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Stars } from '@/components/common/Stars';
import { timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

export function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // History-aware back: behaves like the browser back button, with a
  // sensible fallback when the page was opened directly (no history).
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/browse');
  };
  const location = useLocation();
  const { user, listings, getSeller, getSellerStats, getSellerResponsiveness, reviewsForSeller, startConversation } = useApp();

  const seller = getSeller(id);
  usePageTitle(seller?.name);

  if (!seller) {
    return (
      <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={Search}
            title="Seller not found"
            description="This profile does not exist or the account was closed."
            action={
              <Link to="/browse">
                <Button className="bg-violet-600 hover:bg-violet-700">Browse listings</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const sellerListings = listings.filter((l) => l.seller.id === seller.id);
  const reviews = reviewsForSeller(seller.id);
  const stats = getSellerStats(seller.id);
  const responsiveness = getSellerResponsiveness(seller.id);
  const isMe = user?.id === seller.id;
  const showLocation = seller.settings?.showLocation !== false;

  const handleContact = () => {
    if (!user) {
      toast.info('Log in to message sellers', {
        action: { label: 'Log in', onClick: () => navigate('/login', { state: { from: location.pathname } }) },
      });
      return;
    }
    const convoId = startConversation({ id: seller.id, name: seller.name, avatar: seller.avatar });
    if (convoId) navigate(`/dashboard/messages?c=${convoId}`);
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <img
              src={seller.avatar || '/images/avatar_default.jpg'}
              alt={seller.name}
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-amber-500"
            />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  {seller.name}
                </h1>
                {seller.isVerified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {seller.role === 'student' && (
                  <Badge className="bg-violet-600 text-white">Student</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stats.count > 0 ? stats.rating : 'New'}
                  </span>
                  {stats.count > 0 && (
                    <span className="text-gray-500 dark:text-gray-400">({stats.count} reviews)</span>
                  )}
                </div>
                {seller.location && showLocation && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4" />
                    {seller.location}
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(seller.joinedAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                </div>
                {responsiveness && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    Usually {responsiveness.label.toLowerCase()}
                    {responsiveness.lastActive && (
                      <span className="text-gray-400 dark:text-gray-500">· Active {timeAgo(responsiveness.lastActive)}</span>
                    )}
                  </div>
                )}
              </div>

              {seller.bio && (
                <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-2xl">{seller.bio}</p>
              )}

              {seller.skills && seller.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {seller.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="dark:bg-violet-700 dark:text-gray-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {isMe ? (
                  <Link to="/dashboard/profile">
                    <Button variant="outline" className="dark:border-violet-600 dark:text-white">
                      Edit your profile
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={handleContact} className="bg-violet-600 hover:bg-violet-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={goBack}
                  className="text-gray-600 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-white"
                >
                  <ArrowLeft className="size-6 mr-1" strokeWidth={2} />
                  Go back
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings">
          <TabsList className="mb-6 dark:bg-violet-800">
            <TabsTrigger value="listings" className="dark:data-[state=active]:bg-violet-600">
              Listings ({sellerListings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="dark:data-[state=active]:bg-violet-600">
              Reviews ({stats.count})
            </TabsTrigger>
            <TabsTrigger value="about" className="dark:data-[state=active]:bg-violet-600">
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {sellerListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellerListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Briefcase} title="No listings yet" description="This seller has no active listings right now." />
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8 text-center mb-6">
              <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-xl mb-2">
                {stats.count > 0 ? `${stats.rating} out of 5` : 'No ratings yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {stats.count > 0 ? `Based on ${stats.count} reviews` : 'Reviews appear here after completed orders.'}
              </p>
            </div>

            {reviews.length > 0 && (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={r.reviewerAvatar || '/images/avatar_default.jpg'}
                        alt={r.reviewerName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">{r.reviewerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(r.createdAt)}</p>
                      </div>
                      <Stars value={r.rating} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{r.comment}</p>
                    {r.reply && (
                      <div className="mt-3 ml-6 pl-4 border-l-2 border-violet-300 dark:border-violet-500">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Seller response</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{r.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">About {seller.name}</h3>
              <p className="text-gray-600 dark:text-gray-300">{seller.bio || 'No bio available.'}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
