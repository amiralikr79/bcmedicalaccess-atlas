# CLAUDE.md — BC Clinic Atlas

## Vision
A beautiful, editorial-grade interactive map of every healthcare clinic in British Columbia, segmented by specialty. The aesthetic target is "Airbnb meets a New Yorker map illustration" — warm, dark, considered. Not Google Maps. Not corporate.

## Tech Stack (locked)
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- MapLibre GL JS (free, OSS)
- Supabase (PostgreSQL + PostGIS) for clinic data
- Typesense for search
- shadcn/ui for primitives
- Framer Motion for transitions
- Deployed on Vercel

## MVP Scope
Single segment: UPCCs + walk-in clinics in Metro Vancouver. ~150 clinics. Ship this beautifully before adding any other segment.

## Segment Taxonomy (full, in priority order for future phases)
1. primary_care (UPCC, walk-in, family practice)
2. diagnostic (imaging, lab)
3. specialist (cardio, derm, ENT, ortho, etc.)
4. dental (general, ortho, oral surgery)
5. vision (optometry, ophthalmology)
6. mental_health (psychiatry, psychology, counselling)
7. allied_health (physio, chiro, massage, acupuncture)
8. naturopathic
9. aesthetic (med spa, cosmetic derm, plastic surg)
10. reproductive_health
11. pediatric
12. travel_health
13. cannabis_pain
14. telehealth
15. private_surgical
16. pharmacy_clinical

## Design Tokens (locked)
Warm, dark, editorial. Espresso surfaces, parchment ink, brass for one moment per viewport.

```css
/* surfaces & ink — dark theme (default) */
--bg:            #15110D;  /* deep espresso, the page */
--surface:       #1E1814;  /* lifted, e.g. nav */
--surface-2:     #261E18;  /* card */
--surface-3:     #2F251E;  /* hover / map controls */
--ink:           #F2E9DC;  /* parchment, primary text */
--ink-muted:     #B8A899;  /* warm taupe, secondary text */
--ink-faint:     #6B5D52;  /* deep taupe, captions */
--border:        #2F2620;  /* hairline */
--border-strong: #473A30;  /* card edge */

/* accent — used SPARINGLY (one per viewport) */
--brass:         #C9A961;
--brass-bright:  #E0BE76;
--brass-dim:     #8C7541;

/* state */
--ring:          #C9A961;  /* brass focus */
--danger:        #C2553D;
--success:       #7A9E68;

/* segment palette — each color readable on --bg */
--seg-primary_care:        #C9A961;  /* brass */
--seg-diagnostic:          #C57A4F;  /* copper */
--seg-specialist:          #B5553C;  /* terracotta */
--seg-dental:              #E8DCC4;  /* ivory */
--seg-vision:              #7B96B5;  /* slate-blue */
--seg-mental_health:       #A6B89A;  /* sage */
--seg-allied_health:       #859E68;  /* moss */
--seg-naturopathic:        #5C8A5E;  /* fern */
--seg-aesthetic:           #C68A95;  /* rose */
--seg-reproductive_health: #D88876;  /* coral */
--seg-pediatric:           #D4A37A;  /* apricot */
--seg-travel_health:       #B89A52;  /* ochre */
--seg-cannabis_pain:       #8B8B5A;  /* olive */
--seg-telehealth:          #8E91C2;  /* periwinkle */
--seg-private_surgical:    #8E4F5C;  /* wine */
--seg-pharmacy_clinical:   #A87F6B;  /* clay */

/* type */
--font-sans:    "Inter", ui-sans-serif, system-ui, sans-serif;
--font-display: "Fraunces", "Iowan Old Style", Georgia, serif;
--font-mono:    "JetBrains Mono", ui-monospace, monospace;

/* radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;

/* spacing scale (4px base) — Tailwind handles, but for hand-tuned */
/* shadows — warm, low, never blue */
--shadow-soft:   0 1px 2px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.25);
--shadow-lift:   0 1px 2px rgba(0,0,0,0.50), 0 16px 40px rgba(0,0,0,0.45);
```

## Definition of Done — for the project
A user lands on the map. Within 3 seconds, they see Metro Vancouver clinics rendered as styled markers on a custom-themed map, can filter by segment, click a marker to slide in a detail panel with hours/phone/website, and search by clinic name or neighbourhood. The aesthetic should make a designer screenshot it.

## Working Principles
- Commit after every working unit. Conventional commits.
- No feature creep. If a phase has a DoD, ship that DoD before adding more.
- Custom over default. Shadcn-vanilla look is a failure state.
- Mobile is non-negotiable. 60% of "walk-in clinic near me" is mobile.
- Accessibility: AA contrast minimum, keyboard nav for all controls.

## File Structure (target)
/app
  /atlas (route group for the map page)
    page.tsx            — map shell
    layout.tsx
  /api
    /clinics            — query endpoint
/components
  /map                  — MapLibre wrapper, markers, popups
  /panel                — detail panel, filter sidebar
  /ui                   — shadcn primitives
/lib
  /supabase             — client, types
  /typesense            — search client
/styles
  globals.css
/data
  seed/                 — CSV seeds for MVP
  scripts/              — geocode, import scripts
