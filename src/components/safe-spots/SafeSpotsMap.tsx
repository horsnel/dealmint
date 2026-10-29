import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SafeSpot } from '@/types';
import { NIGERIA_VIEW, cityCenter, directionsUrl, type LatLng } from '@/lib/safe-spots';
import { spotTypeMeta } from '@/pages/SafeSpotsPage.meta';

interface SafeSpotsMapProps {
  spots: SafeSpot[];
  city: string;
  dark: boolean;
  /** Show the visitor's own position as an amber dot */
  userPos?: LatLng | null;
  /** Fly to + open a specific spot's popup (change `focusNonce` to re-trigger) */
  focusSpotId?: string | null;
  focusNonce?: number;
  /** Suggest-dialog mode: tap to drop the pin */
  mode?: 'view' | 'picker';
  picked?: LatLng | null;
  onPick?: (p: LatLng) => void;
}

const TILE_URL =
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

// Violet teardrop pin with a white check — matches the Dealmint brand.
const spotPin = () =>
  L.divIcon({
    className: 'ss-marker-wrap',
    html: `<div class="ss-marker"><svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 1C7.3 1 1 7.3 1 15c0 10.4 13 21.6 13 21.6S29 25.4 29 15C29 7.3 22.7 1 15 1z" fill="#5B3AA8" stroke="#ffffff" stroke-width="2"/><path d="M9.8 15.2l3.6 3.6 7-7.2" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  });

const userDot = () =>
  L.divIcon({
    className: 'ss-marker-wrap',
    html: `<div class="ss-user-dot"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

export function SafeSpotsMap({
  spots,
  city,
  dark,
  userPos,
  focusSpotId,
  focusNonce = 0,
  mode = 'view',
  picked,
  onPick,
}: SafeSpotsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const pickCbRef = useRef(onPick);
  pickCbRef.current = onPick;

  // Init the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [NIGERIA_VIEW.center.lat, NIGERIA_VIEW.center.lng],
      zoom: NIGERIA_VIEW.zoom,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      userMarkerRef.current = null;
      userCircleRef.current = null;
      pickMarkerRef.current = null;
    };
  }, []);

  // Swap basemap tiles when the theme changes (same tiles — dark mode is a CSS filter).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tilesRef.current) map.removeLayer(tilesRef.current);
    tilesRef.current = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTR,
      maxZoom: 19,
    }).addTo(map);
  }, [dark]);

  // Spot markers + city framing (view mode).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'view') return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const pins = spots.filter((s) => s.lat != null && s.lng != null);
    pins.forEach((s) => {
      const meta = spotTypeMeta.find((t) => t.value === s.type);
      const html = `<div class="ss-popup"><p class="ss-popup__name">${esc(s.name)}</p><p class="ss-popup__meta">${esc(meta?.label ?? 'Safe spot')} &middot; ${esc(s.city)}</p><p class="ss-popup__addr">${esc(s.address)}</p><a class="ss-popup__dir" href="${directionsUrl({ lat: s.lat!, lng: s.lng! })}" target="_blank" rel="noreferrer">Get directions<span aria-hidden="true"> &rarr;</span></a></div>`;
      const marker = L.marker([s.lat!, s.lng!], { icon: spotPin(), title: s.name, alt: s.name })
        .addTo(map)
        .bindPopup(html, { closeButton: true, maxWidth: 260, minWidth: 200 });
      markersRef.current[s.id] = marker;
    });

    if (city === 'all') {
      if (pins.length > 0) {
        map.fitBounds(
          L.latLngBounds(pins.map((s) => [s.lat!, s.lng!] as [number, number])),
          { padding: [36, 36], maxZoom: 13 }
        );
      } else {
        map.flyTo([NIGERIA_VIEW.center.lat, NIGERIA_VIEW.center.lng], NIGERIA_VIEW.zoom, { duration: 0.8 });
      }
    } else {
      const c = cityCenter(city);
      const cityPins = pins.filter((s) => s.city === city);
      if (cityPins.length > 0) {
        map.fitBounds(
          L.latLngBounds(cityPins.map((s) => [s.lat!, s.lng!] as [number, number])),
          { padding: [36, 36], maxZoom: 14 }
        );
      } else {
        map.flyTo([c.lat, c.lng], c.zoom, { duration: 0.8 });
      }
    }
  }, [spots, city, mode]);

  // Fly to + open a spot chosen from the list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'view' || !focusSpotId || focusNonce === 0) return;
    const marker = markersRef.current[focusSpotId];
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.7 });
    // Open after the flight lands so autoPan can fully frame the popup.
    map.once('moveend', () => marker.openPopup());
  }, [focusSpotId, focusNonce, mode]);

  // Visitor position marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'view') return;
    if (!userPos) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      userCircleRef.current?.remove();
      userCircleRef.current = null;
      return;
    }
    const ll: [number, number] = [userPos.lat, userPos.lng];
    userMarkerRef.current?.remove();
    userMarkerRef.current = L.marker(ll, { icon: userDot(), interactive: false, zIndexOffset: 500 }).addTo(map);
    userCircleRef.current?.remove();
    userCircleRef.current = L.circle(ll, {
      radius: 220,
      color: '#5B3AA8',
      weight: 1,
      opacity: 0.4,
      fillColor: '#5B3AA8',
      fillOpacity: 0.08,
      interactive: false,
    }).addTo(map);
    map.flyTo(ll, Math.max(map.getZoom(), 14), { duration: 0.9 });
  }, [userPos, mode]);

  // Picker mode: tap to drop the pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'picker') return;

    const onClick = (e: L.LeafletMouseEvent) => pickCbRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on('click', onClick);
    map.getContainer().classList.add('ss-picker');

    return () => {
      map.off('click', onClick);
      map.getContainer().classList.remove('ss-picker');
    };
  }, [mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'picker') return;
    if (picked) {
      const ll: [number, number] = [picked.lat, picked.lng];
      if (pickMarkerRef.current) pickMarkerRef.current.setLatLng(ll);
      else
        pickMarkerRef.current = L.marker(ll, { icon: spotPin(), interactive: false, zIndexOffset: 500 }).addTo(map);
    } else {
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
    }
  }, [picked, mode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'picker') return;
    const c = cityCenter(city);
    map.flyTo([c.lat, c.lng], 13, { duration: 0.6 });
  }, [city, mode]);

  return <div ref={containerRef} className="h-full w-full" aria-label="Safe Spots map" role="application" />;
}
