import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  LocateFixed,
  MapPin,
  MapPinned,
  Navigation,
  Plus,
  ShieldCheck,
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
import { directionsUrl, formatDistance, haversineKm, type LatLng } from '@/lib/safe-spots';
import { spotCities, spotTypeMeta } from '@/pages/SafeSpotsPage.meta';
import type { SafeSpotType } from '@/types';

export function SafeSpotsPage() {
  usePageTitle('Safe Spots');
  const navigate = useNavigate();
  const { user, safeSpots, submitSafeSpot, isDarkMode } = useApp();
  const [city, setCity] = useState<string>('all');
  const [open, setOpen] = useState(false);
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

  // Distance from the visitor to every spot, once location is shared.
  const distances = useMemo(() => {
    const map = new Map<string, number>();
    if (userPos) {
      approved.forEach((s) => {
        if (s.lat != null && s.lng != null) {
          map.set(s.id, haversineKm(userPos, { lat: s.lat, lng: s.lng }));
        }
      });
    }
    return map;
  }, [approved, userPos]);

  const focusSpot = (id: string) => {
    setFocusSpotId(id);
    setFocusNonce((n) => n + 1);
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleLocate = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not supported on this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Showing safe spots near you.');
      },
      () => {
        setLocating(false);
        toast.error('Could not get your location. Please allow location access and try again.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const openDialog = () => {
    setPicked(null);
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

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <MapPinned className="w-8 h-8 text-violet-600 dark:text-amber-400" />
            Safe Spots
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            Community-vetted places to meet buyers and sellers — busy, public and well-lit. Meet
            somewhere safe and swap with confidence.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {cityCounts.total} approved spots across {cityCounts.cities} cities
          </p>
        </div>

        {/* City filter */}
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter by city">
          <button
            type="button"
            onClick={() => setCity('all')}
            aria-pressed={city === 'all'}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
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
              onClick={() => setCity(c)}
              aria-pressed={city === c}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                city === c
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-gray-300 dark:border-violet-600 text-gray-600 dark:text-gray-200 hover:border-violet-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Live map */}
        <div ref={mapSectionRef} className="mb-8 scroll-mt-24">
          <div className="relative z-0 ss-map-frame h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-gray-200 dark:border-violet-700 shadow-card">
            <SafeSpotsMap
              spots={approved}
              city={city}
              dark={isDarkMode}
              userPos={userPos}
              focusSpotId={focusSpotId}
              focusNonce={focusNonce}
            />
            <button
              type="button"
              onClick={handleLocate}
              disabled={locating}
              aria-label="Show safe spots near me"
              className="absolute right-3 top-3 z-[1001] inline-flex items-center gap-2 rounded-full bg-white dark:bg-violet-800 pl-3 pr-4 py-2 text-sm font-semibold text-violet-700 dark:text-white shadow-lg border border-gray-200 dark:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-700 transition-colors disabled:opacity-60"
            >
              <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Locating…' : 'Near me'}</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            Tap a pin for directions — or pick a spot below to see it on the map.
          </p>
        </div>

        {/* Spots grid */}
        {approved.length === 0 && pending.length === 0 ? (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {approved.map((spot) => {
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

      {/* Suggest dialog */}
      <Dialog open={open} onOpenChange={(v) => (v ? openDialog() : setOpen(false))}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700 max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Suggest a safe spot</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Public, busy places only — police stations, malls, banks, restaurants and libraries.
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
                  Pin dropped — {picked.lat.toFixed(4)}, {picked.lng.toFixed(4)}
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
