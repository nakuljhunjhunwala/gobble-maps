-- Gobble Maps — initial schema
-- 0001_init.sql

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists citext;
create extension if not exists pgcrypto;

-- ── Enums ────────────────────────────────────────────────────
create type public.place_type as enum ('restaurant', 'cafe', 'club', 'bakery', 'street', 'brewery');
create type public.place_status as enum ('draft', 'published', 'permanently_closed');
create type public.filter_category as enum ('cuisine', 'vibe', 'area');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'brunch', 'party');
create type public.saved_kind as enum ('been_there', 'wishlist');
create type public.report_status as enum ('open', 'resolved');
create type public.notification_type as enum ('new_place', 'area_based', 'manual');
create type public.notification_status as enum ('sent', 'scheduled');
create type public.tbt_status as enum ('pending_visit', 'visited');
create type public.analytics_event_type as enum ('app_open', 'map_open', 'place_view', 'place_share', 'place_save', 'filter_apply', 'search', 'signup');

-- ── Tables ───────────────────────────────────────────────────

-- Admin allowlist (rows reference auth.users)
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  created_at timestamptz not null default now()
);

create table public.filter_options (
  id uuid primary key default gen_random_uuid(),
  category public.filter_category not null,
  label text not null check (char_length(label) between 1 and 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  unique (category, label)
);

create index filter_options_category_idx on public.filter_options (category, sort_order);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  type public.place_type not null,
  budget integer not null default 1 check (budget between 1 and 5),
  area_id uuid references public.filter_options (id) on delete set null,
  station text,
  address text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  phone text,
  instagram text,
  website text,
  -- {"mon":{"open":"12:30","close":"23:30"},"tue":null,...} keys mon..sun, null = closed
  hours jsonb not null default '{}'::jsonb,
  meals public.meal_slot[] not null default '{}',
  visited boolean not null default false,
  food_rating numeric(2,1) check (food_rating between 1 and 5),
  service_rating numeric(2,1) check (service_rating between 1 and 5),
  ambience_rating numeric(2,1) check (ambience_rating between 1 and 5),
  avg_rating numeric(2,1) generated always as (
    case
      when food_rating is not null and service_rating is not null and ambience_rating is not null
        then round((food_rating + service_rating + ambience_rating) / 3.0, 1)
      else null
    end
  ) stored,
  must_try text[] not null default '{}',
  curator_note text,
  best_time text,
  live_music boolean not null default false,
  board_games boolean not null default false,
  pure_veg boolean not null default false,
  status public.place_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_status_idx on public.places (status);
create index places_area_id_idx on public.places (area_id);
create index places_type_idx on public.places (type);

create table public.place_tags (
  place_id uuid not null references public.places (id) on delete cascade,
  filter_option_id uuid not null references public.filter_options (id) on delete cascade,
  primary key (place_id, filter_option_id)
);

create index place_tags_filter_option_id_idx on public.place_tags (filter_option_id);

create table public.place_photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0
);

create index place_photos_place_id_idx on public.place_photos (place_id, sort_order);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique check (char_length(username::text) between 1 and 40),
  pin_hash text not null,
  mobile text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz
);

create table public.saved_places (
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  kind public.saved_kind not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id, kind)
);

create index saved_places_place_id_idx on public.saved_places (place_id, kind);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_public boolean not null default false,
  share_slug text unique,
  created_at timestamptz not null default now()
);

create index lists_user_id_idx on public.lists (user_id);

create table public.list_places (
  list_id uuid not null references public.lists (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, place_id)
);

create index list_places_place_id_idx on public.list_places (place_id);

create table public.issue_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places (id) on delete set null,
  place_name text not null,
  reporter_username text not null,
  text text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index issue_reports_status_idx on public.issue_reports (status, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type public.notification_type not null,
  message text not null check (char_length(message) between 1 and 500),
  place_id uuid references public.places (id) on delete set null,
  segment_area_id uuid references public.filter_options (id) on delete set null,
  status public.notification_status not null default 'sent',
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipient_count integer,
  created_at timestamptz not null default now()
);

create index notifications_created_at_idx on public.notifications (created_at desc);

