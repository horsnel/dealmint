import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import type { SafeSpot } from '@/types';
import { NIGERIA_VIEW, cityCenter, directionsUrl, HEAT_COLORS, type HeatZone, type LatLng } from '@/lib/safe-spots';
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
  /** Activity heatmap zones (safe/moderate/busy) drawn as soft blurred circles */
  heatmapZones?: HeatZone[];
  /** Basemap style selected in the Layers sheet */
  mapType?: MapType;
  /** Map detail overlays (Public transport / Cycling) toggled in the Layers sheet */
  overlays?: { transit?: boolean; cycling?: boolean };
  /** Task-density heat blobs (one per live listing, weighted) */
  densityPoints?: DensityPoint[];
  /** Task-density heatmap toggle; toggling off fades the layer out */
  densityOn?: boolean;
  /** Temporary community safety reports (auto-expire after 2h) */
  reportPins?: ReportPin[];
  /** Full-screen map mode: re-measure the tiles when the container resizes */
  fullscreen?: boolean;
}

export type MapType = 'default' | 'satellite' | 'terrain';

export interface DensityPoint {
  lat: number;
  lng: number;
  /** 0..1 — drives blob size and colour */
  weight: number;
}

export interface ReportPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** Epoch ms when the report was filed; the page prunes after 2h */
  ts: number;
}

// Basemaps for the Layers sheet (URLs per the Google-Maps-style spec).
const BASE_LAYERS: Record<MapType, { url: string; attr: string; maxZoom: number; subdomains?: string }> = {
  default: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles &copy; Esri. Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: 'Map data: &copy; OpenStreetMap contributors, SRTM | Style: &copy; OpenTopoMap (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC-BY-SA</a>)',
    maxZoom: 17,
    subdomains: 'abc',
  },
};

// Keyless community overlay tiles for the "Map details" toggles.
const OVERLAY_LAYERS = {
  transit: {
    url: 'https://{s}.tiles.openrailwaymap.org/2/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://www.openrailwaymap.org/" target="_blank" rel="noreferrer">OpenRailwayMap</a> (CC-BY-SA)',
    maxZoom: 18,
  },
  cycling: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attr: '&copy; <a href="https://www.cyclosm.org/" target="_blank" rel="noreferrer">CyclOSM</a> | &copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
} as const;

// Graceful degradation: Carto (and OSM on some networks) answer throttled
// IPs with a tiny placeholder tile instead of real imagery — still HTTP 200,
// so tileerror never fires. We probe the primary with a known land tile and
// walk a fallback chain (each step probed by response size) until a provider
// actually serves a map.
const FALLBACK_CHAINS: Record<MapType, { url: string; attr: string; maxZoom: number; minBytes?: number }[]> = {
  default: [
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
      // OSM's block page is a ~7KB image; real z10 land tiles are much larger
      minBytes: 10000,
    },
    {
      // Terminal, CDN-backed light basemap that works everywhere
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      attr: 'Tiles &copy; Esri. Source: Esri',
      maxZoom: 19,
      minBytes: 3500,
    },
  ],
  terrain: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      attr: 'Tiles &copy; Esri. Source: Esri, USGS, NOAA',
      maxZoom: 19,
      minBytes: 3500,
    },
  ],
  satellite: [],
};

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

// Violet cluster bubble with the number of grouped spots
const clusterIcon = (cluster: L.MarkerCluster) =>
  L.divIcon({
    className: 'ss-marker-wrap',
    html: `<div class="ss-cluster"><span>${cluster.getChildCount()}</span></div>`,
    iconSize: L.point(40, 40),
  });

