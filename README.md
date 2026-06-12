# Gobble Maps

Personally curated food & nightlife guide for Mumbai — consumer PWA + founder admin panel in one Next.js 16 app, backed by Supabase.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys (see Environment)
npm run dev
```

- **Consumer app**: [http://localhost:3000](http://localhost:3000) — home, map, search, place detail, profile/lists
- **Admin panel**: [http://localhost:3000/admin](http://localhost:3000/admin) — login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`
- Health check: `/api/health`

## What's here

**Consumer (mobile-first PWA, installable, offline pin layer)**
- Time/day-based home sections (breakfast → brunch → party per PRD FR-1)
- Real MapLibre + OpenStreetMap map with custom category pins (visited/unvisited colors, Been-There ticks)
- Search (incl. "permanently closed" messaging), 9-group filter sheet
- Place detail: photo gallery, curator ratings, must-try dishes, open-now logic, directions, share
- Optional auth: username + 6-digit PIN (mobile stored for recovery; SMS OTP deferred), soft login prompts
- Been There / Can't Wait / custom lists with public share links (`/l/<slug>`)
- Issue reporting → lands in the admin queue

**Admin (`/admin`, responsive: sidebar ⇄ top-nav at 880px)**
- Dashboard: live KPIs (DAU/WAU/MAU, map opens, shares), charts, top-10s — all computed from real analytics events
- Places: full CRUD, draft → publish (4-photo minimum), photo upload to Storage, MapLibre location picker, per-day hours, preview-as-user, permanently-closed flow
- Filters & Categories, Users, Issue Reports, Notifications (composer + history; delivery wiring later), To Be Tried pipeline

## Architecture

- `src/app/(app)/…` consumer routes · `src/app/admin/…` admin routes · `src/app/l/[slug]` public lists
- `src/lib/consumer/*` consumer data/auth/session · `src/lib/admin/*` admin queries/schemas
- `src/lib/supabase/{client,server,admin}.ts` — browser / SSR / service-role Supabase clients
- `supabase/migrations/*.sql` — schema, RLS (`is_admin()` allowlist), dashboard RPC, auth throttle
- `scripts/seed.ts` — idempotent seed (places, photos, users, analytics): `npx tsx scripts/seed.ts`
- `design/` — original Claude Design prototype handoff (reference, excluded from lint)
- `public/sw.js` — hand-rolled service worker (tile/photo caching, offline fallback)

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public browser key |
| `SUPABASE_SECRET_KEY` | Server-only service key (seed, consumer auth) — never expose |
| `AUTH_SECRET` | HMAC key for consumer session cookies |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin panel login (bootstrapped by seed) |

## Scripts

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
npm run db:seed  # seed database (or: npx tsx scripts/seed.ts)
supabase db push # apply migrations (project must be linked)
```

## Deferred (post-V1 wiring)

- SMS OTP for PIN recovery (needs Twilio/MSG91 + DLT sender ID)
- Real web-push delivery (composer + history already persist)
- Google Maps swap-in if ever needed (plain lat/lng stored)
