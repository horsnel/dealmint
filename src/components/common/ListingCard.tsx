import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Heart, MapPin, Eye, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { formatPrice, priceSuffix, timeAgo } from '@/lib/format';
import { typeLabel } from '@/lib/categories';
import { digitalCover } from '@/lib/digitalCovers';
import { DigitalPreviewOverlay } from '@/components/digital/DigitalPreviewOverlay';
import { StarRating } from '@/components/common/StarRating';
import type { Listing } from '@/types';

/**
 * One listing card, three looks — the visual shorthand that lets a buyer
 * tell a packaged Gig, a professional Job/Service post and a quick local
 * Task apart at a glance:
 *  - gig / digital → image-top card, purple badge, gold stars, price footer
 *  - job / service → poster-first card, blue badge, budget + Apply
 *  - task          → orange accent strip, location pin, price + Accept
 */
export function ListingCard({ listing }: { listing: Listing }) {
  const { user, favourites, toggleFavourite, getListingStats } = useApp();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const isLiked = favourites.includes(listing.id);
  const isDigital = listing.type === 'digital';
  const isTask = listing.type === 'task';
  const isProfessional = listing.type === 'job' || listing.type === 'service';
  const stats = getListingStats(listing);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Log in to save listings', {
        action: { label: 'Log in', onClick: () => navigate('/login') },
      });
      return;
    }
    const added = toggleFavourite(listing.id);
    toast.success(added ? 'Saved to favourites' : 'Removed from favourites');
  };

  const HeartButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={handleLike}
      aria-label={isLiked ? 'Remove from favourites' : 'Save to favourites'}
      className={className}
    >
      <Heart
        className={`w-4 h-4 ${
          isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
        }`}
      />
    </button>
  );

  const TypeBadge = () => (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md ${
        isTask
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300'
          : isProfessional
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
      }`}
    >
      {typeLabel(listing.type)}
    </span>
  );

  const statusChips = (
    <>
      {listing.isFeatured && <Badge className="bg-amber-500 text-white">Featured</Badge>}
      {listing.isUrgent && <Badge className="bg-red-500 text-white">Urgent</Badge>}
      {!listing.isActive && <Badge className="bg-gray-700 text-white">Paused</Badge>}
    </>
  );

  const TitleLink = ({ className = '' }: { className?: string }) => (
    <Link to={`/listing/${listing.id}`} className={`inline-block ${className}`}>
      <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2 hover:text-violet-600 dark:hover:text-amber-400 transition-colors">
        {listing.title}
      </h3>
    </Link>
  );

  /* ---------- Style 2 — Job / Service: poster first, budget + Apply ---------- */
  if (isProfessional) {
    return (
      <div className="card-white dark:bg-violet-800 dark:border-violet-700 card-tactile p-5 flex flex-col relative group">
        <div className="absolute top-3 right-3 z-10">
          <HeartButton className="w-8 h-8 rounded-full bg-white/90 dark:bg-violet-900/90 border border-gray-100 dark:border-violet-700 flex items-center justify-center hover:bg-white transition-colors" />
        </div>
        <div className="flex items-center gap-3 mb-4 pr-10">
          <img
            src={listing.seller.avatar || '/images/avatar_default.jpg'}
            alt={listing.seller.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {listing.seller.name}
              {listing.seller.isVerified && (
                <span className="ml-1.5 align-middle text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-700 dark:text-violet-200">
                  Verified
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Posted {timeAgo(listing.createdAt)}</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <TypeBadge />
          {statusChips}
        </div>

        <TitleLink className="mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
          {listing.description}
        </p>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-violet-700">
          <span className="font-bold text-blue-600 dark:text-blue-300">
            Budget: {formatPrice(listing.price)}
          </span>
          <Link
            to={`/listing/${listing.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Apply
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Style 3 — Task: accent strip, pin, price + Accept ---------- */
  if (isTask) {
    return (
      <div className="card-white dark:bg-violet-800 dark:border-violet-700 card-tactile p-5 relative overflow-hidden flex flex-col group">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" aria-hidden="true" />
        <div className="absolute top-3 right-3 z-10">
          <HeartButton className="w-8 h-8 rounded-full bg-white/90 dark:bg-violet-900/90 border border-gray-100 dark:border-violet-700 flex items-center justify-center hover:bg-white transition-colors" />
        </div>

        <div className="pl-3 pr-10 mb-3 flex justify-between items-start gap-2 flex-wrap">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
            Task
          </span>
          <StarRating rating={stats.rating} reviewCount={stats.count} size="sm" />
        </div>
        <div className="pl-3 flex flex-wrap items-center gap-1.5 mb-2">
          {statusChips}
        </div>

        <div className="pl-3 flex-grow">
          <TitleLink className="mb-1.5" />
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <MapPin className="w-4 h-4 shrink-0" />
            {listing.isRemote ? 'Remote' : listing.location || 'Lagos'}
          </div>
        </div>

        <div className="pl-3 flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-violet-700">
          <span className="font-bold text-gray-900 dark:text-white text-lg">
            {formatPrice(listing.price)}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {priceSuffix(listing.priceType)}
            </span>
          </span>
          <Link
            to={`/listing/${listing.id}`}
            className="bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-500/25 border border-orange-200 dark:border-orange-500/30 transition-colors"
          >
            Accept
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Style 1 — Gig / Digital: image top, purple badge ---------- */
  return (
    <div className="card-white dark:bg-violet-800 dark:border-violet-700 card-tactile overflow-hidden group flex flex-col">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <Link to={`/listing/${listing.id}`}>
          <img
            src={digitalCover(listing)}
            alt={listing.title}
            className="w-full h-full object-cover img-grade group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <HeartButton className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-violet-900/90 flex items-center justify-center hover:bg-white transition-colors" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
          {statusChips}
          {isDigital && listing.isActive && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tag-frosted">
              Instant download
            </span>
          )}
        </div>
        {isDigital && listing.isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setPreviewOpen(true);
            }}
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tag-frosted hover:bg-white/30 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
            {isDigital ? 'Digital' : 'Gig'}
          </span>
          <StarRating rating={stats.rating} reviewCount={stats.count} size="sm" />
        </div>

        <TitleLink className="mb-1" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-grow">
          {isDigital
            ? listing.seller.isVerified
              ? 'Instant download · verified seller'
              : 'Instant download'
            : priceSuffix(listing.priceType) === '/hr'
              ? 'Hourly rate'
              : listing.priceType === 'negotiable'
                ? 'Negotiable'
                : 'Standard package'}
        </p>

        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100 dark:border-violet-700">
          <span className="font-bold text-gray-900 dark:text-white">
            {formatPrice(listing.price)}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {priceSuffix(listing.priceType)}
            </span>
          </span>
          <Link
            to={`/listing/${listing.id}`}
            aria-label={`View ${listing.title}`}
            className="bg-gray-100 dark:bg-violet-700 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-violet-600 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-200" />
          </Link>
        </div>
      </div>

      <DigitalPreviewOverlay
        listing={listing}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
