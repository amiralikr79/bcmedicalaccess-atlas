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
[paste the CSS variable block from the prompting guide here]

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