// Waze-style temporary warning pin: orange circle, white ring, bouncing.
const reportPinIcon = () =>
  L.divIcon({
    className: 'ss-report-pin-wrap',
    html: `<div class="ss-report-pin animate-bounce"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
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
  heatmapZones,
  mapType = 'default',
  overlays,
  densityPoints,
  densityOn = false,
  reportPins,
  fullscreen = false,
}: SafeSpotsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const transitRef = useRef<L.TileLayer | null>(null);
  const cyclingRef = useRef<L.TileLayer | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);
  const pickMarkerRef = useRef<L.Marker | null>(null);
  const heatLayerRef = useRef<L.LayerGroup | null>(null);
  const densityLayerRef = useRef<L.LayerGroup | null>(null);
  const densityFadeRef = useRef<number | null>(null);
  const reportsRef = useRef<L.LayerGroup | null>(null);
  const probeTokenRef = useRef(0);
  const pickCbRef = useRef(onPick);
  pickCbRef.current = onPick;

  // Init the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [NIGERIA_VIEW.center.lat, NIGERIA_VIEW.center.lng],
      zoom: NIGERIA_VIEW.zoom,
      maxZoom: 19,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    });
    mapRef.current = map;
    // Low panes for the activity heatmap and the task-density heat so real
    // pins and popups sit above them.
    map.createPane('ssHeat');
    const heatPane = map.getPane('ssHeat');
    if (heatPane) {
      heatPane.style.zIndex = '390';
      heatPane.classList.add('ss-heat-pane');
    }
    map.createPane('ssDensity');
    const densityPane = map.getPane('ssDensity');
    if (densityPane) {
      densityPane.style.zIndex = '385';
      densityPane.classList.add('ss-density-pane');
    }
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Spots live in a cluster group so country-wide zooms collapse the pins
    // into violet count bubbles that split apart as you zoom in.
    clusterRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 44,
      animate: true,
      iconCreateFunction: clusterIcon,
    });
    map.addLayer(clusterRef.current);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      markersRef.current = {};
      userMarkerRef.current = null;
      userCircleRef.current = null;
      pickMarkerRef.current = null;
      heatLayerRef.current = null;
      densityLayerRef.current = null;
      reportsRef.current = null;
      if (densityFadeRef.current) window.clearTimeout(densityFadeRef.current);
    };
  }, []);

  // Basemap: swap tiles when the theme or the Layers-sheet map type changes.
  // A size probe on a known land tile detects placeholder responses and walks
  // the fallback chain; real networks keep the primary source untouched.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tilesRef.current) map.removeLayer(tilesRef.current);
    const base = BASE_LAYERS[mapType];
    const attach = (cfg: { url: string; attr: string; maxZoom: number; subdomains?: string }) =>
      L.tileLayer(cfg.url, {
        attribution: cfg.attr,
        maxZoom: cfg.maxZoom,
        ...(cfg.subdomains ? { subdomains: cfg.subdomains } : {}),
      }).addTo(map);
    const layer = attach(base);
    tilesRef.current = layer;
    // Real imagery (satellite/terrain) must not get the dark invert filter.
    map.getContainer().classList.toggle('ss-map-nofilter', mapType !== 'default');

    const probeToken = ++probeTokenRef.current;
    const probeTile = (cfg: { url: string; subdomains?: string }, minBytes: number) => {
      const url = cfg.url
        .replace('{s}', (cfg.subdomains ?? 'abc')[0])
        .replace('{z}', '10')
        .replace('{x}', '521')
        .replace('{y}', '493')
        .replace('{r}', '');
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 7000);
      return fetch(url, { mode: 'cors', signal: controller.signal })
        .then((r) => r.blob())
        .then((blob) => blob.size >= minBytes)
        .catch(() => false)
        .finally(() => window.clearTimeout(timer));
    };

    (async () => {
      if (await probeTile(base, 3500)) return; // primary serves real tiles
      for (const cand of FALLBACK_CHAINS[mapType]) {
        if (await probeTile(cand, cand.minBytes ?? 3500)) {
          if (probeToken !== probeTokenRef.current || mapRef.current !== map || tilesRef.current !== layer) return;
          map.removeLayer(layer);
          tilesRef.current = attach(cand);
          return;
        }
      }
    })();
  }, [dark, mapType]);

  // Map detail overlays (Public transport / Cycling) from the Layers sheet.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const wantTransit = !!overlays?.transit;
    const wantCycling = !!overlays?.cycling;
    if (!wantTransit && transitRef.current) {
      map.removeLayer(transitRef.current);
      transitRef.current = null;
    }
    if (!wantCycling && cyclingRef.current) {
      map.removeLayer(cyclingRef.current);
      cyclingRef.current = null;
    }
    if (wantTransit && !transitRef.current) {
      transitRef.current = L.tileLayer(OVERLAY_LAYERS.transit.url, {
        attribution: OVERLAY_LAYERS.transit.attr,
        maxZoom: OVERLAY_LAYERS.transit.maxZoom,
        opacity: 0.85,
      }).addTo(map);
    }
    if (wantCycling && !cyclingRef.current) {
      cyclingRef.current = L.tileLayer(OVERLAY_LAYERS.cycling.url, {
        attribution: OVERLAY_LAYERS.cycling.attr,
        maxZoom: OVERLAY_LAYERS.cycling.maxZoom,
        opacity: 0.85,
      }).addTo(map);
    }
  }, [overlays?.transit, overlays?.cycling]);

  // Spot markers (view mode). Keyed by a stable signature so changing the
  // city filter never rebuilds the cluster mid-animation — it only reframes.
  const pinSignature = useMemo(
    () => spots.filter((s) => s.lat != null && s.lng != null).map((s) => s.id).join(','),
    [spots]
  );

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || mode !== 'view') return;

    // Never mutate layers mid-animation
    map.stop();
    cluster.clearLayers();
    markersRef.current = {};

    spots
      .filter((s) => s.lat != null && s.lng != null)
      .forEach((s) => {
        const meta = spotTypeMeta.find((t) => t.value === s.type);
        const html = `<div class="ss-popup"><p class="ss-popup__name">${esc(s.name)}</p><p class="ss-popup__meta">${esc(meta?.label ?? 'Safe spot')} &middot; ${esc(s.city)}</p><p class="ss-popup__addr">${esc(s.address)}</p><a class="ss-popup__dir" href="${directionsUrl({ lat: s.lat!, lng: s.lng! })}" target="_blank" rel="noreferrer">Get directions<span aria-hidden="true"> &rarr;</span></a></div>`;
        const marker = L.marker([s.lat!, s.lng!], { icon: spotPin(), title: s.name, alt: s.name })
          .bindPopup(html, {
            closeButton: true,
            maxWidth: 260,
            minWidth: 200,
            // keep popups clear of the "Near me" button and screen edges
            autoPanPadding: L.point(44, 52),
          });
        cluster.addLayer(marker);
        markersRef.current[s.id] = marker;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinSignature, mode]);

  // Framing + focus, in one effect so they never race: when a spot is being
  // focused we go straight to it; otherwise we frame the active city.
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster || mode !== 'view') return;

    const marker = focusSpotId ? markersRef.current[focusSpotId] : undefined;
    if (focusSpotId && marker) {
      const parent = (marker as unknown as { __parent?: unknown }).__parent;
      if (parent != null) {
        map.stop();
        // Zoom until the marker splits out of its cluster, then fly close and
        // open the popup once the flight lands so autoPan can frame it.
        cluster.zoomToShowLayer(marker, () => {
          map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.7 });
          map.once('moveend', () => marker.openPopup());
        });
        return;
      }
    }

    const pins = spots.filter((s) => s.lat != null && s.lng != null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, mode, focusSpotId, focusNonce]);

  // Fly to + open a spot chosen from the list is handled by the framing+focus
  // effect above (keyed on focusSpotId/focusNonce).

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

  // Activity heatmap: soft blurred circles (mock style) derived from real
  // spot clusters + live listing volume. Redrawn only when the zone set changes.
  const zoneSignature = useMemo(
    () => (heatmapZones ?? []).map((z) => `${z.lat.toFixed(3)}:${z.lng.toFixed(3)}:${z.radiusKm}:${z.level}`).join('|'),
    [heatmapZones]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'view') return;
    heatLayerRef.current?.remove();
    heatLayerRef.current = null;
    const zones = heatmapZones ?? [];
    if (zones.length === 0) return;
    const group = L.layerGroup();
    zones.forEach((z) => {
      L.circle([z.lat, z.lng], {
        radius: z.radiusKm * 1000,
        stroke: false,
        fillColor: HEAT_COLORS[z.level].fill,
        fillOpacity: 0.55,
        interactive: false,
        pane: 'ssHeat',
      }).addTo(group);
    });
    group.addTo(map);
    heatLayerRef.current = group;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneSignature, mode]);

  // Task-density heatmap (Mapbox-style blobs from live listing volume).
  // Toggling on fades the blobs in; toggling off (or auto-hide from the
  // My Location / Layers buttons) fades them out before teardown.
  const densitySignature = useMemo(
    () => (densityPoints ?? []).map((p) => `${p.lat.toFixed(3)}:${p.lng.toFixed(3)}:${p.weight.toFixed(2)}`).join('|'),
    [densityPoints]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'view') return;
    const pane = map.getPane('ssDensity');

    const show = () => {
      if (densityFadeRef.current) {
        window.clearTimeout(densityFadeRef.current);
        densityFadeRef.current = null;
      }
      if (!densityLayerRef.current) {
        const group = L.layerGroup();
        (densityPoints ?? []).forEach((p) => {
          const colour = p.weight >= 0.7 ? '#ef4444' : p.weight >= 0.4 ? '#f97316' : '#f59e0b';
          L.circle([p.lat, p.lng], {
            radius: 450 + p.weight * 1400,
            stroke: false,
            fillColor: colour,
            fillOpacity: 0.5,
            interactive: false,
            pane: 'ssDensity',
          }).addTo(group);
        });
        group.addTo(map);
        densityLayerRef.current = group;
      }
      if (pane) pane.style.opacity = '1';
    };

    const hide = () => {
      if (pane) pane.style.opacity = '0';
      if (densityFadeRef.current) window.clearTimeout(densityFadeRef.current);
      densityFadeRef.current = window.setTimeout(() => {
        densityLayerRef.current?.remove();
        densityLayerRef.current = null;
        densityFadeRef.current = null;
      }, 550);
    };

    if (densityOn && (densityPoints ?? []).length > 0) show();
    else hide();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [densitySignature, densityOn, mode]);

  // Community safety reports: temporary orange warning pins that live for 2h.
  const reportsSignature = useMemo(
    () => (reportPins ?? []).map((r) => `${r.id}:${r.lat.toFixed(4)}:${r.lng.toFixed(4)}:${r.label}`).join('|'),
    [reportPins]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== 'view') return;
    reportsRef.current?.remove();
    reportsRef.current = null;
    const pins = reportPins ?? [];
    if (pins.length === 0) return;
    const group = L.layerGroup();
    pins.forEach((r) => {
      const when = new Date(r.ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
      L.marker([r.lat, r.lng], { icon: reportPinIcon(), title: r.label, alt: r.label, zIndexOffset: 600 })
        .bindPopup(
          `<div class="ss-popup"><p class="ss-popup__name">${esc(r.label)}</p><p class="ss-popup__meta">Community alert &middot; ${when}</p><p class="ss-popup__addr">Temporary warning. Auto-clears within 2 hours.</p></div>`,
          { closeButton: true, maxWidth: 220, minWidth: 180, autoPanPadding: L.point(44, 52) }
        )
        .addTo(group);
    });
    group.addTo(map);
    reportsRef.current = group;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsSignature, mode]);

  // Full-screen mode: the container resizes mid-transition; re-measure after
  // the settle so the tiles fill the viewport edge to edge.
  useEffect(() => {
    if (!fullscreen) return;
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    const t = window.setTimeout(() => map.invalidateSize(), 550);
    return () => window.clearTimeout(t);
  }, [fullscreen]);

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
