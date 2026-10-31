import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  Play,
  Pause,
  Trash2,
  Search,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatPrice } from '@/lib/format';
import { savedSearchLabel } from '@/lib/search';
import { usePageTitle } from '@/hooks/usePageTitle';

export function SavedSearchesPage() {
  usePageTitle('Saved Searches');
  const navigate = useNavigate();
  const {
    user,
    savedSearches,
    matchesForSavedSearch,
    removeSavedSearch,
    toggleSavedSearchActive,
    runSavedSearch,
    priceAlerts,
    removePriceAlert,
    listings,
  } = useApp();

  // Resolve baselines the first time a saved search is seen
  const rows = useMemo(
    () =>
      savedSearches.map((s) => {
        const matches = matchesForSavedSearch(s);
        const baseline = s.baseline < 0 ? matches : s.baseline;
        return { ...s, matches, newMatches: s.active ? Math.max(0, matches - baseline) : 0 };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedSearches, listings, user?.id]
  );

  const searchUrl = (s: (typeof rows)[number]) => {
    const p = new URLSearchParams();
    if (s.query) p.set('q', s.query);
    if (s.type !== 'all') p.set('type', s.type);
    if (s.category !== 'all') p.set('category', s.category);
    if (s.where !== 'all') p.set('where', s.where);
    if (s.price !== 'all') p.set('price', s.price);
    return `/browse?${p.toString()}`;
  };

  const handleRun = (s: (typeof rows)[number]) => {
    runSavedSearch(s.id);
    navigate(searchUrl(s));
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-2">
          Saved Searches &amp; Alerts
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          We watch the marketplace for you and flag new matches and price drops.
        </p>

        {/* Saved searches */}
        <section className="mb-12">
          <h2 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-violet-600 dark:text-amber-400" />
            Saved searches
          </h2>
          {rows.length === 0 ? (
            <div className="card-white dark:bg-violet-800 dark:border-violet-700">
              <EmptyState
                icon={Search}
                title="No saved searches yet"
                description="Save any search from the Browse page and we will keep an eye on new listings for you."
                action={
                  <Link to="/browse">
                    <Button className="bg-violet-600 hover:bg-violet-700">Browse listings</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((s) => (
                <div
                  key={s.id}
                  className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white truncate max-w-full">
                        {savedSearchLabel(s)}
                      </p>
                      {s.newMatches > 0 && s.active && (
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-violet-600 text-white text-[11px] font-semibold flex items-center justify-center">
                          {s.newMatches} new
                        </span>
                      )}
                      {!s.active && (
                        <span className="shrink-0 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-violet-700/40 rounded-full px-2 py-0.5">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {s.matches} current match{s.matches === 1 ? '' : 'es'} · {s.frequency} alerts · saved {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleRun(s)}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Run
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={s.active ? `Pause ${s.label}` : `Resume ${s.label}`}
                      onClick={() => toggleSavedSearchActive(s.id)}
                      className="dark:border-violet-600 dark:text-white"
                    >
                      {s.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${s.label}`}
                      onClick={() => {
                        removeSavedSearch(s.id);
                        toast.success('Saved search removed');
                      }}
                      className="text-gray-400 hover:text-red-500 hover:bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Price alerts */}
        <section>
          <h2 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-600 dark:text-amber-400" />
            Price alerts
          </h2>
          {priceAlerts.length === 0 ? (
            <div className="card-white dark:bg-violet-800 dark:border-violet-700">
              <EmptyState
                icon={Tag}
                title="No price alerts yet"
                description="Open any listing and set a target price — we will ping you the moment the seller drops to it."
                action={
                  <Link to="/browse">
                    <Button className="bg-violet-600 hover:bg-violet-700">Find something to watch</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {priceAlerts.map((a) => {
                const live = listings.find((l) => l.id === a.listingId);
                const current = live?.price ?? a.startPrice;
                return (
                  <div
                    key={a.id}
                    className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 flex flex-wrap items-center gap-3"
                  >
                    {live && (
                      <img
                        src={live.images[0] || '/images/placeholder.jpg'}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-[180px]">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{a.listingTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Now {formatPrice(current)} · watching for {formatPrice(a.targetPrice)} · started at {formatPrice(a.startPrice)}
                      </p>
                    </div>
                    {a.triggered ? (
                      <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-full px-2.5 py-1">
                        <Bell className="w-3 h-3" />
                        Target reached
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-700 dark:text-violet-100 bg-violet-100 dark:bg-violet-700/60 rounded-full px-2.5 py-1">
                        Watching
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={`/listing/${a.listingId}`}>
                        <Button size="sm" variant="outline" className="dark:border-violet-600 dark:text-white">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Remove alert for ${a.listingTitle}`}
                        onClick={() => {
                          removePriceAlert(a.id);
                          toast.success('Price alert removed');
                        }}
                        className="text-gray-400 hover:text-red-500 hover:bg-transparent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
