import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  /** sm = review rows & cards, md = default, lg = rating summary headline */
  size?: 'sm' | 'md' | 'lg';
  /** Hide the "4.8 (24 reviews)" text and show stars only */
  valueOnly?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const;

const TEXT_SIZES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
} as const;

/**
 * Five-star display with fractional fill (a 4.5 rating fills the fifth star
 * halfway via clip-path), gold for filled / light gray for empty, followed by
 * the numeric rating and review count.
 */
export function StarRating({
  rating,
  reviewCount,
  size = 'md',
  valueOnly = false,
  className = '',
}: StarRatingProps) {
  const starCls = SIZES[size];
  const clamped = Math.max(0, Math.min(5, rating));

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="flex items-center gap-0.5" aria-label={`Rated ${clamped.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, clamped - i));
          return (
            <span key={i} className="relative inline-flex">
              <Star className={`${starCls} text-gray-300 dark:text-violet-700`} strokeWidth={1.5} />
              {fill > 0 && (
                <Star
                  className={`${starCls} fill-yellow-400 text-yellow-400 absolute inset-0`}
                  style={
                    fill < 1
                      ? { clipPath: `polygon(0 0, ${fill * 100}% 0, ${fill * 100}% 100%, 0 100%)` }
                      : undefined
                  }
                />
              )}
            </span>
          );
        })}
      </span>
      {!valueOnly && (
        <span className={`${TEXT_SIZES[size]} text-gray-600 dark:text-gray-300`}>
          {reviewCount !== undefined && reviewCount > 0 ? (
            <>
              <span className="font-semibold text-gray-900 dark:text-white">{clamped.toFixed(1)}</span>{' '}
              ({reviewCount} review{reviewCount === 1 ? '' : 's'})
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">New</span>
          )}
        </span>
      )}
    </span>
  );
}
