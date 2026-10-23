import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Briefcase, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { categories } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { ListingCard } from '@/components/common/ListingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { matchesCategory, slugify } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Listing } from '@/types';

const PAGE_SIZE = 12;

const priceRanges: Record<string, [number, number]> = {
  under_5k: [0, 5000],
  '5k_20k': [5000, 20000],
  '20k_50k': [20000, 50000],
  over_50k: [50000, Infinity],
};

function sortListings(list: Listing[], sortBy: string, rate: (l: Listing) => number) {
  const copy = [...list];
  switch (sortBy) {
    case 'newest':
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'price_low':
      return copy.sort((a, b) => a.price - b.price);
    case 'price_high':
      return copy.sort((a, b) => b.price - a.price);
    case 'rating':
      return copy.sort((a, b) => rate(b) - rate(a));
    default:
      return copy.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) || b.completedOrders - a.completedOrders
      );
  }
}

export function BrowsePage() {
  usePageTitle('Browse');
  const { listings, getListingStats } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const sortBy = searchParams.get('sort') || 'recommended';
  const priceRange = searchParams.get('price') || 'all';
  const where = searchParams.get('where') || 'all';
  const minRating = searchParams.get('rating') || 'all';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const setParam = (key: string, value: string, defaultValue = 'all') => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const locations = useMemo(
    () =>
      Array.from(
        new Set(listings.map((l) => l.location).filter((x): x is string => !!x && x !== 'Remote'))
      ).sort(),
    [listings]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const result = listings.filter((l) => {
      const matchesSearch =
        !term ||
        l.title.toLowerCase().includes(term) ||
        l.description.toLowerCase().includes(term) ||
        l.category.toLowerCase().includes(term) ||
        l.tags.some((t) => t.toLowerCase().includes(term));
      if (!matchesSearch) return false;
      if (!matchesCategory(l, category)) return false;
      if (priceRange !== 'all') {
        const [min, max] = priceRanges[priceRange] || [0, Infinity];
        if (l.price < min || l.price >= max) return false;
      }
      if (where === 'remote' && !l.isRemote) return false;
      if (where !== 'all' && where !== 'remote' && l.location !== where) return false;
      if (minRating !== 'all') {
        const s = getListingStats(l);
        if (s.count === 0 || s.rating < Number(minRating)) return false;
      }
      return true;
    });
    return sortListings(result, sortBy, (l) => getListingStats(l).rating);
  }, [listings, q, category, priceRange, where, minRating, sortBy, getListingStats]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const categoryName =
    categories.find((c) => c.slug === category || slugify(c.name) === category)?.name ||
    (category !== 'all' ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');

  const activeFilterCount =
    Number(category !== 'all') +
    Number(priceRange !== 'all') +
    Number(where !== 'all') +
    Number(minRating !== 'all') +
    Number(!!q);

  const clearAll = () => setSearchParams(new URLSearchParams(), { replace: true });

  const FilterSelects = ({ stacked }: { stacked?: boolean }) => (
    <div className={stacked ? 'space-y-6' : 'flex flex-col lg:flex-row gap-4'}>
      <div className={stacked ? '' : 'w-full lg:w-44'}>
        {stacked && <label className="text-sm font-medium dark:text-white mb-2 block">Category</label>}
        <Select value={category} onValueChange={(v) => setParam('category', v)}>
          <SelectTrigger className="w-full dark:bg-violet-800 dark:border-violet-700">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={stacked ? '' : 'w-full lg:w-44'}>
        {stacked && <label className="text-sm font-medium dark:text-white mb-2 block">Price Range</label>}
        <Select value={priceRange} onValueChange={(v) => setParam('price', v)}>
          <SelectTrigger className="w-full dark:bg-violet-800 dark:border-violet-700">
            <SelectValue placeholder="Price range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="under_5k">Under ₦5,000</SelectItem>
            <SelectItem value="5k_20k">₦5,000 - ₦20,000</SelectItem>
            <SelectItem value="20k_50k">₦20,000 - ₦50,000</SelectItem>
            <SelectItem value="over_50k">Over ₦50,000</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className={stacked ? '' : 'w-full lg:w-44'}>
        {stacked && <label className="text-sm font-medium dark:text-white mb-2 block">Location</label>}
        <Select value={where} onValueChange={(v) => setParam('where', v)}>
          <SelectTrigger className="w-full dark:bg-violet-800 dark:border-violet-700">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anywhere</SelectItem>
            <SelectItem value="remote">Remote only</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={stacked ? '' : 'w-full lg:w-40'}>
        {stacked && <label className="text-sm font-medium dark:text-white mb-2 block">Minimum Rating</label>}
        <Select value={minRating} onValueChange={(v) => setParam('rating', v)}>
          <SelectTrigger className="w-full dark:bg-violet-800 dark:border-violet-700">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any rating</SelectItem>
            <SelectItem value="4">4.0 and up</SelectItem>
            <SelectItem value="4.5">4.5 and up</SelectItem>
            <SelectItem value="4.8">4.8 and up</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-gray-900 dark:text-white mb-2">
            Browse Listings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find the perfect gig, task, or service for your needs
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-violet-900 rounded-2xl p-4 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search listings..."
                value={q}
                onChange={(e) => setParam('q', e.target.value, '')}
                aria-label="Search listings"
                className="pl-10 dark:bg-violet-800 dark:border-violet-700"
              />
            </div>

            <Select value={sortBy} onValueChange={(v) => setParam('sort', v, 'recommended')}>
              <SelectTrigger className="w-full lg:w-40 dark:bg-violet-800 dark:border-violet-700">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden dark:border-violet-700">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="dark:bg-violet-900 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="dark:text-white">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 px-4">
                  <FilterSelects stacked />
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAll}
                      className="w-full mt-6 dark:border-violet-600 dark:text-white"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop filters */}
          <div className="hidden lg:block mt-4">
            <FilterSelects />
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t dark:border-violet-700">
              {category !== 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer dark:bg-violet-800"
                  onClick={() => setParam('category', 'all')}
                >
                  {categoryName}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {priceRange !== 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer dark:bg-violet-800"
                  onClick={() => setParam('price', 'all')}
                >
                  Price filter
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {where !== 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer dark:bg-violet-800"
                  onClick={() => setParam('where', 'all')}
                >
                  {where === 'remote' ? 'Remote only' : where}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {minRating !== 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer dark:bg-violet-800"
                  onClick={() => setParam('rating', 'all')}
                >
                  {minRating}+ stars
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              {q && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer dark:bg-violet-800"
                  onClick={() => setParam('q', '', '')}
                >
                  Search: {q}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              <button
                onClick={clearAll}
                className="text-sm text-violet-600 dark:text-amber-400 hover:underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300" aria-live="polite">
            Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Listings Grid */}
        {visible.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visible.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setParam('page', String(currentPage - 1), '1')}
                  className="dark:border-violet-600 dark:text-white"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={n === currentPage ? 'default' : 'outline'}
                    aria-current={n === currentPage ? 'page' : undefined}
                    onClick={() => setParam('page', String(n), '1')}
                    className={
                      n === currentPage
                        ? 'bg-violet-600 hover:bg-violet-700'
                        : 'dark:border-violet-600 dark:text-white'
                    }
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setParam('page', String(currentPage + 1), '1')}
                  className="dark:border-violet-600 dark:text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No listings found"
            description="Try adjusting your search or filters"
            action={
              <Button onClick={clearAll} className="bg-violet-600 hover:bg-violet-700">
                Clear Filters
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
