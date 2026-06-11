# Gobble Admin Panel — Implementation Brief (shared agent context)

Read this fully before writing any code. It is the single source of truth for conventions.

## What we're building
The Gobble Maps admin panel (PRD: `/prd.md`, sections 10–11) as a real Next.js app backed by Supabase, by PORTING the working prototype in `design/` (~90% code reuse). The prototype files are the design spec — match their markup, class names, copy, and behavior exactly unless this brief says otherwise.

- `design/Gobble Admin Panel.html` — admin shell HTML + ALL CSS (gb-* and ad-* classes)
- `design/gobble/admin-core.jsx` — shell, sidebar, StatCard, charts, shared admin atoms
- `design/gobble/admin-ops.jsx` — Dashboard, Filters, Users, Reports, Notifications, TBT views
- `design/gobble/admin-places.jsx` — Places list, place editor modal, preview modal
- `design/gobble/components.jsx` — `GIcon` icon set (port lives at `src/components/icons.tsx`)
- `design/gobble/admin-data.js`, `design/gobble/data.js` — sample data shapes

## Stack & conventions (MUST follow)
- Next.js 16.2.9 App Router, TypeScript, `src/` dir, `@/*` alias. Plain JS allowed nowhere — TSX/TS only.
- Next 16: `await cookies()`, `await searchParams` (they are Promises). Middleware is `src/proxy.ts` (already exists — don't touch).
- Tailwind v4 is available, but MOST styling comes from the ported prototype CSS in `src/app/admin/admin.css` (real classnames `gb-btn`, `ad-card`, etc.). Don't rewrite working CSS into Tailwind. Use `cn()` from `@/lib/utils` when composing classes.
- Supabase clients (already exist):
  - Server Components / actions: `const supabase = await createClient()` from `@/lib/supabase/server`
  - Browser: `createClient()` from `@/lib/supabase/client`
  - Service-role (server-only scripts/queries that bypass RLS): `@/lib/supabase/admin` (env `SUPABASE_SECRET_KEY` — NEVER import in client components, never log it)
- Mutations: server actions in `actions.ts` next to each route page, validated with zod schemas from `@/lib/admin/schemas`, then `revalidatePath(...)`. Actions return `{ ok: true } | { ok: false, error: string }` — no throwing for expected failures.
- Data fetching: section `page.tsx` is a SERVER component that fetches via helpers in `@/lib/admin/queries` and passes plain props into ONE `"use client"` manager component per section.
- Types: DB row types in `@/lib/types.ts`. Use them; don't redeclare.
- Toasts: `useToast()` from `@/components/ui/toast` — exact message copy from the prototype.
- Icons: `<Icon name="..." size={16} />` from `@/components/icons` (ported GIcon set, same names: home, pinOutline, sliders, user, flag, share, list, search, edit, x, check, plus, fork, coffee, cocktail, cake, cart, beer, info, clock, phone, instagram, lock, globe, train, music, dice, leaf, logout, chevL/R/D, heart, bookmark, map, nav, arrowUR, offline).

## Design tokens (defined in globals.css @theme and admin.css :root)
--gb-deep:#1D7FB8 --gb-sky:#3DA5DE --gb-sky-50:#EAF5FC --gb-sky-100:#D7ECF8 --gb-bg:#F4F8FB --gb-ink:#14313F --gb-mut:#5E7C8C --gb-line:#E2EBF1 --gb-line2:#C2D2DC
Badge tones: green #E8F5EC/#15803D, red #FBEAE8/#B4514B, amber #FFF4DE/#8A6116, grey #EFF3F6/#5E7C8C, ink #14313F/#fff.
Fonts: Albert Sans (body, var(--font-albert)) + Bricolage Grotesque (display, var(--font-bricolage)) — loaded via next/font in root layout.
Breakpoints from prototype CSS: 980px (stat grid 4→2), 880px (sidebar→top nav), 560px.

## Database (applied via supabase/migrations/0001_init.sql + 0002_dashboard.sql)
Enums: place_type(restaurant|cafe|club|bakery|street|brewery), place_status(draft|published|permanently_closed), filter_category(cuisine|vibe|area), meal_slot(breakfast|lunch|dinner|brunch|party), saved_kind(been_there|wishlist), report_status(open|resolved), notification_type(new_place|area_based|manual), notification_status(sent|scheduled), tbt_status(pending_visit|visited), analytics_event_type(app_open|map_open|place_view|place_share|place_save|filter_apply|search|signup).

Tables: admins(user_id,email) · filter_options(id,category,label,sort_order,is_active) · places(id,name,type,budget,area_id→filter_options,station,address,lat,lng,phone,instagram,website,hours jsonb,meals[],visited,food_rating,service_rating,ambience_rating,avg_rating GENERATED,must_try[],curator_note,best_time,live_music,board_games,pure_veg,status,created_at,updated_at) · place_tags(place_id,filter_option_id) · place_photos(id,place_id,storage_path,sort_order) · profiles(id,username,pin_hash,mobile,created_at,last_active_at) · saved_places(user_id,place_id,kind) · lists(id,user_id,name,is_public,share_slug) · list_places · issue_reports(id,place_id,place_name,reporter_username,text,status,created_at,resolved_at) · notifications(id,type,message,place_id,segment_area_id,status,scheduled_for,sent_at,recipient_count) · to_be_tried(id,name,address,notes,status,created_at) · analytics_events(id,event_type,user_id,place_id,metadata,created_at).

`hours` jsonb shape: `{"mon":{"open":"12:30","close":"23:30"},"tue":null,...}` (null = closed; keys mon..sun; close may be past midnight like "01:30").
Dashboard RPC: `admin_dashboard(p_from timestamptz) returns jsonb` — admin-only, returns all dashboard numbers in one call.
RLS: `is_admin()` fn; public read on published places / active filter_options / place_photos; everything else admin-only; analytics_events anon-insert.
Storage: public bucket `place-photos`, paths `<place_id>/<uuid>.jpg`; admin-session uploads from the browser pass storage RLS.

## Auth model
- Admin signs in at `/admin/login` (email+password via Supabase auth). Allowlist check: row in `admins` for `auth.uid()`. Non-admins are signed out with an error.
- `(panel)` layout re-checks session + allowlist on every request and redirects to `/admin/login`.
- Sidebar shows open-reports count badge (count of issue_reports status='open'), passed from the layout server component.

## Route map & FILE OWNERSHIP (do not write outside your assigned files)
```
src/app/admin/login/page.tsx + actions.ts
src/app/admin/(panel)/layout.tsx
src/app/admin/(panel)/page.tsx                       # Dashboard
src/app/admin/(panel)/places/page.tsx + actions.ts
src/app/admin/(panel)/filters/page.tsx + actions.ts
src/app/admin/(panel)/users/page.tsx + actions.ts
src/app/admin/(panel)/reports/page.tsx + actions.ts
src/app/admin/(panel)/notifications/page.tsx + actions.ts
src/app/admin/(panel)/to-be-tried/page.tsx + actions.ts
src/app/admin/admin.css                              # ported prototype CSS
src/lib/admin/queries.ts · src/lib/admin/schemas.ts · src/lib/types.ts
src/lib/supabase/admin.ts
src/components/icons.tsx
src/components/ui/{modal,toast,confirm-dialog,segmented,field}.tsx
src/components/admin/<section>-*.tsx                 # one prefix per section
scripts/seed.ts
```

## Porting rules
1. Keep prototype markup structure and class names; convert JSX→TSX (type the props), `class`→`className` already fine in JSX.
2. Replace in-memory state (`useState` data arrays, localStorage) with props from server + server-action calls; KEEP local UI state (open modals, tabs, search text, form fields).
3. Keep exact user-facing copy: toasts, empty states, confirm dialogs, error "Please upload at least 4 photos before publishing."
4. Currency/number format: `toLocaleString('en-IN')`.
5. Dates display like the prototype: "12 Jan 2026" → format DB timestamps with `Intl.DateTimeFormat('en-GB', {day:'2-digit',month:'short',year:'numeric'})`-style helper in queries.ts.
6. Photos: render via Supabase public URL: `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/place-photos/<storage_path>` (helper `photoUrl()` in queries.ts).
7. After your files compile (`npx tsc --noEmit` passes for your files), you're done — final build/integration happens later. Do NOT run `npm run dev` or the seed.
