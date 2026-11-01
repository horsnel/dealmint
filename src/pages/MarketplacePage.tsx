import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
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
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingCard } from '@/components/common/ListingCard';
import { useApp } from '@/context/AppContext';
import { MARKET_GROUPS, matchesCategory } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Listing } from '@/types';

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
  const { listings, safeSpots } = useApp();
  const [q, setQ] = useState('');

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
              Every order is protected — money moves only when the work is done
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
              Nigeria's protected marketplace
            </h1>
            <p className="text-white/85 text-lg mb-8 max-w-2xl">
              Hire help, find work and buy digital goods. Funds sit in escrow until you say the job is done — no stories, no wash.
            </p>

            {/* One search bar over everything */}
            <form onSubmit={submitSearch} className="flex gap-2 mb-8 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="What do you need done? e.g. cleaner, logo, JAMB lessons"
                  aria-label="Search the marketplace"
                  className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white text-gray-900 placeholder:text-gray-400 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6 shadow-lg">
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
                  Post a task with your budget — verified doers accept or send offers.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 group-hover:gap-2 transition-all">
                  Post a task <ArrowRight className="w-4 h-4" />
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
                  Sell your skills as gigs or services — get paid to your wallet, guaranteed.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-300 group-hover:gap-2 transition-all">
                  Post a gig <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* ---------- Nigerian-first directory ---------- */}
        <section className="mb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                Browse what you actually need
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                From market runs to React fixes — grouped the way Lagos thinks.
              </p>
            </div>
            <Link to="/categories" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all shrink-0">
              All categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {MARKET_GROUPS.map((g) => {
              const Icon = groupIcon[g.icon] || Briefcase;
              const count = active.filter((l) => matchesCategory(l, g.key)).length;
              return (
                <Link
                  key={g.key}
                  to={`/browse?category=${g.key}`}
                  className="group card-white dark:bg-violet-800 dark:border-violet-700 p-5 hover:shadow-lg transition-shadow"
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

        {/* ---------- Tasks near you (hyperlocal, data-driven chips) ---------- */}
        {freshTasks.length > 0 && (
          <section className="mb-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
                  Tasks near you
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Fresh requests, safe meetups — meet at verified Safe Spots or go remote.
                </p>
              </div>
              <Link to="/browse?type=task" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all">
                All tasks <ArrowRight className="w-4 h-4" />
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
                  Fixed-price gigs from verified sellers — release payment only when you're happy.
                </p>
              </div>
              <Link to="/browse?type=gig" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all">
                All gigs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freshGigs.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
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
                  Templates, e-books and courses — pay, download, done. No meetup, no risk.
                </p>
              </div>
              <Link to="/browse?type=digital" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:gap-2 transition-all">
                All digital <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {freshDigital.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Trust rail: escrow, verification, safe spots ---------- */}
        <section className="bg-white dark:bg-violet-800 dark:border dark:border-violet-700 rounded-3xl p-6 lg:p-10">
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-2">
            Why deals here don't go wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            Classifieds leave you on your own. Dealmint doesn't — every naira and every meetup is engineered around trust.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Wallet,
                title: '1. Buyer funds escrow',
                body: 'You pay into your Dealmint wallet, not to the seller. The seller sees the order is funded — but cannot touch a kobo yet.',
              },
              {
                icon: ClipboardList,
                title: '2. Work is delivered',
                body: 'Chat, agree, deliver. Meet at a verified Safe Spot for physical tasks, or work fully remote.',
              },
              {
                icon: ShieldCheck,
                title: '3. You release the money',
                body: 'Payment releases when you confirm — or automatically 7 days after delivery if you go quiet. Disagree? Dispute it and our team reviews.',
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
                <span className="block text-xs font-normal text-gray-500 dark:text-gray-300">Email, phone and ID — know who you deal with</span>
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
              Describe what you need and your budget — let verified doers come to you with offers.
            </p>
            <Link
              to="/post/task"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Post a task — it's free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
