# Gooble Foods

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) base project wired to Supabase.

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Health check at [/api/health](http://localhost:3000/api/health) verifies the Supabase connection.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

## Supabase Clients

Built on `@supabase/ssr` (official SSR pattern):

- `src/lib/supabase/client.ts` — browser client for Client Components
- `src/lib/supabase/server.ts` — server client for Server Components, Server Actions, and Route Handlers (create per request)
- `src/lib/supabase/proxy.ts` + `src/proxy.ts` — refreshes the auth session on every request (Next.js 16 proxy, formerly middleware)

## Included Packages

- **Supabase**: `@supabase/supabase-js`, `@supabase/ssr`
- **Forms & validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **UI utilities**: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` (shadcn/ui-ready — run `npx shadcn@latest init` to add components)
- `src/lib/utils.ts` exports the standard `cn()` class-merge helper

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```
