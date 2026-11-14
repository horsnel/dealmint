import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Heart,
  Share2,
  MessageSquare,
  Shield,
  Calendar,
  Flag,
  Download,
  Pencil,
  Wallet,
  Search,
  Bell,
  Banknote,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { ListingCard } from '@/components/common/ListingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Stars, StarInput } from '@/components/common/Stars';
import { RatingSummary } from '@/components/common/RatingSummary';
import { ReviewTags, useReviewTags } from '@/components/common/ReviewTags';
import { UserBadgeRow } from '@/components/common/VerificationBadges';
import { WhatsAppButton } from '@/components/share/WhatsAppButton';
import { SharePopup } from '@/components/share/SharePopup';
import { PageClose } from '@/components/common/PageClose';
import { formatPrice, formatBytes, timeAgo, priceSuffix, formatDate } from '@/lib/format';
import { typeLabel } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';

const reportReasons = [
  'Misleading or false information',
  'Scam or suspicious behaviour',
  'Prohibited or illegal item',
  'Inappropriate content',
  'Spam or duplicate listing',
  'Other',
];

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // History-aware back: behaves like the browser back button, with a
  // sensible fallback when the page was opened directly (no history).
  const location = useLocation();
  const {
    user,
    listings,
    getListing,
    getListingStats,
    reviewsForListing,
    orders,
    addReview,
    createOrder,
    requireVerified,
    startConversation,
    favourites,
    toggleFavourite,
    recordView,
    reportListing,
    getSeller,
    getSellerResponsiveness,
    replyToReview,
    priceAlerts,
    addPriceAlert,
    removePriceAlert,
    safeSpots,
  } = useApp();

  const listing = getListing(id);
  usePageTitle(listing?.title);

  const [activeImage, setActiveImage] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [note, setNote] = useState('');
  const [offer, setOffer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [alertTarget, setAlertTarget] = useState('');
  const [meetupSpotId, setMeetupSpotId] = useState('none');
  const [timeline, setTimeline] = useState('');
  const reviewTags = useReviewTags();

  useEffect(() => {
    if (id) recordView(id);
    setActiveImage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={Search}
            title="Listing not found"
            description="This listing may have been removed or the link is incorrect."
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

  const stats = getListingStats(listing);
  const reviews = reviewsForListing(listing.id);
  const seller = getSeller(listing.seller.id) || listing.seller;
  const responsiveness = getSellerResponsiveness(seller.id);
  const isOwner = !!user && listing.seller.id === user.id;
  const isLiked = favourites.includes(listing.id);
  const isNegotiable = listing.priceType === 'negotiable' || listing.type === 'task';
  const isTask = listing.type === 'task';
  const isJob = listing.type === 'job';
  const isDigital = listing.type === 'digital';
  const ctaLabel = isJob ? 'Apply Now' : isTask ? 'Apply for Task' : isDigital ? 'Buy Now' : 'Book Now';

  // Live applicant count for tasks: offers currently open on this listing.
  const applicants = isTask
    ? orders.filter((o) => o.listingId === listing.id && ['pending', 'in_progress'].includes(o.status)).length
    : 0;

  // Hero chip tone per listing type (mock: purple Gig chip on the cover)
  const heroChipTone =
    isTask
      ? 'bg-orange-500 text-white'
      : isJob || listing.type === 'service'
        ? 'bg-blue-600 text-white'
        : 'bg-purple-600 text-white';

  const reviewableOrder = user
    ? orders.find((o) => o.listingId === listing.id && o.buyerId === user.id && o.status === 'completed' && !o.reviewed)
    : undefined;

  const related = listings
    .filter((l) => l.id !== listing.id && (l.category === listing.category || l.type === listing.type))
    .slice(0, 4);

  const requireLogin = () => {
    toast.info('Log in to continue', {
      action: { label: 'Log in', onClick: () => navigate('/login', { state: { from: location.pathname } }) },
    });
  };

  const handleBook = () => {
    if (!user) return requireLogin();
    // Hard gate: cloud accounts must confirm their email before ordering
    // (opens the VerifyGateModal with a resend). Local mode passes through.
    if (!requireVerified(isJob ? 'apply' : listing.type === 'task' ? 'make an offer' : 'place an order')) return;
    if (!user.phoneVerified) {
      toast.info('Verify your phone number first');
      navigate('/verify-phone', { state: { from: location.pathname } });
      return;
    }
    setOffer(String(listing.price));
    setMeetupSpotId('none');
    setCheckoutOpen(true);
  };

  const handleContact = () => {
    if (!user) return requireLogin();
    const convoId = startConversation(
      { id: seller.id, name: seller.name, avatar: seller.avatar },
      listing
    );
    if (convoId) navigate(`/dashboard/messages?c=${convoId}`);
  };

  const handleLike = () => {
    if (!user) return requireLogin();
    const added = toggleFavourite(listing.id);
    toast.success(added ? 'Saved to favourites' : 'Removed from favourites');
  };

  const offerAmount = isNegotiable ? Number(offer) : listing.price;
  const offerValid = Number.isFinite(offerAmount) && offerAmount >= 100;
  const balance = user?.walletBalance ?? 0;
  const shortfall = offerValid ? Math.max(0, offerAmount - balance) : 0;

  // Community Safe Spots near this listing, offered as in-person meetup points
  const meetupEligible = !isDigital;
  const citySpots = useMemo(
    () =>
      safeSpots.filter(
        (s) => s.isApproved && s.lat != null && (!listing.location || s.city === listing.location)
      ),
    [safeSpots, listing.location]
  );
  const selectedSpot = citySpots.find((s) => s.id === meetupSpotId);

  const handleCheckout = () => {
    if (!offerValid) {
      toast.error('Enter an amount of at least ₦100');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const meetup = selectedSpot
        ? {
            spotId: selectedSpot.id,
            name: selectedSpot.name,
            address: selectedSpot.address,
            city: selectedSpot.city,
            lat: selectedSpot.lat,
            lng: selectedSpot.lng,
          }
        : undefined;
      const result = createOrder(
        listing,
        [timeline ? `Needed: ${timeline}.` : '', note.trim()].filter(Boolean).join(' '),
        isNegotiable ? offerAmount : undefined,
        meetup
      );
      setSubmitting(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCheckoutOpen(false);
      setNote('');
      setTimeline('');
      setMeetupSpotId('none');
      toast.success(isDigital ? 'Purchase complete!' : isJob ? 'Application sent!' : 'Order placed! Your payment is held safely in escrow.');
      if (result.data) navigate(`/dashboard/orders/${result.data.id}`);
    }, 600);
  };

  const handleReport = () => {
    if (!reportReason) {
      toast.error('Choose a reason for your report');
      return;
    }
    reportListing(listing.id, reportReason, reportDetails.trim());
    setReportOpen(false);
    setReportReason('');
    setReportDetails('');
    toast.success('Thanks. Our team will review this listing.');
  };

  const handleReview = () => {
    if (!reviewableOrder) return;
    const text = reviewTags.fold(reviewComment).trim();
    if (text.length < 10) {
      toast.error('Please write at least 10 characters');
      return;
    }
    const res = addReview(reviewableOrder.id, reviewRating, text);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setReviewComment('');
    setReviewRating(5);
    reviewTags.reset();
    toast.success('Thanks for your review!');
  };

  // Price alert (Postall-style deals): notify me when the price drops to my target
  const myAlert = user ? priceAlerts.find((a) => a.listingId === listing.id) : undefined;

  const handlePriceAlert = () => {
    if (!user) return requireLogin();
    const res = addPriceAlert(listing, Number(alertTarget));
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAlertTarget('');
    toast.success(`We will watch this listing and alert you at your target price.`);
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-32">
        <PageClose fallback="/browse" />
        {!listing.isActive && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200 text-sm">
            {isOwner
              ? 'This listing is paused, so only you can see it. Activate it from My Listings to make it public again.'
              : 'This listing is currently unavailable.'}
          </div>
        )}

        <div className="space-y-6">
            {isTask ? (
              <>
                {/* Task header — badges, title, posted-ago (no cover image) */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      Task
                    </span>
                    {listing.isActive && (
                      <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                        <span aria-hidden="true" className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Open
                      </span>
                    )}
                    {listing.isUrgent && <Badge className="bg-red-500 text-white">Urgent</Badge>}
                    {listing.isFeatured && <Badge className="bg-amber-500 text-white">Featured</Badge>}
                  </div>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                    {listing.title}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    <Clock className="w-4 h-4 shrink-0" />
                    Posted {timeAgo(listing.createdAt)}
                    {!listing.isRemote && listing.location && (
                      <>
                        ·<MapPin className="w-4 h-4 shrink-0" />
                        {listing.location}
                      </>
                    )}
                    {listing.isRemote && '· Remote ok'}
                  </p>
                </div>

                {/* Key details grid — budget / location / deadline / applicants */}
                <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 grid grid-cols-2 gap-y-5 gap-x-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" /> Budget
                    </p>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                      {formatPrice(listing.price)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        {priceSuffix(listing.priceType) || ' fixed'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Location
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {listing.isRemote ? 'Remote' : listing.location || 'Lagos'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Needed by
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {listing.deadline ? formatDate(listing.deadline) : 'Flexible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Applicants
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {applicants === 0 ? 'Be the first' : `${applicants} applied`}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={listing.images[activeImage] || '/images/placeholder.jpg'}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-md shadow-sm ${heroChipTone}`}
                  >
                    {typeLabel(listing.type)}
                  </span>
                </div>
                {listing.images.length > 1 && (
                  <div className="flex gap-2 p-4">
                    {listing.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        aria-label={`Show image ${idx + 1}`}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          activeImage === idx ? 'border-violet-600' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt={`${listing.title} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Poster / seller strip (mock: "About the Poster" card / gig seller row) */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
              {isTask && (
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">About the Poster</h3>
              )}
              <div className="flex items-center justify-between gap-3">
                <Link to={`/seller/${seller.id}`} className="flex items-center gap-3 min-w-0">
                  <img
                    src={seller.avatar || '/images/placeholder.jpg'}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-violet-700 shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{seller.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {typeof seller.rating === 'number' ? seller.rating.toFixed(1) : 'New'}
                      </span>
                      {typeof seller.reviewCount === 'number' && ` (${seller.reviewCount} reviews)`}
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/seller/${seller.id}`}
                  className="shrink-0 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:underline"
                >
                  View Profile
                </Link>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-violet-700 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <UserBadgeRow
                  showLabel
                  isVerified={seller.isVerified}
                  idVerified={seller.idVerified}
                  rating={seller.rating}
                  reviewCount={seller.reviewCount}
                  responsivenessLabel={responsiveness?.label}
                />
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {listing.completedOrders} orders completed
                </span>
                {listing.deliveryTime && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Delivery: {listing.deliveryTime}
                  </span>
                )}
                {responsiveness && (
                  <span>
                    Usually {responsiveness.label.toLowerCase()}
                    {responsiveness.lastActive && ` · Active ${timeAgo(responsiveness.lastActive)}`}
                  </span>
                )}
                {isOwner && <span>{listing.views || 0} views · This is your listing</span>}
              </div>
            </div>

            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
              <Tabs defaultValue="description">
                <TabsList className="mb-6 dark:bg-violet-700">
                  <TabsTrigger value="description" className="dark:data-[state=active]:bg-violet-600">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="about" className="dark:data-[state=active]:bg-violet-600">
                    About Seller
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="dark:data-[state=active]:bg-violet-600">
                    Reviews ({stats.count})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4">
                  <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                    About this {typeLabel(listing.type).toLowerCase()}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>

                  {listing.requirements && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {listing.requirements}
                      </p>
                    </div>
                  )}

                  {isDigital && listing.fileName && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-700/50">
                      <Download className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{listing.fileName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {listing.fileSize ? formatBytes(listing.fileSize) : 'Digital file'}
                          {listing.fileType ? ` · ${listing.fileType}` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4">
                    {listing.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="dark:bg-violet-700 dark:text-gray-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="about" className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={seller.avatar || '/images/avatar_default.jpg'}
                      alt={seller.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{seller.name}</h3>
                      <UserBadgeRow
                        isVerified={seller.isVerified}
                        idVerified={seller.idVerified}
                        rating={seller.rating}
                        reviewCount={seller.reviewCount}
                        responsivenessLabel={responsiveness?.label}
                        className="mt-1"
                      />
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-gray-900 dark:text-white">
                          {seller.reviewCount > 0 ? seller.rating : 'New'}
                        </span>
                        {seller.reviewCount > 0 && (
                          <span className="text-gray-500 dark:text-gray-400">({seller.reviewCount} reviews)</span>
                        )}
                      </div>
                      {responsiveness && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Usually {responsiveness.label.toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>

                  {seller.bio && <p className="text-gray-600 dark:text-gray-300">{seller.bio}</p>}

                  <div className="flex flex-wrap gap-2">
                    {seller.skills?.map((skill) => (
                      <Badge key={skill} variant="outline" className="dark:border-violet-600 dark:text-gray-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Link to={`/seller/${seller.id}`}>
                    <Button variant="outline" className="mt-4 dark:border-violet-600 dark:text-white">
                      View Profile
                    </Button>
                  </Link>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6">
                  <RatingSummary rating={stats.rating} count={stats.count} reviews={reviews} />

                  {reviewableOrder && (
                    <div className="rounded-xl border border-violet-200 dark:border-violet-600 p-4 space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Rate your order</h4>
                      <StarInput value={reviewRating} onChange={setReviewRating} />
                      <ReviewTags selected={reviewTags.tags} onToggle={reviewTags.toggle} />
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="How was your experience?"
                        rows={3}
                        className="dark:bg-violet-700 dark:border-violet-600"
                      />
                      <Button onClick={handleReview} className="bg-violet-600 hover:bg-violet-700">
                        Submit review
                      </Button>
                    </div>
                  )}

                  {reviews.length > 0 && (
                    <div className="space-y-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="border-t dark:border-violet-700 pt-4">
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
                          {isOwner && !r.reply && (
                            <div className="mt-3 flex gap-2">
                              <Input
                                value={replyText[r.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })}
                                placeholder="Reply publicly"
                                className="dark:bg-violet-700 dark:border-violet-600"
                              />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (!replyText[r.id]?.trim()) return;
                                  replyToReview(r.id, replyText[r.id]);
                                  toast.success('Reply posted');
                                }}
                                className="dark:border-violet-600 dark:text-white"
                              >
                                Reply
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

          {/* Save / share / report + price alert (relocated from the old booking card) */}
          <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 space-y-4">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2.5">
              <button
                onClick={handleLike}
                className="flex items-center justify-center gap-1.5 h-10 rounded-full border border-gray-200 dark:border-violet-600 text-sm text-gray-600 dark:text-gray-300 hover:text-violet-700 hover:border-violet-300 hover:bg-violet-50 dark:hover:text-amber-400 dark:hover:border-violet-500 dark:hover:bg-violet-700/40 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isLiked ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="flex items-center justify-center gap-1.5 h-10 rounded-full border border-gray-200 dark:border-violet-600 text-sm text-gray-600 dark:text-gray-300 hover:text-violet-700 hover:border-violet-300 hover:bg-violet-50 dark:hover:text-amber-400 dark:hover:border-violet-500 dark:hover:bg-violet-700/40 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <WhatsAppButton title={listing.title} price={formatPrice(listing.price)} />
            </div>

            {!isOwner && (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="w-4 h-4 shrink-0 text-green-500" />
                  <span>Protected payments, held safely in escrow</span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-violet-600 dark:text-amber-400" />
                    Price alert
                  </p>
                  {myAlert ? (
                    <div className="mt-2 flex items-center justify-between gap-2 text-sm min-w-0">
                      <span className="text-gray-600 dark:text-gray-300 truncate">
                        Watching for {formatPrice(myAlert.targetPrice)}
                        {myAlert.triggered ? ' · triggered' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          removePriceAlert(myAlert.id);
                          toast.success('Price alert removed');
                        }}
                        className="shrink-0 text-xs text-red-500 hover:underline py-2 -my-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePriceAlert();
                      }}
                      className="mt-3 flex gap-2"
                    >
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="100"
                        value={alertTarget}
                        onChange={(e) => setAlertTarget(e.target.value)}
                        placeholder="Your target price"
                        aria-label="Alert me at this price"
                        className="flex-1 min-w-0 dark:bg-violet-700 dark:border-violet-600"
                      />
                      <Button type="submit" variant="outline" className="shrink-0 dark:border-violet-600 dark:text-white">
                        <Bell className="w-4 h-4" />
                        <span className="sr-only">Set price alert</span>
                      </Button>
                    </form>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                    Get notified the moment the seller drops the price to your target.
                  </p>
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => (user ? setReportOpen(true) : requireLogin())}
                    className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report this listing
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Sticky action bar (mock: fixed bottom CTA, all widths) */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-violet-900 border-t border-gray-200 dark:border-violet-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            {isOwner ? (
              <Link to={`/dashboard/listings/${listing.id}/edit`} className="flex-grow">
                <Button className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Listing
                </Button>
              </Link>
            ) : (
              <>
                {isTask ? (
                  <div className="shrink-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">Total Pay</p>
                    <p className="font-bold text-xl text-gray-900 dark:text-white mt-1">
                      {formatPrice(listing.price)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleContact}
                    aria-label="Contact seller"
                    className="shrink-0 p-3.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 dark:bg-violet-800 dark:border-violet-600 dark:text-amber-400 hover:bg-violet-100 transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
                <Button
                  onClick={handleBook}
                  disabled={!listing.isActive}
                  className="flex-grow rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                >
                  {ctaLabel}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {isJob ? 'Apply for this job' : isTask ? 'Apply for this task' : 'Confirm your order'}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Your payment is held in escrow and only released to the seller when you confirm the work.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-800">
              <img
                src={listing.images[0] || '/images/placeholder.jpg'}
                alt=""
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white line-clamp-2">{listing.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">by {seller.name}</p>
              </div>
            </div>

            {isNegotiable && (
              <div>
                <Label className="dark:text-gray-200">
                  Your offer (₦) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="100"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="mt-1 dark:bg-violet-700 dark:border-violet-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Listed at {formatPrice(listing.price)}{priceSuffix(listing.priceType)}
                </p>
              </div>
            )}

            {isTask && (
              <div>
                <Label className="dark:text-gray-200">When do you need it done?</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['ASAP', 'Today', 'This week'].map((t) => {
                    const active = timeline === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setTimeline(active ? '' : t)}
                        className={`rounded-xl py-2.5 text-sm font-medium border transition-colors ${
                          active
                            ? 'border-2 border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                            : 'border border-gray-200 bg-white text-gray-600 hover:border-amber-400 dark:bg-violet-700 dark:border-violet-600 dark:text-gray-300 dark:hover:border-amber-400/60'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Added to your message so the doer can plan around it.
                </p>
              </div>
            )}

            <div>
              <Label className="dark:text-gray-200">
                {isJob ? 'Cover note' : 'Message to seller'} (optional)
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={isJob ? 'Tell them why you are a great fit' : 'Share any details that will help them get started'}
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
            </div>

            {meetupEligible && (
              <div>
                <Label className="dark:text-gray-200">Meetup point (optional)</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                  Suggest a community Safe Spot to meet in person: busy, public and well-lit.
                </p>
                <Select value={meetupSpotId} onValueChange={setMeetupSpotId}>
                  <SelectTrigger className="dark:bg-violet-700 dark:border-violet-600">
                    <SelectValue placeholder="Choose a Safe Spot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No in-person meetup needed</SelectItem>
                    {citySpots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}, {s.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {citySpots.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    No Safe Spots pinned here yet. 
                    <Link to="/safe-spots" className="text-violet-600 dark:text-amber-400 underline underline-offset-2">
                      suggest one
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}

            <div className="rounded-xl border dark:border-violet-700 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatPrice(offerValid ? offerAmount : listing.price)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Wallet balance
                </span>
                <span className="font-medium text-gray-900 dark:text-white">{formatPrice(balance)}</span>
              </div>
              {shortfall > 0 && (
                <p className="text-red-600 dark:text-red-400">
                  You need {formatPrice(shortfall)} more to place this order.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              className="rounded-full dark:border-violet-600 dark:text-white"
            >
              Cancel
            </Button>
            {shortfall > 0 ? (
              <Button
                onClick={() => navigate('/dashboard/wallet')}
                className="rounded-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                Add funds
              </Button>
            ) : (
              <Button
                onClick={handleCheckout}
                disabled={submitting || !offerValid}
                className="rounded-full bg-violet-600 hover:bg-violet-700"
              >
                {submitting ? 'Processing...' : `Pay ${offerValid ? formatPrice(offerAmount) : ''}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Report this listing</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Tell us what is wrong and our safety team will take a look.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-1 dark:bg-violet-700 dark:border-violet-600">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-200">Details (optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={4}
                maxLength={500}
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setReportOpen(false)}
              className="dark:border-violet-600 dark:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleReport} className="bg-violet-600 hover:bg-violet-700">
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share sheet: branded target picker (WhatsApp / Email / Messages / Facebook / Telegram) */}
      <SharePopup
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={listing.title}
        price={formatPrice(listing.price)}
      />
    </div>
  );
}
