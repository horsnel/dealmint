import { Skeleton } from '@/components/ui/skeleton';

/**
 * Route-aware loading skeletons. Each variant mimics the top of the real
 * page it stands in for, so when the lazy chunk arrives the swap is a
 * seamless fill-in instead of a jarring reflow from a generic placeholder.
 */

function Shell({ children, narrow }: { children: React.ReactNode; narrow?: string }) {
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className={`${narrow || 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>{children}</div>
    </div>
  );
}

const sk = 'dark:bg-violet-800';
const skSoft = 'dark:bg-violet-700';

/** Listing detail / seller profile: media left, booking sidebar right. */
function DetailSkeleton() {
  return (
    <Shell>
      <div className="flex justify-end mb-4">
        <Skeleton className={`w-10 h-10 rounded-full ${sk}`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className={`aspect-video rounded-2xl ${sk}`} />
          <div className={`rounded-2xl border bg-white p-6 space-y-4 ${sk}`}>
            <div className="flex gap-2">
              <Skeleton className={`h-9 w-28 rounded-full ${skSoft}`} />
              <Skeleton className={`h-9 w-28 rounded-full ${skSoft}`} />
              <Skeleton className={`h-9 w-28 rounded-full ${skSoft}`} />
            </div>
            <Skeleton className={`h-5 w-2/5 ${skSoft}`} />
            <Skeleton className={`h-4 w-full ${skSoft}`} />
            <Skeleton className={`h-4 w-11/12 ${skSoft}`} />
            <Skeleton className={`h-4 w-3/4 ${skSoft}`} />
          </div>
        </div>
        <div>
          <div className={`rounded-2xl border bg-white p-6 space-y-4 ${sk}`}>
            <Skeleton className={`h-6 w-3/4 ${skSoft}`} />
            <Skeleton className={`h-9 w-32 ${skSoft}`} />
            <Skeleton className={`h-4 w-1/2 ${skSoft}`} />
            <Skeleton className={`h-12 w-full rounded-full bg-violet-200 ${skSoft}`} />
            <Skeleton className={`h-12 w-full rounded-full ${skSoft}`} />
            <div className="pt-4 border-t dark:border-violet-700 space-y-3">
              <Skeleton className={`h-4 w-2/3 ${skSoft}`} />
              <Skeleton className={`h-4 w-1/2 ${skSoft}`} />
              <Skeleton className={`h-4 w-3/5 ${skSoft}`} />
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/** Browse-style listing grids: search bar + card grid. */
function GridSkeleton() {
  return (
    <Shell>
      <div className="space-y-6">
        <Skeleton className={`h-12 w-full max-w-xl rounded-full ${sk}`} />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`rounded-2xl border bg-white overflow-hidden ${sk}`}>
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className={`h-4 w-3/4 ${skSoft}`} />
                <Skeleton className={`h-4 w-1/2 ${skSoft}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** Marketplace: hero band, search, then horizontal rails. */
function MarketplaceSkeleton() {
  return (
    <Shell>
      <div className="space-y-8">
        <Skeleton className={`h-40 rounded-3xl ${sk}`} />
        <Skeleton className={`h-12 w-full max-w-2xl mx-auto rounded-full ${sk}`} />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className={`h-16 w-44 shrink-0 rounded-2xl ${sk}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`rounded-2xl border bg-white overflow-hidden ${sk}`}>
              <Skeleton className="aspect-video rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className={`h-4 w-3/4 ${skSoft}`} />
                <Skeleton className={`h-4 w-1/2 ${skSoft}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** Dashboard: stat card row + panels. */
function DashboardSkeleton() {
  return (
    <Shell>
      <div className="space-y-6">
        <Skeleton className={`h-8 w-56 ${sk}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`rounded-2xl border bg-white p-5 space-y-3 h-[174px] ${sk}`}>
              <Skeleton className={`w-10 h-10 rounded-xl ${skSoft}`} />
              <Skeleton className={`h-4 w-20 ${skSoft}`} />
              <Skeleton className={`h-7 w-24 ${skSoft}`} />
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className={`h-64 rounded-2xl ${sk}`} />
          <Skeleton className={`h-64 rounded-2xl ${sk}`} />
        </div>
      </div>
    </Shell>
  );
}

/** Post / edit forms: stacked labelled fields. */
function FormSkeleton() {
  return (
    <Shell narrow="max-w-3xl">
      <div className="space-y-6">
        <Skeleton className={`h-9 w-64 ${sk}`} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className={`h-4 w-28 ${skSoft}`} />
            <Skeleton className={`h-11 w-full rounded-lg ${sk}`} />
          </div>
        ))}
        <Skeleton className={`h-12 w-40 rounded-full ${sk}`} />
      </div>
    </Shell>
  );
}

/** Auth screens: centred card. */
function AuthSkeleton() {
  return (
    <Shell narrow="max-w-md">
      <div className={`rounded-2xl border bg-white p-8 space-y-4 ${sk}`}>
        <Skeleton className={`h-7 w-36 ${skSoft}`} />
        <Skeleton className={`h-4 w-full ${skSoft}`} />
        <Skeleton className={`h-11 w-full rounded-lg ${skSoft}`} />
        <Skeleton className={`h-11 w-full rounded-lg ${skSoft}`} />
        <Skeleton className={`h-11 w-full rounded-full bg-violet-200 ${skSoft}`} />
      </div>
    </Shell>
  );
}

const PATHS = {
  detail: ['/listing/', '/seller/'],
  grid: ['/browse', '/categories', '/dashboard/favourites', '/dashboard/listings', '/dashboard/orders', '/dashboard/reviews', '/dashboard/notifications', '/dashboard/saved-searches'],
  marketplace: ['/marketplace'],
  dashboard: ['/dashboard'],
  form: ['/post/', '/edit'],
  auth: ['/login', '/register', '/role-selection', '/forgot-password', '/verify-phone', '/reset-password'],
};

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname.startsWith(p));
}

export function RouteSkeleton({ path }: { path: string }) {
  if (matches(path, PATHS.detail)) return <DetailSkeleton />;
  if (matches(path, PATHS.marketplace)) return <MarketplaceSkeleton />;
  if (matches(path, PATHS.form)) return <FormSkeleton />;
  if (matches(path, PATHS.auth)) return <AuthSkeleton />;
  if (matches(path, PATHS.grid)) return <GridSkeleton />;
  if (matches(path, PATHS.dashboard)) return <DashboardSkeleton />;
  // Generic fallback for the remaining static pages
  return (
    <Shell>
      <div className="space-y-6">
        <Skeleton className={`h-10 w-64 ${sk}`} />
        <Skeleton className={`h-6 w-96 max-w-full ${skSoft}`} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className={`h-64 rounded-2xl ${sk}`} />
          ))}
        </div>
      </div>
    </Shell>
  );
}
