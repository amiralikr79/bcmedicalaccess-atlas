import { layers, namedFlavor } from "@protomaps/basemaps";
import type { StyleSpecification, LayerSpecification } from "maplibre-gl";

/**
 * Custom Protomaps "dark" basemap, retuned for the BC Clinic Atlas
 * editorial look — warm espresso surfaces, deep teal-black water, moss
 * parks, and roads that fade into brass-tinted hairlines only at zoom ≥13.
 *
 * Glyphs: Protomaps' default fontstack (Noto Sans family). Inter is our
 * UI font, but Protomaps doesn't ship Inter glyph PBFs and self-hosting
 * a glyph build is a separate exercise. Noto Sans is a strong map face;
 * we lean into the editorial feel with `text-transform: lowercase` and
 * generous letter-spacing applied in post-process below.
 */

const TILE_URL =
  process.env.NEXT_PUBLIC_PMTILES_URL ?? "pmtiles://https://demo-bucket.protomaps.com/v4.pmtiles";

const GLYPHS = "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf";
const SPRITE = "https://protomaps.github.io/basemaps-assets/sprites/v4/dark";

// ─── token-aligned colour overrides ──────────────────────────────────
// Pulled from app/globals.css ([data-theme="dark"]).
const PALETTE = {
  bg: "#15110D",
  earth: "#1A1410",
  water: "#0A1518",
  park: "#1F2A1A",
  building: "#1E1814",
  buildingShadow: "#13100B",
  /** roads fade in at zoom 12+; tinted brass-warm at high zoom */
  roadHairline: "#2A211B",
  roadMid: "#382C24",
  roadHighlight: "#5A4A38",
  brassDim: "#8C7541",
  inkMuted: "#B8A899",
  inkFaint: "#6B5D52",
  ink: "#F2E9DC",
};

function overrideFlavor() {
  const dark = namedFlavor("dark");
  return {
    ...dark,
    background: PALETTE.bg,
    earth: PALETTE.earth,
    water: PALETTE.water,
    park_a: PALETTE.park,
    park_b: PALETTE.park,
    forest: PALETTE.park,
    wood: PALETTE.park,
    grass: PALETTE.park,
    glacier: "#1F2730",
    sand: "#2A241B",
    scrub: PALETTE.park,
    farmland: "#1B1612",
    landuse_residential: PALETTE.earth,
    landuse_industrial: "#1A1612",
    pedestrian: PALETTE.earth,
    pier: PALETTE.earth,

    buildings: PALETTE.building,
    buildings_shadow: PALETTE.buildingShadow,

    minor: PALETTE.roadHairline,
    minor_outline: PALETTE.bg,
    medium: PALETTE.roadMid,
    medium_outline: PALETTE.bg,
    major: PALETTE.roadMid,
    major_outline: PALETTE.bg,
    highway: PALETTE.roadHighlight,
    highway_outline: PALETTE.bg,
    other: PALETTE.roadHairline,
    other_outline: PALETTE.bg,

    railway: "#3A2E25",
    boundaries: "#3A2E25",

    // Labels
    state_label: PALETTE.inkMuted,
    state_label_halo: PALETTE.bg,
    country_label: PALETTE.ink,
    city_label: PALETTE.inkMuted,
    city_label_halo: PALETTE.bg,
    city_circle: PALETTE.brassDim,
    city_circle_stroke: PALETTE.bg,
    place_label: PALETTE.inkMuted,
    place_label_halo: PALETTE.bg,
    neighbourhood_label: PALETTE.inkFaint,
    neighbourhood_label_halo: PALETTE.bg,
    landuse_label: PALETTE.inkFaint,
    landuse_label_halo: PALETTE.bg,
    water_label: "#5D7A99",
    water_label_halo: PALETTE.bg,
    natural_label: "#7A9070",
    natural_label_halo: PALETTE.bg,
    park_label: "#7A9070",
    park_label_halo: PALETTE.bg,
    roads_label_major: PALETTE.inkMuted,
    roads_label_major_halo: PALETTE.bg,
    roads_label_minor: PALETTE.inkFaint,
    roads_label_minor_halo: PALETTE.bg,
    ocean_label: PALETTE.inkFaint,
    ocean_label_halo: PALETTE.bg,
    subplace_label: PALETTE.inkFaint,
    subplace_label_halo: PALETTE.bg,

    // Disable POI clutter (we'll add our own clinic markers)
    pois: {
      blue: "#0000",
      green: "#0000",
      lapis: "#0000",
      pink: "#0000",
      red: "#0000",
      slategray: "#0000",
      tangerine: "#0000",
      turquoise: "#0000",
    },
    // POI labels off
    pois_label: "#0000",
    pois_label_halo: "#0000",
  };
}

// Post-process Protomaps' generated layers to add the editorial flourishes:
// lowercase + generous tracking on labels, road opacity that ramps with zoom.
function tuneLayers(input: LayerSpecification[]): LayerSpecification[] {
  return input.map((layer) => {
    const id = layer.id;
    // Editorial label treatment — lowercase, looser tracking, lighter weight
    if (layer.type === "symbol") {
      const layout = { ...((layer.layout as Record<string, unknown>) ?? {}) };
      // Most of these will be no-ops if the property doesn't exist; that's fine.
      if (layout["text-field"] !== undefined) {
        layout["text-transform"] = "lowercase";
        const tracking = id.includes("country")
          ? 0.22
          : id.includes("state") || id.includes("city")
            ? 0.14
            : id.includes("place") || id.includes("neighbourhood") || id.includes("landuse")
              ? 0.1
              : 0.06;
        layout["text-letter-spacing"] = tracking;
        // soften default weight: Protomaps uses Bold for cities; pull back
        if (Array.isArray(layout["text-font"])) {
          // keep, but later self-host Inter glyphs
        }
      }
      return { ...layer, layout } as LayerSpecification;
    }
    // Roads: zoom-ramp opacity so they only appear at z≥12 and bloom around z≥14.
    if (layer.type === "line" && (id.startsWith("roads_") || id.startsWith("transit_"))) {
      const paint = { ...((layer.paint as Record<string, unknown>) ?? {}) };
      paint["line-opacity"] = [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        0,
        12,
        0.35,
        14,
        0.7,
        16,
        0.95,
      ];
      return { ...layer, paint } as LayerSpecification;
    }
    return layer;
  });
}

export function buildMapStyle(): StyleSpecification {
  const customFlavor = overrideFlavor();
  const generated = layers("protomaps", customFlavor, { lang: "en" }) as LayerSpecification[];
  const tuned = tuneLayers(generated);

  return {
    version: 8,
    glyphs: GLYPHS,
    sprite: SPRITE,
    sources: {
      protomaps: {
        type: "vector",
        url: TILE_URL,
        attribution:
          '<a href="https://protomaps.com">Protomaps</a> · <a href="https://openstreetmap.org/copyright">© OpenStreetMap</a>',
      },
    },
    layers: tuned,
  } satisfies StyleSpecification;
}
