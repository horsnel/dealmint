import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  MapPin,
  ClipboardList,
  Wallet,
  Landmark,
  Store,
  UtensilsCrossed,
  BookOpen,
  Building2,
  Globe,
} from 'lucide-react';
import { ListingCard } from '@/components/common/ListingCard';
import { useApp } from '@/context/AppContext';
import { MARKET_GROUPS, matchesCategory } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';

const spotIcon: Record<string, React.ElementType> = {
  police_station: Landmark,
  mall: Store,
  bank: Building2,
  restaurant: UtensilsCrossed,
  library: BookOpen,
};

/**
 * Lagos city hub: a curated front door for the city with the deepest
 * inventory. Everything on the page is computed from live data (listings,
 * Safe Spots), so counts are always real.
 */
export function LagosHubPage() {
  usePageTitle('Lagos Marketplace');
  const { listings, safeSpots } = useApp();

  const active = useMemo(() => listings.filter((l) => l.isActive && !l.isDraft), [listings]);

  const lagos = useMemo(
    () => active.filter((l) => (l.location || '').includes('Lagos')),
    [active]
  );

  const freshLagosTasks = useMemo(
    () =>
      lagos
        .filter((l) => l.type === 'task')
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 4),
    [lagos]
  );

  const lagosSpots = useMemo(
    () => safeSpots.filter((s) => s.city === 'Lagos' && s.isApproved),
    [safeSpots]
  );

  const remoteCount = useMemo(() => active.filter((l) => l.isRemote).length, [active]);

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      {/* ---------- Hero ---------- */}
      <section className="bg-gradient-to-b from-violet-700 to-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-5">
              <MapPin className="w-4 h-4 text-amber-300" />
              Lagos city hub
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
              Dealmint Lagos
            </h1>
            <p className="text-white/85 text-lg mb-8 max-w-2xl">
              Every Lagos listing, every verified meetup point, one page. From market runs in Ikeja to design gigs delivered online, money stays in escrow until the work is done.
            </p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="font-display font-bold text-3xl leading-none">{lagos.length}</p>
                <p className="text-sm text-white/70 mt-1">live Lagos listings</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl leading-none">{lagosSpots.length}</p>
                <p className="text-sm text-white/70 mt-1">verified Safe Spots</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl leading-none">{remoteCount}</p>
                <p className="text-sm text-white/70 mt-1">remote listings nationwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* ---------- Lagos directory with live counts ---------- */}
        <section className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                What Lagos needs, live right now
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Each group opens Browse pre-filtered to Lagos listings.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKET_GROUPS.map((g) => {
              const count = lagos.filter((l) => matchesCategory(l, g.key)).length;
              return (
                <Link
                  key={g.key}
                  to={`/browse?category=${g.key}&where=${encodeURIComponent('Lagos')}`}
                  className="group card-white dark:bg-violet-800 dark:border-violet-700 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-amber-400 transition-colors">
                      {g.name}
                    </h3>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-700/60 text-violet-700 dark:text-violet-200 shrink-0">
                      {count} live
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{g.blurb}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------- Fresh Lagos tasks ---------- */}
        {freshLagosTasks.length > 0 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Fresh tasks in Lagos
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Posted by people near you. Accept, agree a Safe Spot, get it done.
                </p>
              </div>
              <Link
                to={`/browse?type=task&where=${encodeURIComponent('Lagos')}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all"
              >
                All Lagos tasks <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freshLagosTasks.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Lagos Safe Spots ---------- */}
        {lagosSpots.length > 0 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Where to meet safely in Lagos
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Community-verified meetup points, from police stations to open malls.
                </p>
              </div>
              <Link
                to="/safe-spots"
                className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all"
              >
                Full Safe Spots map <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lagosSpots.map((s) => {
                const Icon = spotIcon[s.type] || MapPin;
                return (
                  <div
                    key={s.id}
                    className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 flex items-start gap-3"
                  >
                    <span className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.address}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------- Remote band ---------- */}
        <section className="mb-14">
          <Link
            to="/browse?where=remote"
            className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl bg-white dark:bg-violet-800 dark:border dark:border-violet-700 p-6 lg:p-8 hover:shadow-lg transition-shadow"
          >
            <span className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
              <Globe className="w-6 h-6 text-violet-600 dark:text-amber-400" />
            </span>
            <div className="flex-1">
              <h2 className="font-display font-bold text-xl lg:text-2xl text-gray-900 dark:text-white mb-1">
                Prefer to skip Third Mainland traffic?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {remoteCount} listings are fully remote. Design, writing, tutoring and more, delivered online and paid through escrow.
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-violet-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform hidden sm:block" />
          </Link>
        </section>

        {/* ---------- Trust strip ---------- */}
        <section className="bg-white dark:bg-violet-800 dark:border dark:border-violet-700 rounded-3xl p-6 lg:p-10">
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-2">
            How Lagos trade works here
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            No "send account number" DMs, no stories. The money is held before the work starts, and it only moves when you say so.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Wallet,
                title: '1. Fund in escrow',
                body: 'Pay into your Dealmint wallet. The seller sees the order is funded but cannot touch a kobo yet.',
              },
              {
                icon: MapPin,
                title: '2. Meet at a Safe Spot',
                body: 'For physical jobs, agree one of the verified Lagos meetup points above, or work fully remote.',
              },
              {
                icon: ShieldCheck,
                title: '3. Release when done',
                body: 'Confirm the work and the money moves. Unhappy? Open a dispute and our team reviews the chat.',
              },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl border border-violet-100 dark:border-violet-700 p-5">
                <span className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </span>
                <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/post/task"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <ClipboardList className="w-5 h-5" />
              Post a task in Lagos
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 border border-violet-300 dark:border-violet-600 dark:text-white font-semibold px-6 py-3 rounded-full hover:border-violet-500 transition-colors"
            >
              Back to the marketplace
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
