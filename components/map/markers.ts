import type { ClinicMarker } from "@/lib/db";

/**
 * HTML marker DOM builders. Plain DOM — not React — so MapLibre's
 * `Marker` class can manage them without React reconciliation churn
 * on every map move.
 */

const PILL_BASE_SHADOW = "0 1px 2px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.35)";
const PILL_HOVER_SHADOW =
  "0 1px 2px rgba(0,0,0,0.6), 0 4px 18px rgba(201,169,97,0.45), 0 0 0 1px var(--brass-dim)";
const CLUSTER_BASE_SHADOW =
  "0 1px 2px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(201,169,97,0.18)";

export type ClinicMarkerEl = HTMLDivElement & { __c: ClinicMarker; __zoom: number };

export function createClinicPill(c: ClinicMarker, zoom: number): ClinicMarkerEl {
  const el = document.createElement("div") as ClinicMarkerEl;
  el.className = "atlas-marker atlas-marker--clinic";
  el.__c = c;
  el.__zoom = zoom;

  Object.assign(el.style, {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: "22px",
    background: "var(--surface-2)",
    border: "1px solid var(--border-strong)",
    borderRadius: "999px",
    color: "var(--ink)",
    fontFamily: "var(--font-sans)",
    fontSize: "11.5px",
    fontWeight: "500",
    letterSpacing: "-0.005em",
    boxShadow: PILL_BASE_SHADOW,
    transformOrigin: "center",
    transition: "transform 180ms ease-out, box-shadow 180ms ease-out, background-color 180ms",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    pointerEvents: "auto",
    backdropFilter: "saturate(120%)",
    WebkitBackdropFilter: "saturate(120%)",
  } as Partial<CSSStyleDeclaration>);

  applyClinicLabel(el, zoom);

  // hover state — scale + brass glow
  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.08)";
    el.style.boxShadow = PILL_HOVER_SHADOW;
    el.style.zIndex = "20";
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
    el.style.boxShadow = PILL_BASE_SHADOW;
    el.style.zIndex = "";
  });

  return el;
}

/** Re-render the inner content for the current zoom (label visible at z>=13). */
export function applyClinicLabel(el: ClinicMarkerEl, zoom: number): void {
  const showLabel = zoom >= 13;
  if (el.__zoom === zoom && el.dataset.rendered === (showLabel ? "1" : "0")) return;
  el.__zoom = zoom;
  el.dataset.rendered = showLabel ? "1" : "0";

  el.style.padding = showLabel ? "0 10px 0 6px" : "0";
  el.style.height = showLabel ? "22px" : "14px";
  el.style.minWidth = showLabel ? "auto" : "14px";
  el.innerHTML = "";

  const dot = document.createElement("span");
  Object.assign(dot.style, {
    width: showLabel ? "8px" : "10px",
    height: showLabel ? "8px" : "10px",
    borderRadius: "999px",
    background: `var(--seg-${el.__c.segment})`,
    boxShadow: `0 0 0 1px rgba(0,0,0,0.55), 0 0 6px var(--seg-${el.__c.segment})`,
    flexShrink: "0",
  } as Partial<CSSStyleDeclaration>);
  el.appendChild(dot);

  if (showLabel) {
    const label = document.createElement("span");
    label.textContent = el.__c.name;
    label.style.cssText = "max-width: 220px; overflow: hidden; text-overflow: ellipsis;";
    el.appendChild(label);
  }
}

export function createClusterPill(count: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "atlas-marker atlas-marker--cluster";

  Object.assign(el.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "32px",
    height: "30px",
    padding: "0 12px",
    background: "var(--surface-2)",
    border: "1px solid var(--brass-dim)",
    borderRadius: "999px",
    color: "var(--ink)",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "0.04em",
    boxShadow: CLUSTER_BASE_SHADOW,
    cursor: "pointer",
    userSelect: "none",
    transition: "transform 180ms ease-out, border-color 180ms",
    pointerEvents: "auto",
  } as Partial<CSSStyleDeclaration>);
  el.textContent = String(count);

  el.addEventListener("mouseenter", () => {
    el.style.transform = "scale(1.08)";
    el.style.borderColor = "var(--brass)";
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
    el.style.borderColor = "var(--brass-dim)";
  });

  return el;
}
