"use client";

import { useCallback, useEffect, useRef } from "react";
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

export interface MapShellProps {
  /** Notified whenever the in-viewport clinic list changes (after fetch). */
  onClinicsInView?: (clinics: ClinicMarker[]) => void;
  className?: string;
}

const VANCOUVER_CENTER: [number, number] = [-123.1, 49.25];
const DEFAULT_ZOOM = 10.5;

export function MapShell({ onClinicsInView, className }: MapShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const clusterRef = useRef<Supercluster<ClinicProps, ClusterProps> | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const fetchTimerRef = useRef<number | null>(null);
  const onClinicsCb = useRef(onClinicsInView);
  onClinicsCb.current = onClinicsInView;

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
        m.remove();
        markersRef.current.delete(id);
      }
    }
  }, []);

  const fetchClinics = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const bounds = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(",");

    try {
      const res = await fetch(`/api/clinics?bounds=${bounds}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("[atlas] /api/clinics", res.status);
        return;
      }
      const data = (await res.json()) as { clinics: ClinicMarker[] };
      const clinics = Array.isArray(data?.clinics) ? data.clinics : [];

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
      clusterRef.current = cluster;
      renderMarkers();
      onClinicsCb.current?.(clinics);
    } catch (err) {
      console.warn("[atlas] fetch failed", err);
    }
  }, [renderMarkers]);

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
      // Trackpad rotation is annoying on most laptops — disable by default.
      dragRotate: false,
      pitchWithRotate: false,
      // Allow pitch only with cmd/ctrl held. We re-enable dragRotate
      // (which carries pitch) on modifier-keydown and disable on keyup.
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

    map.on("load", () => {
      mapRef.current = map;
      void fetchClinics();
    });

    map.on("moveend", () => {
      renderMarkers();
      if (fetchTimerRef.current != null) window.clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = window.setTimeout(() => {
        void fetchClinics();
      }, 300);
    });

    const markers = markersRef.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (fetchTimerRef.current != null) window.clearTimeout(fetchTimerRef.current);
      for (const m of markers.values()) m.remove();
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [fetchClinics, renderMarkers]);

  return <div ref={containerRef} className={className} />;
}
