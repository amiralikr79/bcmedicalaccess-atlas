-- clinics_in_bbox(min_lng, min_lat, max_lng, max_lat, segment_filter)
--
-- Returns clinic rows whose geography is inside the WGS84 bounding box,
-- with explicit lat/lng columns so callers don't have to parse PostGIS WKB.
-- Uses the GIST index on `location` automatically via the && operator.

create or replace function public.clinics_in_bbox(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision,
  segment_filter text default null
)
returns table (
  id uuid,
  name text,
  slug text,
  segment text,
  subsegment text,
  city text,
  lat double precision,
  lng double precision
)
language sql
stable
security invoker
as $$
  select
    c.id,
    c.name,
    c.slug,
    c.segment,
    c.subsegment,
    c.city,
    ST_Y(c.location::geometry) as lat,
    ST_X(c.location::geometry) as lng
  from public.clinics c
  where c.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and (segment_filter is null or c.segment = segment_filter);
$$;

grant execute on function public.clinics_in_bbox(
  double precision, double precision, double precision, double precision, text
) to anon, authenticated, service_role;
