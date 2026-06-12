-- Gobble Maps — auth hardening
-- 0004_auth_hardening.sql

-- ── DB-backed auth throttle (replaces per-instance in-memory rate limit) ──
-- Service-role only: RLS enabled with NO policies so it is reachable solely
-- via createAdminClient(). Keys: 'login:<username>', 'pin:<userId>',
-- 'checkuser:<username>'.
create table public.auth_throttle (
  key text primary key,
  fails integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.auth_throttle enable row level security;

-- ── Session token versioning (forces logout everywhere on PIN change) ────
alter table public.profiles
  add column if not exists token_version integer not null default 0;
