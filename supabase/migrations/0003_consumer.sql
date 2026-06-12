-- Gobble Maps — consumer app prerequisites
-- 0003_consumer.sql

-- The consumer app reads cuisine/vibe tags of published places anonymously.
create policy "place_tags_public_read" on public.place_tags
  for select using (
    exists (
      select 1 from public.places p
      where p.id = place_tags.place_id and p.status = 'published'
    )
    or public.is_admin()
  );

-- Users can opt out of push notifications from their profile (PRD §8).
alter table public.profiles
  add column if not exists notif_opt_in boolean not null default true;
