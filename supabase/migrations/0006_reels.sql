-- Gobble Maps — multiple reel links per place (Instagram / YouTube / other).
-- Ordered list of URLs, like must_try. Covered by existing places RLS.

alter table public.places
  add column if not exists reels text[] not null default '{}';
