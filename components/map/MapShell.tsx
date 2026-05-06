"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import { Protocol } from "pmtiles";
import Supercluster from "supercluster";
import type { Feature, Point } from "geojson";

import "maplibre-gl/dist/maplibre-gl.css";

import { buildMapStyle } from "./style";
import {
  applyClinicLabel,
  createClinicPill,
  createClusterPill,
  setMarkerHover,
  type ClinicMarkerEl,
} from "./markers";
import type { ClinicMarker } from "@/lib/db";

type ClinicProps = ClinicMarker & { cluster: false };
type ClusterProps = {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number | string;
};
type IndexFeature = Feature<Point, ClinicProps>;
type RenderedFeature = Feature<Point, ClinicProps | ClusterProps>;

let pmtilesRegistered = false;
function registerPmtilesProtocol(): void {
  if (pmtilesRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);
  pmtilesRegistered = true;
}

export type Bbox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export interface MapShellHandle {
  flyTo: (target: { lat: number; lng: number; zoom?: number }) => void;
}

export interface MapShellProps {
  /** Source-of-truth list of clinics to render. (Filtered upstream.) */
  clinics: readonly ClinicMarker[];
  /** Slug to highlight via marker hover styling (from list-card hover). */
  hoveredSlug?: string | null;
  /** Bounds change is debounced 300ms after `moveend`. */
  onBoundsChange?: (bbox: Bbox) => void;
  /** Center change fires synchronously on every move (cheap, used for distance). */
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  className?: string;
}

const VANCOUVER_CENTER: [number, number] = [-123.1, 49.25];
const DEFAULT_ZOOM = 10.5;

export const MapShell = forwardRef<MapShellHandle, MapShellProps>(function MapShell(
  { clinics, hoveredSlug, onBoundsChange, onCenterChange, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const clusterRef = useRef<Supercluster<ClinicProps, ClusterProps> | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const fetchTimerRef = useRef<number | null>(null);
  const onBoundsRef = useRef(onBoundsChange);
  const onCenterRef = useRef(onCenterChange);
  onBoundsRef.current = onBoundsChange;
  onCenterRef.current = onCenterChange;

  // Index slug → DOM element for fast hover toggling.
  const slugToEl = useRef<globalThis.Map<string, ClinicMarkerEl>>(new globalThis.Map());

  // Stable supercluster index keyed on the clinics array
  const clusterIndex = useMemo(() => {
    const cluster = new Supercluster<ClinicProps, ClusterProps>({
      radius: 60,
      maxZoom: 13,
      extent: 512,
      minPoints: 2,
    });
    cluster.load(
      clinics.map(
        (c): IndexFeature => ({
          type: "Feature",
          properties: { ...c, cluster: false },
          geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        }),
      ),
    );
    return cluster;
  }, [clinics]);

  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;

    const b = map.getBounds();
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    const zoom = Math.floor(map.getZoom());
    const features = cluster.getClusters(bbox, zoom) as RenderedFeature[];

    const wanted = new Set<string>();

    for (const f of features) {
      const [lng, lat] = f.geometry.coordinates as [number, number];
      const isCluster = (f.properties as ClusterProps).cluster === true;
      const id = isCluster
        ? `cluster-${(f.properties as ClusterProps).cluster_id}`
        : `clinic-${(f.properties as ClinicProps).id}`;
      wanted.add(id);

      let m = markersRef.current.get(id);
      if (!m) {
        const el = isCluster
          ? createClusterPill((f.properties as ClusterProps).point_count)
          : createClinicPill(f.properties as ClinicProps, zoom);

        if (isCluster) {
          el.addEventListener("click", () => {
            const targetZoom = cluster.getClusterExpansionZoom(
              (f.properties as ClusterProps).cluster_id,
            );
            map.flyTo({ center: [lng, lat], zoom: Math.min(targetZoom, 16), speed: 1.2 });
          });
        } else {
          slugToEl.current.set((f.properties as ClinicProps).slug, el as ClinicMarkerEl);
        }

        m = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.set(id, m);
      } else if (!isCluster) {
        applyClinicLabel(m.getElement() as ClinicMarkerEl, zoom);
      }
    }

    // remove stale
    for (const [id, m] of markersRef.current.entries()) {
      if (!wanted.has(id)) {
        const el = m.getElement() as ClinicMarkerEl;
        if (el.__c?.slug) slugToEl.current.delete(el.__c.slug);
        m.remove();
        markersRef.current.delete(id);
      }
    }
  }, []);

  // Sync the supercluster ref + re-render whenever the clinics prop changes.
  useEffect(() => {
    clusterRef.current = clusterIndex;
    renderMarkers();
  }, [clusterIndex, renderMarkers]);

  // Hover sync — DOM mutation for the highlighted slug.
  useEffect(() => {
    const map = slugToEl.current;
    let active: ClinicMarkerEl | null = null;
    if (hoveredSlug) {
      const el = map.get(hoveredSlug);
      if (el) {
        setMarkerHover(el, true);
        active = el;
      }
    }
    return () => {
      if (active) setMarkerHover(active, false);
    };
  }, [hoveredSlug]);

  // Imperative flyTo handle.
  useImperativeHandle(
    ref,
    () => ({
      flyTo({ lat, lng, zoom }) {
        const map = mapRef.current;
        if (!map) return;
        map.easeTo({
          center: [lng, lat],
          zoom: zoom ?? Math.max(map.getZoom(), 14),
          duration: 800,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
        });
      },
    }),
    [],
  );

  // Initial map setup
  useEffect(() => {
    if (!containerRef.current) return;
    registerPmtilesProtocol();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle(),
      center: VANCOUVER_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 8,
      maxZoom: 18,
      pitch: 0,
      bearing: 0,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.touchZoomRotate.disableRotation();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        map.dragRotate.enable();
        map.touchPitch.enable();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) {
        map.dragRotate.disable();
        map.touchPitch.disable();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: false,
      }),
      "bottom-right",
    );

    const publishCenter = () => {
      const c = map.getCenter();
      onCenterRef.current?.({ lat: c.lat, lng: c.lng });
    };

    const publishBoundsDebounced = () => {
      if (fetchTimerRef.current != null) window.clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = window.setTimeout(() => {
        const b = map.getBounds();
        onBoundsRef.current?.({
          minLng: b.getWest(),
          minLat: b.getSouth(),
          maxLng: b.getEast(),
          maxLat: b.getNorth(),
        });
      }, 300);
    };

    map.on("load", () => {
      mapRef.current = map;
      publishCenter();
      // emit bounds immediately on load so the parent can fetch
      const b = map.getBounds();
      onBoundsRef.current?.({
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth(),
      });
      renderMarkers();
    });

    map.on("move", publishCenter);
    map.on("moveend", () => {
      renderMarkers();
      publishBoundsDebounced();
    });

    const markers = markersRef.current;
    const slugMap = slugToEl.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (fetchTimerRef.current != null) window.clearTimeout(fetchTimerRef.current);
      for (const m of markers.values()) m.remove();
      markers.clear();
      slugMap.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [renderMarkers]);

  return <div ref={containerRef} className={className} />;
});
