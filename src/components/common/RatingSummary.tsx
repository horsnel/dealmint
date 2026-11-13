import type { Review } from '@/types';
import { StarRating } from '@/components/common/StarRating';

interface RatingSummaryProps {
  rating: number;
  count: number;
  /** Reviews used to build the per-star breakdown; omit to hide the bars */
  reviews?: Review[];
  className?: string;
}

/**
 * "4.8 — five stars — based on N reviews" headline next to the 5→1 star
 * breakdown bar chart, in one white card. The grid collapses to a single
 * column on mobile with the divider moving to a bottom border.
 */
export function RatingSummary({ rating, count, reviews, className = '' }: RatingSummaryProps) {
  // Per-star percentages from the actual review list. The top bucket absorbs
  // the rounding remainder so the bars always sum to ~100%.
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews ? reviews.filter((r) => Math.round(r.rating) === star).length : 0,
  }));
  const total = buckets.reduce((sum, b) => sum + b.n, 0);
  const pctOf = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
  const pcts = buckets.map((b) => pctOf(b.n));
  if (total > 0) {
    const drift = 100 - pcts.reduce((sum, p) => sum + p, 0);
    pcts[0] += drift;
  }

  return (
    <div
      className={`card-white dark:bg-violet-800 dark:border-violet-700 p-6 md:p-8 ${className}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Overall rating */}
        <div className={`flex flex-col items-center justify-center pb-6 md:pb-0 md:pr-8 ${total > 0 ? 'border-b md:border-b-0 md:border-r border-gray-100 dark:border-violet-700' : ''}`}>
          {count > 0 ? (
            <>
              <p className="font-display text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {rating.toFixed(1)}
              </p>
              <StarRating rating={rating} size="lg" valueOnly className="mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Based on {count} review{count === 1 ? '' : 's'}</p>
            </>
          ) : (
            <>
              <p className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">No ratings yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Ratings from completed orders will appear here.
              </p>
            </>
          )}
        </div>

        {/* Breakdown bars — only from real review objects; an aggregate
            count without itemised reviews shows the headline alone */}
        {total > 0 && (
          <div className="md:col-span-2 space-y-2">
            {buckets.map(({ star }, i) => (
              <div key={star} className="flex items-center text-sm">
                <span className="w-14 font-medium text-gray-600 dark:text-gray-300 shrink-0">{star} star</span>
                <div className="flex-grow h-3 mx-4 bg-gray-100 dark:bg-violet-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${pcts[i]}%` }}
                  />
                </div>
                <span className="w-10 text-right text-gray-500 dark:text-gray-400 shrink-0">{pcts[i]}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
