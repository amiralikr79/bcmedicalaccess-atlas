-- BC Clinic Atlas — initial schema
-- Single table: clinics, with PostGIS point geography.

create extension if not exists postgis;
create extension if not exists pg_trgm;

-- ─────────────────────────────────────────────────────────────
-- segment taxonomy is validated via CHECK (text + check is easier
-- to extend than a Postgres enum when adding values later).
-- ─────────────────────────────────────────────────────────────

create table public.clinics (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  segment         text not null,
  subsegment      text,
  address_line    text,
  city            text,
  province        text not null default 'BC',
  postal_code     text,
  location        geography(Point, 4326) not null,
  phone           text,
  website         text,
  hours_json      jsonb,
  hours_summary   text,
  accepting_new   boolean,
  wait_estimate   text,
  services        text[]      not null default '{}',
  languages       text[]      not null default '{}',
  accessibility   text[]      not null default '{}',
  parking         text,
  transit_notes   text,
  verified_at     timestamptz,
  source          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint clinics_segment_check check (segment in (
    'primary_care','diagnostic','specialist','dental','vision',
    'mental_health','allied_health','naturopathic','aesthetic',
    'reproductive_health','pediatric','travel_health','cannabis_pain',
    'telehealth','private_surgical','pharmacy_clinical'
  ))
);

-- spatial index for radius / viewport queries
create index clinics_location_gix on public.clinics using gist (location);

-- segment / city filters
create index clinics_segment_idx on public.clinics (segment);
create index clinics_city_idx    on public.clinics (city);

-- trigram index for fast ILIKE / similarity name search
create index clinics_name_trgm_idx on public.clinics using gin (name gin_trgm_ops);

-- updated_at maintenance
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger clinics_set_updated_at
  before update on public.clinics
  for each row execute function public.tg_set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Row level security: public-read, no public-write.
-- The seed script uses the service_role key and bypasses RLS.
-- ─────────────────────────────────────────────────────────────

alter table public.clinics enable row level security;

create policy "clinics public read"
  on public.clinics for select
  to anon, authenticated
  using (true);
