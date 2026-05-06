"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { MapShell, type Bbox, type MapShellHandle } from "./MapShell";
import { FilterSidebar } from "@/components/panel/FilterSidebar";
import { FilterSheet } from "@/components/panel/FilterSheet";
import { applyFilters, decorate, sortByDistance, type DecoratedClinic } from "@/lib/filter-clinics";
import { useFilters } from "@/lib/filters";
import type { ClinicMarker } from "@/lib/db";

export function AtlasShell() {
  const { filters, update, writeUrl } = useFilters();

  const mapRef = useRef<MapShellHandle | null>(null);
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [inView, setInView] = useState<ClinicMarker[]>([]);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  // ─── fetch in-view clinics whenever bbox changes ───────────────────
  useEffect(() => {
    if (!bbox) return;
    const ac = new AbortController();
    const qs = `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`;
    fetch(`/api/clinics?bounds=${qs}`, { signal: ac.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { clinics: ClinicMarker[] }) => {
        if (Array.isArray(d?.clinics)) setInView(d.clinics);
      })
      .catch((err) => {
        if ((err as { name?: string })?.name !== "AbortError") {
          console.warn("[atlas] /api/clinics", err);
        }
      });
    return () => ac.abort();
  }, [bbox]);

  // ─── derived: decorate (distance) → filter → sort ──────────────────
  const decorated = useMemo(() => decorate(inView, center), [inView, center]);
  const filtered = useMemo(
    () => sortByDistance(applyFilters(decorated, filters)),
    [decorated, filters],
  );

  // ─── selection: fly map to clinic ──────────────────────────────────
  const onSelect = useCallback((c: DecoratedClinic) => {
    mapRef.current?.flyTo({ lat: c.lat, lng: c.lng, zoom: 15 });
  }, []);

  return (
    <div className="relative grid h-full min-h-0 grid-cols-1 lg:grid-cols-[380px_1fr]">
      <FilterSidebar
        filters={filters}
        update={update}
        writeUrl={writeUrl}
        inViewClinics={inView}
        filteredClinics={filtered}
        onHover={setHoveredSlug}
        onSelect={onSelect}
      />

      <section className="relative h-full min-h-0">
        <MapShell
          ref={mapRef}
          clinics={filtered}
          hoveredSlug={hoveredSlug}
          onBoundsChange={setBbox}
          onCenterChange={setCenter}
          className="absolute inset-0"
        />

        {/* mobile top bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 lg:hidden">
          <Link
            href="/"
            aria-label="Back to landing"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/85 px-3 py-2 text-[12px] text-[var(--ink)] backdrop-blur-md"
          >
            <Compass className="size-3.5 text-[var(--brass)]" />
            <span className="font-display">BC Clinic Atlas</span>
          </Link>
          <FilterSheet
            filters={filters}
            update={update}
            writeUrl={writeUrl}
            inViewClinics={inView}
            filteredClinics={filtered}
            onSelect={onSelect}
          />
        </div>
      </section>
    </div>
  );
}
