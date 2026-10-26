import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  MapPin,
  Clock,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle,
  Shield,
  Calendar,
  ArrowLeft,
  Flag,
  Download,
  Pencil,
  Wallet,
  Search,
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
import { formatPrice, formatBytes, timeAgo, priceSuffix } from '@/lib/format';
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
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/browse');
  };
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
    startConversation,
    favourites,
    toggleFavourite,
    recordView,
    reportListing,
    getSeller,
    getSellerResponsiveness,
    replyToReview,
  } = useApp();

  const listing = getListing(id);
  usePageTitle(listing?.title);

  const [activeImage, setActiveImage] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [note, setNote] = useState('');
  const [offer, setOffer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});

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
  const isJob = listing.type === 'job';
  const isDigital = listing.type === 'digital';
  const ctaLabel = isJob ? 'Apply Now' : listing.type === 'task' ? 'Make an Offer' : isDigital ? 'Buy Now' : 'Book Now';

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
    if (!user.phoneVerified) {
      toast.info('Verify your phone number first');
      navigate('/verify-phone', { state: { from: location.pathname } });
      return;
    }
    setOffer(String(listing.price));
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

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
        return;
      }
    } catch {
      // user dismissed the share sheet, fall back to copying
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy the link. Copy it from the address bar instead.');
    }
  };

  const offerAmount = isNegotiable ? Number(offer) : listing.price;
  const offerValid = Number.isFinite(offerAmount) && offerAmount >= 100;
  const balance = user?.walletBalance ?? 0;
  const shortfall = offerValid ? Math.max(0, offerAmount - balance) : 0;

  const handleCheckout = () => {
    if (!offerValid) {
      toast.error('Enter an amount of at least ₦100');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const result = createOrder(listing, note, isNegotiable ? offerAmount : undefined);
      setSubmitting(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCheckoutOpen(false);
      setNote('');
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
    if (reviewComment.trim().length < 10) {
      toast.error('Please write at least 10 characters');
      return;
    }
    const res = addReview(reviewableOrder.id, reviewRating, reviewComment);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setReviewComment('');
    setReviewRating(5);
    toast.success('Thanks for your review!');
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!listing.isActive && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200 text-sm">
            {isOwner
              ? 'This listing is paused, so only you can see it. Activate it from My Listings to make it public again.'
              : 'This listing is currently unavailable.'}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={listing.images[activeImage] || '/images/placeholder.jpg'}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
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
                  <div className="text-center py-4">
                    <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {stats.count > 0 ? `${stats.rating} out of 5` : 'No ratings yet'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {stats.count > 0 ? `Based on ${stats.count} reviews` : 'Be the first to leave a review after your order.'}
                    </p>
                  </div>

                  {reviewableOrder && (
                    <div className="rounded-xl border border-violet-200 dark:border-violet-600 p-4 space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Rate your order</h4>
                      <StarInput value={reviewRating} onChange={setReviewRating} />
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
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 sticky top-24">
              <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-4">
                {listing.title}
              </h1>

              <div className="mb-6">
                <span className="text-3xl font-bold text-violet-600 dark:text-amber-400">
                  {formatPrice(listing.price)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {listing.priceType === 'hourly' ? '/hour' : listing.priceType === 'negotiable' ? ' (negotiable)' : '/fixed'}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Clock className="w-5 h-5" />
                  <span>{listing.completedOrders} orders completed</span>
                </div>
                {(listing.location || listing.isRemote) && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-5 h-5" />
                    <span>{listing.location || 'Remote'}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {listing.deliveryTime ? `Delivery: ${listing.deliveryTime}` : listing.deadline ? `Needed by ${listing.deadline}` : responsiveness ? `Usually ${responsiveness.label.toLowerCase()}` : 'Flexible schedule'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {isOwner ? (
                  <>
                    <Link to={`/dashboard/listings/${listing.id}/edit`} className="block">
                      <Button className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Listing
                      </Button>
                    </Link>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      {listing.views || 0} views · This is your listing
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleBook}
                      disabled={!listing.isActive}
                      className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {ctaLabel}
                    </Button>
                    <Button
                      onClick={handleContact}
                      variant="outline"
                      className="w-full rounded-full dark:border-violet-600 dark:text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Seller
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  onClick={goBack}
                  className="w-full rounded-full text-gray-600 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-white"
                >
                  <ArrowLeft className="size-6 mr-1" strokeWidth={2} />
                  Go back
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t dark:border-violet-700 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Protected payments</span>
                </div>
                {seller.isVerified && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Verified seller</span>
                  </div>
                )}
                {responsiveness && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 text-violet-500 dark:text-amber-400" />
                    <span>
                      Usually {responsiveness.label.toLowerCase()}
                      {responsiveness.lastActive && (
                        <span className="text-gray-400 dark:text-gray-500"> · Active {timeAgo(responsiveness.lastActive)}</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-amber-400"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-sm">{isLiked ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-amber-400"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
                {!isOwner && (
                  <button
                    onClick={() => (user ? setReportOpen(true) : requireLogin())}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600"
                  >
                    <Flag className="w-5 h-5" />
                    <span className="text-sm">Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">
              You might also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {isJob ? 'Apply for this job' : listing.type === 'task' ? 'Make an offer' : 'Confirm your order'}
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

            <div className="rounded-xl border dark:border-violet-700 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Amount</span>
                <span className="font-medium text-gray-900 dark:text-white">{offerValid ? formatPrice(offerAmount) : '—'}</span>
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
    </div>
  );
}
