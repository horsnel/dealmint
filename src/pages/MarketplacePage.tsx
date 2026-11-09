import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ShieldCheck,
  MapPin,
  Home,
  Wrench,
  Laptop,
  GraduationCap,
  Briefcase,
  Download,
  ClipboardList,
  Wallet,
  BadgeCheck,
  Bookmark,
  Globe,
  Star,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/common/ListingCard';
import { TrustPassport } from '@/components/common/TrustPassport';
import { LagosHeatMap } from '@/components/marketplace/LagosHeatMap';
import { DigitalPreviewOverlay } from '@/components/digital/DigitalPreviewOverlay';
import { useApp } from '@/context/AppContext';
import { MARKET_GROUPS, matchesCategory } from '@/lib/categories';
import { savedSearchLabel, savedSearchUrl } from '@/lib/search';
import { digitalCover } from '@/lib/digitalCovers';
import { formatPrice } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Listing, User } from '@/types';

const groupIcon: Record<string, React.ElementType> = {
  Home,
  Wrench,
  Laptop,
  GraduationCap,
  Briefcase,
  Download,
};

export function MarketplacePage() {
  usePageTitle('Marketplace');
  const navigate = useNavigate();
  const { listings, orders, safeSpots, user, savedSearches, matchesForSavedSearch, getSellerStats } = useApp();
  const [q, setQ] = useState('');
  const [previewHero, setPreviewHero] = useState(false);

  const active = useMemo(() => listings.filter((l) => l.isActive && !l.isDraft), [listings]);

  const latest = (type: Listing['type'], n: number) =>
    active
      .filter((l) => l.type === type)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, n);

  const freshTasks = useMemo(() => latest('task', 4), [active]);
  const freshGigs = useMemo(() => latest('gig', 4), [active]);
  const freshDigital = useMemo(() => latest('digital', 4), [active]);

  // Data-driven location chips: exact location strings live listings use,
  // so /browse?where=<chip> filters correctly. Remote first, then top areas.
  const locationChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of active) {
      if (l.type !== 'task' || !l.location) continue;
      counts.set(l.location, (counts.get(l.location) || 0) + 1);
    }
    const areas = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([loc]) => loc);
    return ['Remote', ...areas];
  }, [active]);

  // Seller spotlight: the people behind the live listings, ranked by
  // verification, rating and review count. Skips the signed-in user.
  const spotlight = useMemo(() => {
    const bySeller = new Map<string, { seller: User; listings: Listing[] }>();
    for (const l of active) {
      if (!l.seller?.id || l.seller.id === user?.id) continue;
      const entry = bySeller.get(l.seller.id) || { seller: l.seller, listings: [] };
      entry.listings.push(l);
      bySeller.set(l.seller.id, entry);
    }
    return [...bySeller.values()]
      .map((e) => ({ ...e, stats: getSellerStats(e.seller.id) }))
      .sort(
        (a, b) =>
          Number(b.seller.isVerified) - Number(a.seller.isVerified) ||
          b.stats.rating - a.stats.rating ||
          b.stats.count - a.stats.count ||
          b.listings.length - a.listings.length
      )
      .slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user?.id, listings.length]);

  // Live Lagos inventory for the city hub banner
  const lagosCount = useMemo(
    () => active.filter((l) => (l.location || '').includes('Lagos')).length,
    [active]
  );
  const lagosSpots = useMemo(
    () => safeSpots.filter((s) => s.city === 'Lagos' && s.isApproved).length,
    [safeSpots]
  );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/browse?q=${encodeURIComponent(q.trim())}` : '/browse');
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      {/* ---------- Hero: protected-by-default promise + dual entry ---------- */}
      <section className="bg-gradient-to-b from-violet-700 to-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-5">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              Every order is protected. Money moves only when the work is done
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
              Nigeria's protected marketplace
            </h1>
            <p className="text-white/85 text-lg mb-8 max-w-2xl">
              Hire help, find work and buy digital goods. Funds sit in escrow until you say the job is done. No stories, no wash.
            </p>

            {/* One search bar over everything — button and bar are the same pill height */}
            <form onSubmit={submitSearch} className="flex gap-2 mb-8 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="What do you need done? e.g. cleaner, logo, JAMB lessons"
                  aria-label="Search the marketplace"
                  className="w-full h-12 pl-11 pr-4 rounded-full bg-white text-gray-900 placeholder:text-gray-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full h-12 px-6 shadow-lg"
              >
                Search
              </Button>
            </form>

            {/* Dual entry — tasks first */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <Link
                to="/post/task"
                className="group rounded-2xl bg-white p-5 text-gray-900 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-violet-600" />
                  </span>
                  <h3 className="font-display font-bold text-lg">I need something done</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Post a task with your budget. Verified doers accept or send offers.
                </p>
                <span className="inline-flex items-center rounded-full bg-violet-600 text-white px-4 py-2 text-sm font-semibold group-hover:bg-violet-700 transition-colors">
                  Post a task
                </span>
              </Link>
              <Link
                to="/post/gig"
                className="group rounded-2xl border border-white/30 bg-white/10 backdrop-blur p-5 text-white hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-amber-300" />
                  </span>
                  <h3 className="font-display font-bold text-lg">I want to earn</h3>
                </div>
                <p className="text-sm text-white/80 mb-3">
                  Sell your skills as gigs or services. Get paid to your wallet, guaranteed.
                </p>
                <span className="inline-flex items-center rounded-full bg-amber-500 text-white px-4 py-2 text-sm font-semibold group-hover:bg-amber-600 transition-colors">
                  Post a gig
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* ---------- Saved searches, surfaced on the front door ---------- */}
        {user && savedSearches.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="font-display font-bold text-xl lg:text-2xl text-gray-900 dark:text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                Your saved searches
              </h2>
              <Link
                to="/dashboard/saved-searches"
                className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all"
              >
                Manage <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.slice(0, 6).map((s) => {
                const matches = matchesForSavedSearch(s);
                return (
                  <Link
                    key={s.id}
                    to={savedSearchUrl(s)}
                    className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-white dark:bg-violet-800 border border-violet-200 dark:border-violet-700 text-gray-700 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                  >
                    <span className="font-medium">{savedSearchLabel(s)}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-700 text-violet-700 dark:text-violet-200">
                      {matches} match{matches === 1 ? '' : 'es'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------- Nigerian-first directory ---------- */}
        <section className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                Browse what you actually need
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                From market runs to React fixes, grouped the way Lagos thinks.
              </p>
            </div>
            <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all shrink-0">
              All categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {/* Horizontal carousel with edge peek instead of a uniform grid */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {MARKET_GROUPS.map((g) => {
              const Icon = groupIcon[g.icon] || Briefcase;
              const count = active.filter((l) => matchesCategory(l, g.key)).length;
              return (
                <Link
                  key={g.key}
                  to={`/browse?category=${g.key}`}
                  className="group snap-start shrink-0 w-[72vw] max-w-[280px] sm:w-[264px] card-white dark:bg-violet-800 dark:border-violet-700 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-700/60 text-violet-700 dark:text-violet-200">
                      {count} live
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-gray-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-amber-400 transition-colors">
                    {g.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{g.blurb}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------- Lagos city hub: the living map ---------- */}
        <section className="mb-14">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-violet-700 to-violet-600 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 pb-5">
              <span className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-amber-300" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-bold text-xl lg:text-2xl mb-0.5">
                  Trading in Lagos? Start here
                </h2>
                <p className="text-white/80 text-sm">
                  The Lagos hub: live listings, Safe Spots and how Lagos trade works on Dealmint.
                </p>
              </div>
              <Link
                to="/marketplace/lagos"
                className="inline-flex items-center rounded-full bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors shrink-0"
              >
                Open the Lagos hub
              </Link>
            </div>
            <LagosHeatMap
              spots={safeSpots}
              liveCount={lagosCount}
              spotCount={lagosSpots}
              orders={orders}
              listings={listings}
              meId={user?.id}
            />
          </div>
        </section>

        {/* ---------- Tasks near you (hyperlocal, data-driven chips) ---------- */}
        {freshTasks.length > 0 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Tasks near you
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Fresh requests and safe meetups: verified Safe Spots, or go fully remote.
                </p>
              </div>
              <Link to="/browse?type=task" className="text-sm font-bold text-violet-600 dark:text-amber-400 underline-offset-4 decoration-2 decoration-violet-300 dark:decoration-amber-500/50 hover:underline hover:text-violet-700 dark:hover:text-amber-300 transition-colors">
                All tasks
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {locationChips.map((loc) => (
                <Link
                  key={loc}
                  to={loc === 'Remote' ? '/browse?type=task&where=remote' : `/browse?type=task&where=${encodeURIComponent(loc)}`}
                  className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full border border-violet-200 dark:border-violet-700 bg-white dark:bg-violet-800 text-gray-700 dark:text-gray-200 hover:border-violet-400 dark:hover:border-violet-500 transition-colors"
                >
                  {loc === 'Remote' ? <Globe className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {loc}
                </Link>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freshTasks.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Gigs & services ready to hire ---------- */}
        {freshGigs.length > 0 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Skills ready to hire
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Fixed-price gigs from verified sellers. Release payment only when you're happy.
                </p>
              </div>
              <Link to="/browse?type=gig" className="text-sm font-bold text-violet-600 dark:text-amber-400 underline-offset-4 decoration-2 decoration-violet-300 dark:decoration-amber-500/50 hover:underline hover:text-violet-700 dark:hover:text-amber-300 transition-colors">
                All gigs
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freshGigs.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Seller spotlight ---------- */}
        {spotlight.length >= 2 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Sellers worth your money
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Verified people with live listings and real reviews. Check their shop before you pay.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {spotlight.map(({ seller, listings: theirs, stats }) => {
                const latest = [...theirs].sort(
                  (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
                )[0];
                return (
                  <Link
                    key={seller.id}
                    to={`/seller/${seller.id}`}
                    className="card-white dark:bg-violet-800 dark:border-violet-700 card-tactile p-4 flex items-center gap-3.5"
                  >
                    <img
                      src={seller.avatar || '/images/avatar_default.jpg'}
                      alt={seller.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        {seller.name}
                        <TrustPassport
                          emailVerified={seller.isVerified}
                          phoneVerified={seller.phoneVerified}
                          idVerified={seller.idVerified || seller.idStatus === 'verified'}
                          size="sm"
                        />
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-sm" aria-label={`Rated ${stats.rating || 'unrated'}`}>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-gray-700 dark:text-gray-200">
                          {stats.count > 0 ? stats.rating : 'New'}
                        </span>
                        {stats.count > 0 && (
                          <span className="text-gray-400 dark:text-gray-400">({stats.count})</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {latest ? `${latest.category} · ` : ''}
                        {theirs.length} live listing{theirs.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    {latest && (
                      <img
                        src={digitalCover(latest)}
                        alt={`Recent work: ${latest.title}`}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ---------- Digital storefront ---------- */}
        {freshDigital.length > 0 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Buy digital, instantly
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Templates, e-books and courses. Pay, download, done. No meetup, no risk.
                </p>
              </div>
              <Link to="/browse?type=digital" className="text-sm font-bold text-violet-600 dark:text-amber-400 underline-offset-4 decoration-2 decoration-violet-300 dark:decoration-amber-500/50 hover:underline hover:text-violet-700 dark:hover:text-amber-300 transition-colors">
                All digital
              </Link>
            </div>
            {(() => {
              // Hero product spans the full width; the rest sit in a smaller
              // grid below, so the rail reads like a real storefront.
              const [hero, ...rest] = freshDigital;
              return (
                <div className="grid gap-6">
                  <Link
                    to={`/listing/${hero.id}`}
                    className="group card-white dark:bg-violet-800 dark:border-violet-700 card-tactile overflow-hidden grid sm:grid-cols-2"
                  >
                    <div className="relative overflow-hidden aspect-[16/9] sm:aspect-auto">
                      <img
                        src={digitalCover(hero)}
                        alt={hero.title}
                        className="absolute inset-0 w-full h-full object-cover img-grade group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tag-frosted">
                        Instant download
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewHero(true);
                        }}
                        className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tag-frosted hover:bg-white/30 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    </div>
                    <div className="p-6 lg:p-7 flex flex-col justify-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-amber-400 mb-2">
                        {hero.category}
                      </p>
                      <h3 className="font-display font-bold text-xl lg:text-2xl text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-amber-400 transition-colors">
                        {hero.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                        {hero.description}
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <img
                          src={hero.seller.avatar || '/images/avatar_default.jpg'}
                          alt={hero.seller.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {hero.seller.name}
                        </span>
                        {hero.seller.isVerified && (
                          <BadgeCheck
                            className="w-4 h-4 text-violet-600 dark:text-amber-400 shrink-0"
                            aria-label="Verified seller"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl font-bold text-violet-600 dark:text-amber-400">
                          {formatPrice(hero.price)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 group-hover:gap-2 transition-all">
                          Buy & download <Download className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((l) => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        <DigitalPreviewOverlay
          listing={freshDigital[0]}
          open={previewHero}
          onClose={() => setPreviewHero(false)}
        />

        {/* ---------- Trust rail: escrow, verification, safe spots ---------- */}
        <section className="bg-white dark:bg-violet-800 dark:border dark:border-violet-700 rounded-3xl p-6 lg:p-10">
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-2">
            Why deals here don't go wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            Classifieds leave you on your own. Dealmint doesn't: every naira and every meetup is engineered around trust.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Wallet,
                title: '1. Buyer funds escrow',
                body: 'You pay into your Dealmint wallet, not to the seller. The seller sees the order is funded, but cannot touch a kobo yet.',
              },
              {
                icon: ClipboardList,
                title: '2. Work is delivered',
                body: 'Chat, agree, deliver. Meet at a verified Safe Spot for physical tasks, or work fully remote.',
              },
              {
                icon: ShieldCheck,
                title: '3. You release the money',
                body: "Payment releases when you confirm, or automatically 7 days after delivery if you go quiet. Disagree? Dispute it and our team reviews.",
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/how-it-works"
              className="group flex items-center gap-3 rounded-2xl bg-violet-50 dark:bg-violet-700/60 p-4 hover:bg-violet-100 dark:hover:bg-violet-700 transition-colors"
            >
              <ShieldCheck className="w-8 h-8 text-violet-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                How escrow works
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">The 3-step protection, in detail</span>
              </span>
            </Link>
            <Link
              to="/safe-spots"
              className="group flex items-center gap-3 rounded-2xl bg-violet-50 dark:bg-violet-700/60 p-4 hover:bg-violet-100 dark:hover:bg-violet-700 transition-colors"
            >
              <MapPin className="w-8 h-8 text-violet-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {safeSpots.length} verified Safe Spots
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">Meet strangers where it's safe</span>
              </span>
            </Link>
            <Link
              to="/safety"
              className="group flex items-center gap-3 rounded-2xl bg-violet-50 dark:bg-violet-700/60 p-4 hover:bg-violet-100 dark:hover:bg-violet-700 transition-colors"
            >
              <BadgeCheck className="w-8 h-8 text-violet-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Verification tiers
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">Email, phone and ID. Know who you deal with</span>
              </span>
            </Link>
          </div>
        </section>

        {/* ---------- Closing CTA ---------- */}
        <section className="mt-14 text-center">
          <div className="bg-violet-600 rounded-3xl p-8 lg:p-12">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-white mb-3">
              Can't find it? Post it.
            </h2>
            <p className="text-white/85 mb-6 max-w-xl mx-auto">
              Describe what you need and your budget. Let verified doers come to you with offers.
            </p>
            <Link
              to="/post/task"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Post a task, it's free
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
