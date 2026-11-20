import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bike,
  BookOpen,
  Box,
  Building2,
  Check,
  Compass,
  Construction,
  Crosshair,
  Eye,
  Flame,
  Landmark,
  LayoutGrid,
  Layers,
  MapPin,
  MapPinned,
  Maximize,
  Mic,
  Minimize,
  Moon,
  Navigation,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Train,
  TrafficCone,
  User,
  Users,
  UtensilsCrossed,
  Wind,
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
import { SafeSpotsMap, type DensityPoint, type MapType, type ReportPin } from '@/components/safe-spots/SafeSpotsMap';
import {
  CITY_CENTERS,
  cityCenter,
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

// Google-Maps-style category pills — mapped to the real spot types so every
// pill actually filters the map pins (Coffee/Bars have no spot data yet).
const TYPE_FILTERS: { id: 'all' | SafeSpotType; label: string; icon: typeof MapPin }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'police_station', label: 'Police stations', icon: ShieldCheck },
  { id: 'mall', label: 'Shopping', icon: ShoppingBag },
  { id: 'bank', label: 'Banks', icon: Landmark },
  { id: 'restaurant', label: 'Restaurants', icon: UtensilsCrossed },
  { id: 'library', label: 'Libraries', icon: BookOpen },
];

// Waze-style report categories (verbatim per the request).
const REPORT_OPTIONS: { id: string; label: string; icon: typeof MapPin }[] = [
  { id: 'crowded', label: 'Spot is crowded / too busy', icon: Users },
  { id: 'lighting', label: 'Poor lighting / feels unsafe', icon: Moon },
  { id: 'road', label: "Road blocked / can't access location", icon: Construction },
  { id: 'suspicious', label: 'Suspicious activity', icon: Eye },
];

// Thumbnail snapshots (real tiles of Lagos at z10) for the Layers sheet, with
// reliable fallbacks if a provider throttles the visitor's network.
const MAP_TYPES: { id: MapType; label: string; thumb: string; fallbackThumb: string }[] = [
  {
    id: 'default',
    label: 'Default',
    // Esri's light canvas always renders (Carto throttles some networks), and
    // it reads like the light_all style it stands in for
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/10/493/521',
    fallbackThumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/10/493/521',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/493/521',
    fallbackThumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/10/493/521',
  },
  {
    id: 'terrain',
    label: 'Terrain',
    thumb: 'https://a.tile.opentopomap.org/10/521/493.png',
    fallbackThumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/10/493/521',
  },
];

// Task-density hubs — Lagos gigs cluster hard around Lekki and Ikeja.
const DENSITY_HUBS: Record<string, { lat: number; lng: number }[]> = {
  Lagos: [
    { lat: 6.4455, lng: 3.543 }, // Lekki
    { lat: 6.6018, lng: 3.3515 }, // Ikeja
    { lat: 6.5244, lng: 3.3792 }, // Lagos Island
  ],
};

