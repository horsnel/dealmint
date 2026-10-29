// Geospatial helpers for the Safe Spots live map.

export interface LatLng {
  lat: number;
  lng: number;
}

// Map anchors per city — used when a city has no pinned spots yet,
// and as the picker's starting view inside the suggest dialog.
export const CITY_CENTERS: Record<string, LatLng & { zoom: number }> = {
  Lagos: { lat: 6.5244, lng: 3.3792, zoom: 11 },
  Abuja: { lat: 9.0578, lng: 7.4951, zoom: 12 },
  'Port Harcourt': { lat: 4.8156, lng: 7.0498, zoom: 12 },
  Ibadan: { lat: 7.3775, lng: 3.947, zoom: 12 },
  'Benin City': { lat: 6.335, lng: 5.6037, zoom: 12 },
  Kano: { lat: 12.0022, lng: 8.592, zoom: 12 },
};

// Whole-of-Nigeria fallback for the "All cities" view.
export const NIGERIA_VIEW: { center: LatLng; zoom: number } = {
  center: { lat: 8.6, lng: 8.4 },
  zoom: 6,
};

export function cityCenter(city: string): LatLng & { zoom: number } {
  return CITY_CENTERS[city] ?? NIGERIA_VIEW.center;
}

// Great-circle distance between two points, in kilometres.
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

// Turn-by-turn directions on Google Maps (works on Android, iOS and web).
export function directionsUrl(point: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
}
