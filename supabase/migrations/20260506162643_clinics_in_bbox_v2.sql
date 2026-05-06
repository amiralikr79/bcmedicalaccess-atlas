-- Extend clinics_in_bbox to return everything the filter UI needs
-- (address, hours, accepting_new) so the bbox query is a single round-trip
-- and the client can filter purely in memory.

drop function if exists public.clinics_in_bbox(
  double precision, double precision, double precision, double precision, text
);

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
  address_line text,
  city text,
  postal_code text,
  phone text,
  website text,
  hours_summary text,
  hours_json jsonb,
  accepting_new boolean,
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
    c.address_line,
    c.city,
    c.postal_code,
    c.phone,
    c.website,
    c.hours_summary,
    c.hours_json,
    c.accepting_new,
    ST_Y(c.location::geometry) as lat,
    ST_X(c.location::geometry) as lng
  from public.clinics c
  where c.location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and (segment_filter is null or c.segment = segment_filter);
$$;

grant execute on function public.clinics_in_bbox(
  double precision, double precision, double precision, double precision, text
) to anon, authenticated, service_role;
