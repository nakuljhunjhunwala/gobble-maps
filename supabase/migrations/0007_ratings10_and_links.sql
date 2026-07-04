-- Gobble Maps — ratings on a /10 scale + Zomato/Swiggy link columns.
--
-- Ratings were numeric(2,1) CHECK between 1 and 5, with avg_rating a STORED
-- GENERATED column. This migration:
--   * rescales existing values ×2 (4.5/5 -> 9.0/10) so live data reads
--     correctly on the new scale (no data lost — a backup table is kept),
--   * widens the columns to numeric(3,1) (10.0 needs 3 digits),
--   * relaxes the CHECKs to 1..10,
--   * re-derives the generated avg_rating on the new scale,
--   * adds nullable zomato/swiggy text columns.
-- Wrapped in a transaction so it applies all-or-nothing.

begin;

-- 1. Safety net: snapshot the pre-migration ratings (restore source if needed).
create table if not exists public.places_ratings_backup_0007 as
  select id, food_rating, service_rating, ambience_rating
  from public.places;

-- 2. Drop the generated avg column (it depends on the three source columns).
alter table public.places drop column if exists avg_rating;

-- 3. Widen the source columns and drop the old 1..5 CHECK constraints.
alter table public.places
  alter column food_rating type numeric(3, 1),
  alter column service_rating type numeric(3, 1),
  alter column ambience_rating type numeric(3, 1);

alter table public.places drop constraint if exists places_food_rating_check;
alter table public.places drop constraint if exists places_service_rating_check;
alter table public.places drop constraint if exists places_ambience_rating_check;

-- 4. Rescale existing 1..5 values to 1..10. Nulls stay null.
update public.places set
  food_rating = round(food_rating * 2, 1),
  service_rating = round(service_rating * 2, 1),
  ambience_rating = round(ambience_rating * 2, 1)
where food_rating is not null
   or service_rating is not null
   or ambience_rating is not null;

-- 5. Re-add CHECKs on the /10 scale.
alter table public.places
  add constraint places_food_rating_check check (food_rating between 1 and 10),
  add constraint places_service_rating_check check (service_rating between 1 and 10),
  add constraint places_ambience_rating_check check (ambience_rating between 1 and 10);

-- 6. Re-add the generated average on the /10 scale (same expression).
alter table public.places
  add column avg_rating numeric(3, 1) generated always as (
    case
      when food_rating is not null and service_rating is not null and ambience_rating is not null
        then round((food_rating + service_rating + ambience_rating) / 3.0, 1)
      else null
    end
  ) stored;

-- 7. Zomato / Swiggy links (nullable, like instagram/website).
alter table public.places
  add column if not exists zomato text,
  add column if not exists swiggy text;

commit;
