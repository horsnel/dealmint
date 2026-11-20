import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Check,
  Crosshair,
  MapPin,
  MapPinned,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SafeSpotsMap } from '@/components/safe-spots/SafeSpotsMap';
import {
  directionsUrl,
  formatDistance,
  haversineKm,
  HEAT_COLORS,
  zoneForCluster,
  type HeatZone,
  type LatLng,
} from '@/lib/safe-spots';
import { spotCities, spotTypeMeta } from '@/pages/SafeSpotsPage.meta';
import type { SafeSpotType } from '@/types';

export function SafeSpotsPage() {
  usePageTitle('Safe Spots');
  const navigate = useNavigate();
  const { user, safeSpots, submitSafeSpot, listings, isDarkMode } = useApp();
  const [city, setCity] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  // Map content popup: hidden by default; opens on a location search or the
  // Suggest a Spot flow, closed via its X button.
  const [popupOpen, setPopupOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<SafeSpotType | ''>('');
  const [address, setAddress] = useState('');
  const [spotCity, setSpotCity] = useState('Lagos');
  const [picked, setPicked] = useState<LatLng | null>(null);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [focusSpotId, setFocusSpotId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const cityCounts = useMemo(() => {
    const approved = safeSpots.filter((s) => s.isApproved);
    return {
      total: approved.length,
      cities: new Set(approved.map((s) => s.city)).size,
    };
  }, [safeSpots]);

  const filtered = useMemo(
    () => (city === 'all' ? safeSpots : safeSpots.filter((s) => s.city === city)),
    [safeSpots, city]
  );
  const approved = filtered.filter((s) => s.isApproved);
  const pending = filtered.filter((s) => !s.isApproved && s.submittedById === user?.id);
  const cityLabel = city === 'all' ? 'Nigeria' : city;

  // Search narrows the map pins and the grid together; typing a city name
  // jumps straight to that city.
  const q = query.trim().toLowerCase();
  const searchApproved = useMemo(
    () =>
      q
        ? approved.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.address.toLowerCase().includes(q) ||
              s.city.toLowerCase().includes(q)
          )
        : approved,
    [approved, q]
  );

  // Live listings for the bottom sheet — real, active posts only, newest first.
  const liveListings = useMemo(() => {
    const active = listings.filter((l) => l.isActive && !l.isDraft);
    const inCity =
      city === 'all'
        ? active
        : active.filter((l) => (l.location ?? '').toLowerCase().includes(city.toLowerCase()));
    return inCity
      .filter((l) => l.type === 'task' || l.type === 'gig')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [listings, city]);

  // Active-listing volume per city, for the heatmap level calculation.
  const liveCountByCity = useMemo(() => {
    const m = new Map<string, number>();
    const active = listings.filter((l) => l.isActive && !l.isDraft);
    spotCities.forEach((c) => {
      m.set(
        c,
        active.filter((l) => (l.location ?? '').toLowerCase().includes(c.toLowerCase())).length
      );
    });
    return m;
  }, [listings]);

  // Heatmap zones: cluster this city's approved spots on a ~2 km grid, place a
  // soft zone at each centroid, levelled by real activity (spots + listings).
  const heatZones = useMemo<HeatZone[]>(() => {
    const pinned = searchApproved.filter((s) => s.lat != null && s.lng != null);
    if (pinned.length === 0) return [];
    const groups = new Map<string, { lat: number; lng: number; spots: number; city: string }>();
    pinned.forEach((s) => {
      const key = `${s.lat!.toFixed(2)}:${s.lng!.toFixed(2)}`;
      const g = groups.get(key) ?? { lat: 0, lng: 0, spots: 0, city: s.city };
      g.lat += s.lat!;
      g.lng += s.lng!;
      g.spots += 1;
      groups.set(key, g);
    });
    return Array.from(groups.values()).map((g) => {
      const listingsNear =
        city === 'all' ? (liveCountByCity.get(g.city) ?? 0) : (liveCountByCity.get(city) ?? 0);
      const { level, radiusKm } = zoneForCluster(g.spots, listingsNear);
      return { lat: g.lat / g.spots, lng: g.lng / g.spots, radiusKm, level };
    });
  }, [searchApproved, liveCountByCity, city]);

  // Distance from the visitor to every spot, once location is shared.
  const distances = useMemo(() => {
    const map = new Map<string, number>();
    if (userPos) {
      searchApproved.forEach((s) => {
        if (s.lat != null && s.lng != null) {
          map.set(s.id, haversineKm(userPos, { lat: s.lat, lng: s.lng }));
        }
      });
    }
    return map;
  }, [searchApproved, userPos]);

  const focusSpot = (id: string) => {
    setFocusSpotId(id);
    setFocusNonce((n) => n + 1);
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Deep link: /safe-spots?focus=<spotId> (used by order "View on map")
  const focusParam = searchParams.get('focus');
  useEffect(() => {
    if (!focusParam) return;
    const spot = safeSpots.find((s) => s.id === focusParam && s.isApproved && s.lat != null);
    if (!spot) return;
    setCity(spot.city); // make sure the spot is in the rendered list
    setQuery('');
    setFocusSpotId(spot.id);
    setFocusNonce((n) => n + 1);
    const t = setTimeout(
      () => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
      250
    );
    const next = new URLSearchParams(searchParams);
    next.delete('focus');
    setSearchParams(next, { replace: true });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam]);

  // Robust locate flow: embedded previews (in-app browsers, IM preview panes)
  // block geolocation entirely; GPS fixes can be slow or unavailable, so we
  // retry on network location before giving up, with a clear message per case.
  const handleLocate = () => {
    if (!('geolocation' in navigator) || !navigator.geolocation) {
      toast.error('Location is not supported on this browser.');
      return;
    }
    if (window.self !== window.top) {
      toast.info('Location is blocked inside embedded previews.', {
        description: 'Open Dealmint in a full browser tab, then tap Near me again.',
        action: {
          label: 'Open in new tab',
          onClick: () => window.open(window.location.href, '_blank', 'noopener'),
        },
      });
      return;
    }
    setLocating(true);
    const onSuccess = (pos: GeolocationPosition) => {
      setLocating(false);
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      toast.success('Showing safe spots near you.');
    };
    const attempt = (highAccuracy: boolean, timeout: number) => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocating(false);
            toast.error('Location is turned off for this site.', {
              description:
                'Allow location access for Dealmint in your browser settings, then tap Near me again.',
            });
            return;
          }
          if (highAccuracy) {
            // GPS fix failed or timed out — network location is slower but
            // usually works where GPS does not.
            attempt(false, 12000);
            return;
          }
          setLocating(false);
          toast.error('Could not pin your location right now.', {
            description:
              'Your device could not get a position fix. Move somewhere with a clearer signal and try again.',
          });
        },
        { enableHighAccuracy: highAccuracy, timeout, maximumAge: 30000 }
      );
    };
    attempt(true, 8000);
  };

  const openDialog = () => {
    setPicked(null);
    setPopupOpen(true); // the suggest flow surfaces the map content popup
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!user) {
      toast.info('Log in to suggest a safe spot', {
        action: { label: 'Log in', onClick: () => navigate('/login', { state: { from: '/safe-spots' } }) },
      });
      return;
    }
    if (!type) return void toast.error('Choose the type of spot');
    if (!picked) return void toast.error('Drop the pin on the map first.');
    const res = submitSafeSpot({ name, type, address, city: spotCity, lat: picked.lat, lng: picked.lng });
    if (!res.ok) return void toast.error(res.error);
    setOpen(false);
    setName('');
    setType('');
    setAddress('');
    setPicked(null);
    toast.success('Thanks! Your suggestion is pending a quick safety review.');
  };

  const onSearchChange = (v: string) => {
    setQuery(v);
    const match = v.trim().toLowerCase();
    if (match && spotCities.some((c) => c.toLowerCase() === match)) {
      setCity(spotCities.find((c) => c.toLowerCase() === match)!);
    }
  };

  // Searching a location is one of the two triggers for the map content popup
  // (the other is Suggest a Spot via openDialog). Clearing the search hides it.
  useEffect(() => {
    setPopupOpen(query.trim().length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-6 lg:pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Community-vetted places to meet buyers and sellers: busy, public and well-lit. Meet
            somewhere safe and swap with confidence.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {cityCounts.total} approved spots across {cityCounts.cities} cities
          </p>
        </div>

        {/* Hero map with floating header + search (mock layout) */}
        <div
          ref={mapSectionRef}
          className="relative z-0 ss-map-frame h-[520px] sm:h-[560px] rounded-3xl overflow-hidden border border-gray-200 dark:border-violet-700 shadow-card scroll-mt-20"
        >
          <SafeSpotsMap
            spots={searchApproved}
            city={city}
            dark={isDarkMode}
            userPos={userPos}
            focusSpotId={focusSpotId}
            focusNonce={focusNonce}
            heatmapZones={heatZones}
          />

          {/* Floating header row */}
          <div className="absolute top-4 inset-x-4 z-[1000] flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={() => {
                // Recenter the map on the active city's spots instead of
                // navigating away — the control should feel like part of the
                // map, not an exit.
                setFocusSpotId(null);
                setFocusNonce((n) => n + 1);
              }}
              aria-label="Reset map view"
              className="pointer-events-auto w-10 h-10 bg-white dark:bg-violet-800 rounded-full shadow-md flex items-center justify-center text-gray-700 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-violet-700 transition"
            >
              <Crosshair className="w-5 h-5" />
            </button>
            <h1 className="pointer-events-auto bg-white/90 dark:bg-violet-900/90 backdrop-blur px-4 py-2 rounded-full shadow-md font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-violet-600 dark:text-amber-400" /> Safe Spots
            </h1>
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              aria-label="Show safe spots near me"
              className="pointer-events-auto w-10 h-10 bg-white dark:bg-violet-800 rounded-full shadow-md flex items-center justify-center text-gray-700 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-violet-700 transition disabled:opacity-60"
            >
              <Navigation className={`w-5 h-5 ${locating ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Search bar */}
          <div className="absolute top-[4.25rem] inset-x-4 z-[1000] bg-white dark:bg-violet-900 rounded-2xl shadow-lg border border-gray-100 dark:border-violet-700 flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search area or city..."
              aria-label="Search safe spots by area or city"
              className="bg-transparent border-none outline-none w-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium"
            />
            <button
              type="button"
              onClick={() =>
                filtersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
              aria-label="Filter by city"
              className="bg-gray-100 dark:bg-violet-800 p-1.5 rounded-lg text-gray-600 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-violet-700 transition shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Map content popup — hidden on page load. Opens when the user
              searches for a location or starts the Suggest a Spot flow; the X
              closes it. Sits inside the map card (z-30, below the floating
              header/search at z-[1000]) so it never overlays the whole page. */}
          {popupOpen && (
            <div className="absolute bottom-4 inset-x-4 z-30 bg-white dark:bg-violet-900 rounded-2xl shadow-xl border border-gray-100 dark:border-violet-700 p-4 max-h-[46%] overflow-y-auto">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  Activity in {cityLabel}
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  aria-label="Close results popup"
                  className="p-1.5 rounded-full bg-gray-100 dark:bg-violet-800 text-gray-600 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-violet-700 transition shrink-0"
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {searchApproved.length} of {cityCounts.total} approved spots
                {query.trim() ? (
                  <>
                    {' '}match “{query.trim()}”
                  </>
                ) : null}
              </p>
              {searchApproved.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  No spots match this search — try another area or city, or browse the community
                  list below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {searchApproved.slice(0, 4).map((spot) => {
                    const meta = spotTypeMeta.find((t) => t.value === spot.type);
                    const Icon = meta?.icon ?? MapPin;
                    return (
                      <div
                        key={spot.id}
                        className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-violet-800/60 rounded-xl px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 shrink-0 text-violet-600 dark:text-amber-400" />
                            {spot.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {spot.address} · {spot.city}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => focusSpot(spot.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-amber-400 hover:underline underline-offset-2 shrink-0"
                        >
                          <MapPinned className="w-3.5 h-3.5 shrink-0" /> View on map
                        </button>
                      </div>
                    );
                  })}
                  {searchApproved.length > 4 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                      +{searchApproved.length - 4} more in the community list below
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom sheet: activity, filters, legend, live listings (mock layout) */}
        <div className="relative z-10 -mt-8 bg-white dark:bg-violet-900 rounded-t-[2rem] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-8">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-violet-700 rounded-full mx-auto mb-5" />

          <div className="flex justify-between items-center mb-4 gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Activity in {cityLabel}
            </h2>
            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live
            </span>
          </div>

          {/* City filter */}
          <div ref={filtersRef} className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by city">
            <button
              type="button"
              onClick={() => { setCity('all'); setFocusSpotId(null); setFocusNonce(0); }}
              aria-pressed={city === 'all'}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                city === 'all'
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-gray-300 dark:border-violet-600 text-gray-600 dark:text-gray-200 hover:border-violet-400'
              }`}
            >
              All cities
            </button>
            {spotCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCity(c); setFocusSpotId(null); setFocusNonce(0); }}
                aria-pressed={city === c}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  city === c
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-gray-300 dark:border-violet-600 text-gray-600 dark:text-gray-200 hover:border-violet-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Heatmap legend */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-violet-800/60 rounded-xl p-3 mb-5 border border-gray-100 dark:border-violet-700">
            {(Object.keys(HEAT_COLORS) as Array<keyof typeof HEAT_COLORS>).map((level) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEAT_COLORS[level].fill }} />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {HEAT_COLORS[level].label}
                </span>
              </div>
            ))}
          </div>

          {/* Live listings nearby */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Live Listings Nearby</h3>
            <Link to="/browse" className="text-xs font-semibold text-violet-600 dark:text-amber-400 hover:underline">
              View all
            </Link>
          </div>

          {liveListings.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active listings around {cityLabel} right now — check back soon.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
              {liveListings.map((l) => (
                <Link
                  key={l.id}
                  to={`/listing/${l.id}`}
                  className="min-w-[200px] max-w-[200px] bg-white dark:bg-violet-800 border border-gray-100 dark:border-violet-700 rounded-2xl p-3 shadow-sm snap-start hover:border-violet-300 dark:hover:border-violet-500 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {l.seller.avatar ? (
                      <img
                        src={l.seller.avatar}
                        alt={l.seller.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-700 text-violet-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center">
                        {l.seller.name.charAt(0)}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                      {l.seller.name.split(' ')[0]} posted a {l.type.charAt(0).toUpperCase() + l.type.slice(1)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2">
                    {l.title}
                  </h4>
                  <div className="flex justify-between items-center mt-2 gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      ₦{l.price.toLocaleString('en-NG')}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate">
                      {l.isRemote ? 'Remote' : l.location || l.seller.location || cityLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Spots grid */}
        <div className="pt-10">
          {searchApproved.length === 0 && pending.length === 0 ? (
            <EmptyState
              icon={MapPinned}
              title="No safe spots here yet"
              description="Be the first to suggest a safe meeting place in this city."
              action={
                <Button onClick={() => (user ? openDialog() : navigate('/login', { state: { from: '/safe-spots' } }))} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Suggest a spot
                </Button>
              }
            />
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display font-semibold text-xl text-gray-900 dark:text-white">
                  Community-vetted spots{city !== 'all' ? ` in ${city}` : ''}
                </h2>
                {q && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {searchApproved.length} match{searchApproved.length === 1 ? '' : 'es'} for “{query.trim()}”
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchApproved.map((spot) => {
                  const meta = spotTypeMeta.find((t) => t.value === spot.type);
                  const Icon = meta?.icon || MapPin;
                  const dist = distances.get(spot.id);
                  const pinnable = spot.lat != null && spot.lng != null;
                  return (
                    <div key={spot.id} className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 flex flex-col">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white leading-snug">{spot.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{meta?.label}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-start gap-1.5">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                            <span>{spot.address}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge variant="secondary" className="dark:bg-violet-700 dark:text-gray-200">
                              {spot.city}
                            </Badge>
                            {dist != null && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 dark:text-amber-300 bg-violet-50 dark:bg-violet-900/40 rounded-full px-2 py-0.5">
                                <Navigation className="w-3 h-3 shrink-0" />
                                {formatDistance(dist)}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-full px-2 py-0.5">
                              <ShieldCheck className="w-3 h-3 shrink-0" />
                              Community verified
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-gray-100 dark:border-violet-700">
                        {pinnable && (
                          <button
                            type="button"
                            onClick={() => focusSpot(spot.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-amber-400 hover:underline underline-offset-2"
                          >
                            <MapPinned className="w-3.5 h-3.5 shrink-0" />
                            View on map
                          </button>
                        )}
                        {pinnable && (
                          <a
                            href={directionsUrl({ lat: spot.lat!, lng: spot.lng! })}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-amber-400 hover:underline underline-offset-2"
                          >
                            <Navigation className="w-3.5 h-3.5 shrink-0" />
                            Directions
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Own pending suggestions */}
              {pending.length > 0 && (
                <div className="mt-10">
                  <h2 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-4">
                    Your pending suggestions
                  </h2>
                  <div className="space-y-3">
                    {pending.map((spot) => (
                      <div
                        key={spot.id}
                        className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 flex flex-wrap items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{spot.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {spot.address} · {spot.city}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 rounded-full px-2.5 py-1">
                          <Building2 className="w-3 h-3 shrink-0" />
                          Pending approval
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit CTA */}
          <div className="mt-10 card-white dark:bg-violet-800 dark:border-violet-700 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Know a safe meeting spot?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Suggest it and help the community trade safely. Our team reviews every submission.
              </p>
            </div>
            <Button onClick={() => (user ? openDialog() : navigate('/login', { state: { from: '/safe-spots' } }))} className="bg-violet-600 hover:bg-violet-700 shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Suggest a spot
            </Button>
          </div>
        </div>
      </div>

      {/* Suggest dialog */}
      <Dialog open={open} onOpenChange={(v) => (v ? openDialog() : setOpen(false))}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700 max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Suggest a safe spot</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Public, busy places only: police stations, malls, banks, restaurants and libraries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="spot-name" className="dark:text-gray-200">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="spot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ikeja City Mall"
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-200">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={(v) => setType(v as SafeSpotType)}>
                <SelectTrigger className="mt-1 dark:bg-violet-700 dark:border-violet-600">
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {spotTypeMeta.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-200">City</Label>
              <Select
                value={spotCity}
                onValueChange={(v) => {
                  setSpotCity(v);
                  setPicked(null);
                }}
              >
                <SelectTrigger className="mt-1 dark:bg-violet-700 dark:border-violet-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spotCities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="spot-address" className="dark:text-gray-200">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="spot-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street and area"
                className="mt-1 dark:bg-violet-700 dark:border-violet-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-200">
                Pin it on the map <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                Tap the map to drop the pin at the exact meeting point.
              </p>
              <div className="relative z-0 ss-map-frame h-56 rounded-xl overflow-hidden border border-gray-200 dark:border-violet-600">
                <SafeSpotsMap mode="picker" spots={[]} city={spotCity} dark={isDarkMode} picked={picked} onPick={setPicked} />
                {!picked && (
                  <div className="pointer-events-none absolute inset-x-0 top-3 z-[1001] flex justify-center px-3">
                    <span className="rounded-full bg-white/95 dark:bg-violet-900/95 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-amber-300 shadow-md border border-violet-200 dark:border-violet-700 whitespace-nowrap">
                      Tap the map to drop the pin
                    </span>
                  </div>
                )}
              </div>
              {picked && (
                <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Pin dropped at {picked.lat.toFixed(4)}, {picked.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-700">
              Submit for review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