create table public.to_be_tried (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  address text,
  notes text,
  status public.tbt_status not null default 'pending_visit',
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_type public.analytics_event_type not null,
  user_id uuid references public.profiles (id) on delete set null,
  place_id uuid references public.places (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_type_created_idx on public.analytics_events (event_type, created_at);
create index analytics_events_created_idx on public.analytics_events (created_at);
create index analytics_events_place_id_idx on public.analytics_events (place_id);

-- ── Functions & triggers ─────────────────────────────────────

-- updated_at touch trigger on places
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger places_touch_updated_at
  before update on public.places
  for each row
  execute function public.touch_updated_at();

-- When a place transitions to 'permanently_closed', remove it from all
-- user lists (PRD §11: closed places are removed from user lists automatically).
create or replace function public.handle_place_permanently_closed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.saved_places where place_id = new.id;
  delete from public.list_places where place_id = new.id;
  return new;
end;
$$;

create trigger places_permanently_closed_cleanup
  after update of status on public.places
  for each row
  when (new.status = 'permanently_closed' and old.status is distinct from new.status)
  execute function public.handle_place_permanently_closed();

-- Admin allowlist check. SECURITY DEFINER so RLS policies can consult the
-- admins table without recursive policy evaluation.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ── Row Level Security ───────────────────────────────────────

alter table public.admins enable row level security;
alter table public.filter_options enable row level security;
alter table public.places enable row level security;
alter table public.place_tags enable row level security;
alter table public.place_photos enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_places enable row level security;
alter table public.lists enable row level security;
alter table public.list_places enable row level security;
alter table public.issue_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.to_be_tried enable row level security;
alter table public.analytics_events enable row level security;

-- admins: admin-only
create policy "admins_admin_all" on public.admins
  for all using (public.is_admin()) with check (public.is_admin());

-- places: public read of published, admin everything
create policy "places_public_read" on public.places
  for select using (status = 'published' or public.is_admin());
create policy "places_admin_insert" on public.places
  for insert with check (public.is_admin());
create policy "places_admin_update" on public.places
  for update using (public.is_admin()) with check (public.is_admin());
create policy "places_admin_delete" on public.places
  for delete using (public.is_admin());

-- filter_options: public read of active, admin everything
create policy "filter_options_public_read" on public.filter_options
  for select using (is_active or public.is_admin());
create policy "filter_options_admin_insert" on public.filter_options
  for insert with check (public.is_admin());
create policy "filter_options_admin_update" on public.filter_options
  for update using (public.is_admin()) with check (public.is_admin());
create policy "filter_options_admin_delete" on public.filter_options
  for delete using (public.is_admin());

-- place_photos: public read, admin writes
create policy "place_photos_public_read" on public.place_photos
  for select using (true);
create policy "place_photos_admin_insert" on public.place_photos
  for insert with check (public.is_admin());
create policy "place_photos_admin_update" on public.place_photos
  for update using (public.is_admin()) with check (public.is_admin());
create policy "place_photos_admin_delete" on public.place_photos
  for delete using (public.is_admin());

-- place_tags: admin-only
create policy "place_tags_admin_all" on public.place_tags
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles: admin-only
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- saved_places: admin-only
create policy "saved_places_admin_all" on public.saved_places
  for all using (public.is_admin()) with check (public.is_admin());

-- lists: admin-only
create policy "lists_admin_all" on public.lists
  for all using (public.is_admin()) with check (public.is_admin());

-- list_places: admin-only
create policy "list_places_admin_all" on public.list_places
  for all using (public.is_admin()) with check (public.is_admin());

-- issue_reports: admin-only
create policy "issue_reports_admin_all" on public.issue_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications: admin-only
create policy "notifications_admin_all" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- to_be_tried: admin-only
create policy "to_be_tried_admin_all" on public.to_be_tried
  for all using (public.is_admin()) with check (public.is_admin());

-- analytics_events: anyone can insert, only admins can read
create policy "analytics_events_anon_insert" on public.analytics_events
  for insert to anon, authenticated with check (true);
create policy "analytics_events_admin_select" on public.analytics_events
  for select using (public.is_admin());
create policy "analytics_events_admin_update" on public.analytics_events
  for update using (public.is_admin()) with check (public.is_admin());
create policy "analytics_events_admin_delete" on public.analytics_events
  for delete using (public.is_admin());

-- ── Storage ──────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('place-photos', 'place-photos', true)
on conflict (id) do nothing;

create policy "place_photos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'place-photos');
create policy "place_photos_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'place-photos' and public.is_admin());
create policy "place_photos_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'place-photos' and public.is_admin())
  with check (bucket_id = 'place-photos' and public.is_admin());
create policy "place_photos_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'place-photos' and public.is_admin());
