import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair } from 'lucide-react';
import { toast } from 'sonner';
import type { SafeSpot, Listing, Order } from '@/types';
import { buildTicker, type TickerItem } from '@/lib/ticker';

/**
 * The "Lagos Hub becomes a living map" hero — an interactive dark-mode map of
 * Lagos embedded in the marketplace's purple banner:
 *  - glowing orange dots on verified Safe Spots
 *  - soft pulsing violet/orange heat zones where tasks are active
 *  - massive semi-transparent live counts floating over the map
 *  - a green pulse dot next to "live listings" + a horizontally scrolling
 *    live ticker of recent hires and postings
 *  - a locate-me crosshair that centers the map on the visitor's GPS
 *
 * Fully interactive: drag + pinch zoom. Scroll-wheel zoom stays off so the
 * page never hijacks the wheel. Tiles are OSM raster, CSS-inverted to a dark
 * stylized basemap (Carto dark now gates on an API key); light enough for
 * 4G/5G mobile (per product call).
 */

// Carto's dark basemaps now require an API key, so use plain OSM tiles and
// invert them via CSS — the classic stylized dark-map trick, same approach
// SafeSpotsMap uses for dark mode.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792];
const LAGOS_ZOOM = 11;

// Activity zones — "where tasks are currently active" (placeholder backend
// data sanctioned by the blueprint; weights tune the pulse size/opacity).
const ZONES: { name: string; lat: number; lng: number; weight: number }[] = [
  { name: 'Lekki', lat: 6.4459, lng: 3.4708, weight: 1.0 },
  { name: 'Ikeja', lat: 6.6018, lng: 3.3515, weight: 0.9 },
  { name: 'Yaba', lat: 6.5095, lng: 3.3711, weight: 0.75 },
  { name: 'Victoria Island', lat: 6.4284, lng: 3.4245, weight: 0.65 },
  { name: 'Surulere', lat: 6.4969, lng: 3.3506, weight: 0.5 },
];

const glowDot = () =>
  L.divIcon({
    className: 'hm-marker-wrap',
    html: `<div class="hm-dot"><span class="hm-dot__ring"></span><span class="hm-dot__core"></span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const userDot = () =>
  L.divIcon({
    className: 'hm-marker-wrap',
    html: `<div class="hm-user"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export function LagosHeatMap({
  spots,
  liveCount,
  spotCount,
  orders,
  listings,
  meId,
}: {
  spots: SafeSpot[];
  liveCount: number;
  spotCount: number;
  orders: Order[];
  listings: Listing[];
  meId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [locating, setLocating] = useState(false);

  const lagosSpots = useMemo(
    () => spots.filter((s) => s.city === 'Lagos' && s.lat != null && s.lng != null),
    [spots]
  );

  const ticker: TickerItem[] = useMemo(
    () => buildTicker(orders, listings, meId),
    [orders, listings, meId]
  );

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: LAGOS_CENTER,
      zoom: LAGOS_ZOOM,
      minZoom: 9,
      maxZoom: 17,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
      // let page scroll win on desktop; touch gestures still pinch
      dragging: true,
      touchZoom: true,
    });
    mapRef.current = map;
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 17, className: 'hm-tiles' }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // Heat zones + glowing safe-spot dots
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const z of ZONES) {
      const r = 3800 + z.weight * 4200;
      L.circle([z.lat, z.lng], {
        radius: r,
        className: 'hm-zone',
        stroke: false,
        fillColor: z.weight > 0.7 ? '#f59e0b' : '#8b5cf6',
        fillOpacity: 0.16 + z.weight * 0.1,
        interactive: false,
      }).addTo(layer);
    }

    for (const s of lagosSpots) {
      L.marker([s.lat!, s.lng!], {
        icon: glowDot(),
        title: s.name,
        alt: `${s.name}, Safe Spot`,
        keyboard: false,
      })
        .bindPopup(`<span class="hm-popup">${s.name}</span>`, {
          closeButton: false,
          offset: L.point(0, -8),
          autoPan: false,
        })
        .addTo(layer);
    }
  }, [lagosSpots]);

  const locateMe = () => {
    if (!mapRef.current) return;
    if (!('geolocation' in navigator)) {
      toast.error('Location is not available on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const map = mapRef.current!;
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker(ll, {
          icon: userDot(),
          interactive: false,
          zIndexOffset: 600,
        }).addTo(map);
        map.flyTo(ll, Math.max(map.getZoom(), 14), { duration: 0.9 });
        toast.success('Centered on your location');
      },
      () => {
        setLocating(false);
        toast.info('Could not get your location. Check location permissions.');
      },
      { timeout: 8000 }
    );
  };

  // Duplicate ticker for a seamless -50% marquee loop
  const loop = ticker.length ? [...ticker, ...ticker] : [];

  return (
    <div className="relative isolate z-0 overflow-hidden rounded-t-3xl bg-violet-950" aria-label="Lagos activity map">
      <div ref={containerRef} className="h-[280px] lg:h-[320px] w-full cursor-grab active:cursor-grabbing" />

      {/* Massive semi-transparent counts floating over the map */}
      <div className="pointer-events-none absolute left-4 top-4 lg:left-6 lg:top-5 z-[500] select-none">
        <div className="relative">
          <span
            aria-hidden="true"
            className="font-display font-black text-white/20 leading-none text-[64px] lg:text-[84px] absolute -left-2 -top-6"
          >
            {liveCount}
          </span>
          <span className="relative flex items-center gap-2 pt-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <span className="font-semibold text-white drop-shadow">{liveCount} live listings</span>
          </span>
        </div>
        <div className="relative mt-6">
          <span
            aria-hidden="true"
            className="font-display font-black text-amber-400/25 leading-none text-[64px] lg:text-[84px] absolute -left-2 -top-6"
          >
            {spotCount}
          </span>
          <span className="relative font-semibold text-white drop-shadow pt-2 inline-block">
            {spotCount} Safe Spots
          </span>
        </div>
      </div>

      {/* Locate me */}
      <button
        type="button"
        onClick={locateMe}
        aria-label="Center map on my location"
        className="absolute right-3 top-3 z-[500] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/20 active:bg-white/25"
      >
        <Crosshair className={`w-5 h-5 ${locating ? 'animate-spin' : ''}`} />
      </button>

      {/* Live ticker */}
      {loop.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] border-t border-white/10 bg-black/55 backdrop-blur-md overflow-hidden">
          <div className="hm-ticker flex items-center gap-8 whitespace-nowrap py-2 px-4 w-max">
            {loop.map((t, i) => (
              <span key={i} className="flex items-center gap-2 text-xs text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                {t.text}
                <span className="text-white/50">• {t.when}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