const REPORT_TTL_MS = 2 * 60 * 60 * 1000;

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

  // --- Google-Maps-style overlay state ---
  // Basemap style picked in the Layers sheet, persisted per device.
  const [mapType, setMapTypeState] = useState<MapType>(() => {
    const stored = localStorage.getItem('dealmint_maptype');
    return stored === 'satellite' || stored === 'terrain' ? stored : 'default';
  });
  const setMapType = (t: MapType) => {
    setMapTypeState(t);
    localStorage.setItem('dealmint_maptype', t);
  };
  const [transitOn, setTransitOn] = useState(false);
  const [cyclingOn, setCyclingOn] = useState(false);
  const [densityOn, setDensityOn] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | SafeSpotType>('all');
  const [reportChoice, setReportChoice] = useState('');
  // Community safety reports: device-local, each pin lives for 2 hours.
  const [reports, setReports] = useState<ReportPin[]>(() => {
    try {
      const raw = localStorage.getItem('dealmint_safety_reports');
      const list: ReportPin[] = raw ? JSON.parse(raw) : [];
      return list.filter((r) => Date.now() - r.ts < REPORT_TTL_MS);
    } catch {
      return [];
    }
  });

  // Prune expired report pins while the page is open.
  useEffect(() => {
    const iv = window.setInterval(() => {
      setReports((prev) => {
        const next = prev.filter((r) => Date.now() - r.ts < REPORT_TTL_MS);
        if (next.length !== prev.length) localStorage.setItem('dealmint_safety_reports', JSON.stringify(next));
        return next.length === prev.length ? prev : next;
      });
    }, 60000);
    return () => window.clearInterval(iv);
  }, []);

  // Full-screen map: lock the page and let Escape exit.
  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

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

  // Category pills narrow the map pins (and the popup results) only — the
  // community list below keeps showing everything for context.
  const mapSpots = useMemo(
    () => (typeFilter === 'all' ? searchApproved : searchApproved.filter((s) => s.type === typeFilter)),
    [searchApproved, typeFilter]
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

  // Task-density heat: one weighted blob per live gig/task. Listings have no
  // coordinates, so each post lands near its city's hub — Lagos posts cluster
  // hard around Lekki and Ikeja — with jitter derived from the listing id so
  // the pattern is dense but perfectly stable between renders.
  const densityPoints = useMemo<DensityPoint[]>(() => {
    const active = listings.filter((l) => l.isActive && !l.isDraft && (l.type === 'task' || l.type === 'gig'));
    const hash = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h;
    };
    const pts: DensityPoint[] = [];
    active.slice(0, 60).forEach((l) => {
      const h = hash(l.id);
      const loc = (l.location ?? '').toLowerCase();
      const cityMatch = spotCities.find((c) => loc.includes(c.toLowerCase()));
      const isHot = cityMatch === 'Lagos';
      const hubs = isHot ? DENSITY_HUBS.Lagos : cityMatch ? [CITY_CENTERS[cityMatch]] : DENSITY_HUBS.Lagos;
      const hub = hubs[h % hubs.length];
      const angle = ((h >> 8) % 628) / 100;
      const distKm = 1 + ((h >> 4) % (isHot ? 9 : 6));
      const latJ = (Math.cos(angle) * distKm) / 111;
      const lngJ = (Math.sin(angle) * distKm) / (111 * Math.cos((hub.lat * Math.PI) / 180));
      pts.push({
        lat: hub.lat + latJ,
        lng: hub.lng + lngJ,
        weight: (isHot ? 0.45 : 0.25) + ((h >> 12) % 100) / 200,
      });
    });
    return pts;
  }, [listings]);

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

  // Nearest vetted spots for the Directions sheet — measured from the
  // visitor's position, or the active city's centre as a fallback.
  const nearestSpots = useMemo(() => {
    const ref = userPos ?? cityCenter(city === 'all' ? 'Lagos' : city);
    return searchApproved
      .filter((s) => s.lat != null && s.lng != null)
      .map((s) => ({ spot: s, km: haversineKm(ref, { lat: s.lat!, lng: s.lng! }) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 5);
  }, [searchApproved, userPos, city]);

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

  // Google-style voice search: dictation fills the search bar when the
  // browser supports it; graceful message where it does not.
  const voiceSearch = () => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          interimResults: boolean;
          start: () => void;
          onresult: ((e: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
          onerror: (() => void) | null;
        })
      | undefined;
    if (!SR) return void toast.info('Voice search is not supported in this browser.');
    const rec = new SR();
    rec.lang = 'en-NG';
    rec.interimResults = false;
    rec.onresult = (e) => onSearchChange(e.results[0][0].transcript);
    rec.onerror = () => toast.error("Couldn't hear that. Try typing the area instead.");
    rec.start();
    toast.info('Listening… say an area or city name.');
  };

  // Layers opens the Map type sheet; the density heat fades out to keep the
  // basemap clean while a style/overlay choice is being made.
  const openLayers = () => {
    setDensityOn(false);
    setLayersOpen(true);
  };

  const handleMyLocation = () => {
    setDensityOn(false); // heat fades when the user zeroes in on their position
    handleLocate();
  };

  const comingSoon = () => toast.info('This layer is coming soon to Dealmint.');

  // Waze-style report: pin a temporary warning at the visitor's position (or
  // the active city centre when location is unavailable) for 2 hours.
  const submitReport = () => {
    const option = REPORT_OPTIONS.find((o) => o.id === reportChoice);
    if (!option) return;
    const ref = userPos ?? cityCenter(city === 'all' ? 'Lagos' : city);
    const pin: ReportPin = {
      id: `rep-${Date.now()}`,
      lat: ref.lat,
      lng: ref.lng,
      label: option.label,
      ts: Date.now(),
    };
    const next = [...reports, pin];
    setReports(next);
    localStorage.setItem('dealmint_safety_reports', JSON.stringify(next));
    setReportOpen(false);
    setReportChoice('');
    toast.success("Alert sent. You've helped keep the community safe.");
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
          <h1 className="sr-only">Safe Spots</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Community-vetted places to meet buyers and sellers: busy, public and well-lit. Meet
            somewhere safe and swap with confidence.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {cityCounts.total} approved spots across {cityCounts.cities} cities
          </p>
        </div>

        {/* Hero map with Google-Maps-style overlays (mock layout). The card
            lifts above the in-flow sheet while any card overlay is open so
            the sheets are never clipped by the sheet's rounded top. */}
        <div
          ref={mapSectionRef}
          className={
            fullscreen
              ? 'ss-map-frame fixed inset-0 z-[70] rounded-none overflow-hidden bg-gray-200 dark:bg-violet-950'
              : `ss-map-frame relative ${
                  layersOpen || reportOpen || dirOpen || popupOpen ? 'z-30' : 'z-0'
                } h-[520px] sm:h-[560px] rounded-3xl overflow-hidden border border-gray-200 dark:border-violet-700 shadow-card scroll-mt-20`
          }
        >
          <SafeSpotsMap
            spots={mapSpots}
            city={city}
            dark={isDarkMode}
            userPos={userPos}
            focusSpotId={focusSpotId}
            focusNonce={focusNonce}
            heatmapZones={heatZones}
            mapType={mapType}
            overlays={{ transit: transitOn, cycling: cyclingOn }}
            densityPoints={densityPoints}
            densityOn={densityOn}
            reportPins={reports}
            fullscreen={fullscreen}
          />

          {/* Google-style top overlay: search row + category pills */}
          <div className="absolute top-0 inset-x-0 z-[1000] pt-4 px-4 pb-10 bg-gradient-to-b from-gray-100/95 dark:from-violet-950/95 to-transparent pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto mb-3">
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
                className="w-11 h-11 shrink-0 bg-white dark:bg-violet-800 rounded-full shadow-md flex items-center justify-center text-gray-700 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-violet-700 transition"
              >
                <Compass className="w-5 h-5" />
              </button>
              <div className="flex-grow bg-white dark:bg-violet-900 rounded-full shadow-md border border-gray-100 dark:border-violet-700 flex items-center px-4 py-3">
                <MapPin className="w-5 h-5 text-violet-600 dark:text-amber-400 mr-3 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search here"
                  aria-label="Search safe spots by area or city"
                  className="bg-transparent border-none outline-none w-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium"
                />
                <button
                  type="button"
                  onClick={voiceSearch}
                  aria-label="Search by voice"
                  className="ml-2 p-1.5 rounded-full text-gray-400 hover:text-violet-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-violet-800 transition shrink-0"
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              className="flex gap-2 overflow-x-auto hide-scrollbar pointer-events-auto pb-1"
              role="group"
              aria-label="Filter map pins by category"
            >
              {TYPE_FILTERS.map((f) => {
                const on = typeFilter === f.id;
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setTypeFilter(f.id);
                      setFocusSpotId(null);
                      setFocusNonce((n) => n + 1);
                    }}
                    aria-pressed={on}
                    className={`whitespace-nowrap flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full shadow-md border transition-colors ${
                      on
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'bg-white dark:bg-violet-900 border-gray-100 dark:border-violet-700 text-gray-800 dark:text-gray-100 hover:border-violet-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${on ? '' : 'text-violet-600 dark:text-amber-400'}`} aria-hidden="true" />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floating map controls (right stack, Google Maps style) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? 'Exit full screen map' : 'Enter full screen map'}
              className="w-11 h-11 bg-white dark:bg-violet-800 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-violet-700 transition"
            >
              {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setDensityOn((v) => !v)}
              aria-pressed={densityOn}
              aria-label="Toggle task density heatmap"
              className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition ${
                densityOn
                  ? 'bg-white text-orange-500 border-2 border-orange-500'
                  : 'bg-white dark:bg-violet-800 border-2 border-transparent text-gray-700 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-violet-700'
              }`}
            >
              <Flame className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={openLayers}
              aria-label="Map layers"
              className="w-11 h-11 bg-white dark:bg-violet-800 rounded-full shadow-lg flex items-center justify-center text-gray-700 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-violet-700 transition"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleMyLocation}
              disabled={locating}
              aria-label="My location"
              className="w-11 h-11 bg-white dark:bg-violet-800 rounded-full shadow-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-violet-700 transition disabled:opacity-60"
            >
              <Crosshair className={`w-5 h-5 ${locating ? 'animate-pulse' : ''}`} />
            </button>
          </div>

          {/* Directions (blue square) + Report (orange) above the bottom sheet */}
          <div
            className={`absolute right-4 z-[1000] transition-all duration-300 ${
              fullscreen ? 'bottom-6' : 'bottom-16'
            } ${popupOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <button
              type="button"
              onClick={() => setDirOpen(true)}
              aria-label="Directions"
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl flex items-center justify-center text-white transition"
            >
              <Navigation className="w-6 h-6 fill-white" />
            </button>
          </div>
          <div
            className={`absolute left-4 z-[1000] transition-all duration-300 ${
              fullscreen ? 'bottom-6' : 'bottom-16'
            } ${popupOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              aria-label="Report a safety issue"
              className="w-12 h-12 bg-orange-500 hover:bg-orange-600 rounded-full shadow-xl flex items-center justify-center text-white transition"
            >
              <AlertTriangle className="w-6 h-6" />
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
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
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
                  No spots match this search. Try another area or city, or browse the community
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

          {/* Layers sheet — Map type thumbnails + map details grid */}
          {layersOpen && (
            <div className="absolute inset-0 z-[1100] flex flex-col justify-end">
              <button
                type="button"
                aria-label="Close map type sheet"
                onClick={() => setLayersOpen(false)}
                className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
              />
              <div className="relative bg-white dark:bg-violet-900 w-full rounded-t-3xl p-5 pb-8 max-h-[85%] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Map type</h2>
                  <button
                    type="button"
                    onClick={() => setLayersOpen(false)}
                    aria-label="Close map type sheet"
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-violet-800 transition"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>

                <div className="flex gap-4 mb-6">
                  {MAP_TYPES.map((t) => {
                    const on = mapType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setMapType(t.id);
                          setLayersOpen(false);
                        }}
                        className="flex flex-col items-center gap-2"
                        aria-pressed={on}
                      >
                        <span
                          className={`block w-20 h-20 rounded-xl overflow-hidden shadow-sm bg-gray-100 dark:bg-violet-800 ${
                            on ? 'border-[3px] border-blue-500' : 'border border-gray-200 dark:border-violet-600'
                          }`}
                        >
                          <img
                            src={t.thumb}
                            alt={`${t.label} map preview`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Provider throttled this network — swap once to
                              // the reliable fallback tile for the preview.
                              const img = e.currentTarget;
                              if (img.dataset.fallbackUsed) return;
                              img.dataset.fallbackUsed = '1';
                              img.src = t.fallbackThumb;
                            }}
                          />
                        </span>
                        <span className={`text-xs font-medium ${on ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <hr className="border-gray-100 dark:border-violet-700 mb-5" />

                <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-4">Map details</h3>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {([
                    { id: 'transit', label: 'Public transport', icon: Train, tone: 'text-blue-500', active: transitOn, live: true },
                    { id: 'traffic', label: 'Traffic', icon: TrafficCone, tone: 'text-orange-500', active: false, live: false },
                    { id: 'cycling', label: 'Cycling', icon: Bike, tone: 'text-green-500', active: cyclingOn, live: true },
                    { id: '3d', label: '3D', icon: Box, tone: 'text-gray-500 dark:text-gray-300', active: false, live: false },
                  ] as const).map((d) => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={d.active}
                        onClick={() => {
                          if (d.id === 'transit') return setTransitOn((v) => !v);
                          if (d.id === 'cycling') return setCyclingOn((v) => !v);
                          comingSoon();
                        }}
                        className="flex flex-col items-center gap-2"
                      >
                        <span
                          className={`w-14 h-14 rounded-xl flex items-center justify-center border ${
                            d.active
                              ? 'bg-blue-50 dark:bg-violet-700 border-blue-500'
                              : 'bg-gray-50 dark:bg-violet-800 border-gray-100 dark:border-violet-700'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${d.tone}`} aria-hidden="true" />
                        </span>
                        <span className="text-[10px] text-center text-gray-600 dark:text-gray-300">{d.label}</span>
                      </button>
                    );
                  })}
                </div>

                <h3 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-4">More details</h3>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { label: 'Street View', icon: User, tone: 'text-yellow-500', badge: false },
                    { label: 'Wildfires', icon: Flame, tone: 'text-red-500', badge: true },
                    { label: 'Air quality', icon: Wind, tone: 'text-green-500', badge: true },
                  ] as const).map((d) => {
                    const Icon = d.icon;
                    return (
                      <button key={d.label} type="button" onClick={comingSoon} className="flex flex-col items-center gap-2">
                        <span className="relative w-14 h-14 bg-gray-50 dark:bg-violet-800 rounded-xl flex items-center justify-center border border-gray-100 dark:border-violet-700">
                          {d.badge && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                          <Icon className={`w-6 h-6 ${d.tone}`} aria-hidden="true" />
                        </span>
                        <span className="text-[10px] text-center text-gray-600 dark:text-gray-300">{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Report sheet — Waze-style community safety alert */}
          {reportOpen && (
            <div className="absolute inset-0 z-[1100] flex flex-col justify-end">
              <button
                type="button"
                aria-label="Close report sheet"
                onClick={() => setReportOpen(false)}
                className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
              />
              <div className="relative bg-white dark:bg-violet-900 w-full rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report a Safety Issue</h2>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    aria-label="Close report sheet"
                    className="p-2 rounded-full bg-gray-100 dark:bg-violet-800 hover:bg-gray-200 dark:hover:bg-violet-700 transition"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <div className="space-y-3 mb-6">
                  {REPORT_OPTIONS.map((o) => {
                    const Icon = o.icon;
                    const on = reportChoice === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setReportChoice(o.id)}
                        aria-pressed={on}
                        className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                          on
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                            : 'border-gray-200 dark:border-violet-600 hover:border-orange-400'
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${on ? 'text-orange-500' : 'text-gray-500 dark:text-gray-300'}`} aria-hidden="true" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={submitReport}
                  disabled={!reportChoice}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition"
                >
                  Submit Alert
                </button>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 text-center">
                  Your alert pins a temporary warning on the map for 2 hours.
                </p>
              </div>
            </div>
          )}

          {/* Directions sheet — nearest vetted spots with route links */}
          {dirOpen && (
            <div className="absolute inset-0 z-[1100] flex flex-col justify-end">
              <button
                type="button"
                aria-label="Close directions sheet"
                onClick={() => setDirOpen(false)}
                className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
              />
              <div className="relative bg-white dark:bg-violet-900 w-full rounded-t-3xl p-6 pb-8 max-h-[70%] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Directions</h2>
                  <button
                    type="button"
                    onClick={() => setDirOpen(false)}
                    aria-label="Close directions sheet"
                    className="p-2 rounded-full bg-gray-100 dark:bg-violet-800 hover:bg-gray-200 dark:hover:bg-violet-700 transition"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {userPos
                    ? 'Routes start from your current location.'
                    : `Measured from the centre of ${city === 'all' ? 'Lagos' : city}. Tap the crosshair to use your exact position.`}
                </p>
                {nearestSpots.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                    No pinned safe spots yet. Approve or suggest a spot first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {nearestSpots.map(({ spot, km }) => {
                      const meta = spotTypeMeta.find((t) => t.value === spot.type);
                      const Icon = meta?.icon ?? MapPin;
                      return (
                        <div
                          key={spot.id}
                          className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-violet-800/60 rounded-xl px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                              <Icon className="w-4 h-4 shrink-0 text-violet-600 dark:text-amber-400" />
                              {spot.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {meta?.label} · {spot.city} · {formatDistance(km)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <a
                              href={directionsUrl({ lat: spot.lat!, lng: spot.lng! })}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
                            >
                              <Navigation className="w-3.5 h-3.5" /> Directions
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                focusSpot(spot.id);
                                setDirOpen(false);
                              }}
                              className="text-xs font-semibold text-violet-600 dark:text-amber-400 hover:underline underline-offset-2"
                            >
                              View on map
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom sheet: activity, filters, legend, live listings (mock layout) */}
        <div className="relative z-10 -mt-8 bg-white dark:bg-violet-900 rounded-t-[2rem] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-8">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-violet-700 rounded-full mx-auto mb-5" />

          <div className="flex justify-between items-center mb-4 gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Latest in {cityLabel}
            </h2>
            <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
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
                  : 'border-gray-200 dark:border-violet-600 text-gray-600 dark:text-gray-200 hover:border-violet-400'
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
                    : 'border-gray-200 dark:border-violet-600 text-gray-600 dark:text-gray-200 hover:border-violet-400'
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
              No active listings around {cityLabel} right now. Check back soon.
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
