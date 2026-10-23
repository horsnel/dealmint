import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import { formatPrice, priceSuffix } from '@/lib/format';
import { typeLabel } from '@/lib/categories';
import type { Listing } from '@/types';

export function ListingCard({ listing }: { listing: Listing }) {
  const { user, favourites, toggleFavourite, getListingStats } = useApp();
  const navigate = useNavigate();
  const isLiked = favourites.includes(listing.id);
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

  return (
    <div className="card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden group hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <Link to={`/listing/${listing.id}`}>
          <img
            src={listing.images[0] || '/images/placeholder.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <button
          onClick={handleLike}
          aria-label={isLiked ? 'Remove from favourites' : 'Save to favourites'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-violet-900/90 flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          />
        </button>
        {listing.isFeatured && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white">Featured</Badge>
        )}
        {!listing.isActive && (
          <Badge className="absolute top-3 left-3 bg-gray-700 text-white">Paused</Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <img
            src={listing.seller.avatar || '/images/avatar_default.jpg'}
            alt={listing.seller.name}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{listing.seller.name}</span>
          {listing.seller.isVerified && (
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
              Verified
            </Badge>
          )}
        </div>

        <Link to={`/listing/${listing.id}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-violet-600 dark:hover:text-amber-400 transition-colors">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats.count > 0 ? stats.rating : 'New'}
            </span>
          </div>
          {stats.count > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({stats.count} review{stats.count === 1 ? '' : 's'})
            </span>
          )}
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-700 text-violet-700 dark:text-violet-200">
            {typeLabel(listing.type)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-violet-600 dark:text-amber-400">
              {formatPrice(listing.price)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{priceSuffix(listing.priceType)}</span>
          </div>
          {(listing.location || listing.isRemote) && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              {listing.location || 'Remote'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
