# Installer Notes

Installer Notes (aka Tint Notes / PPF Notes) — installers share per-vehicle tint/PPF install notes, per-panel difficulty,
photos, ratings and a leaderboard. Live on Vercel; one deploy serves tintnotes.com / ppfnotes.com / installernotes.com, branded
by hostname in `src/proxy.ts` (`x-site-type` → copy + `note_type`; branding only, NOT a security boundary). Next.js 16 App Router
+ React 19, Supabase (auth + Postgres + Storage), Resend, Anthropic SDK (note moderation). Server components + actions throughout.

## SHARED DATABASE — read before any schema, RLS or profile change

This Supabase project is **shared with SnapTip** (`~/projects/tintfam-business-management`, the paid sister app): one
`auth.users`, one `profiles` (SnapTip `001_profiles.sql`; our `installer_role` user/mod/admin column lives on it), one
`vehicle_catalog` (SnapTip `039_vehicle_catalog.sql`). SnapTip's card: `docs/map/objects/platform/shared-auth-tintnotes.md`.
Per `supabase/migrations/README.md` we own only `installer_*` / `email_*` / `vehicle_info_requests`; never reconstruct the
baseline or touch a shared object without coordinating. Schema truth = `supabase/introspect_schema_response.json` (2026-05-19
snapshot, SnapTip tables included). No credentials live locally — migrations are pasted into the Supabase Dashboard SQL editor.

## Routing

| Task | Go to |
|---|---|
| Pages / routes | `src/app/` (feed, search, vehicle/[groupId], submit, profile, leaderboard, admin, notifications) |
| Server actions (notes, ratings, profiles, requests, settings, admin, auth) | `src/actions/` |
| Email + drip campaigns | `src/lib/email/`, `src/app/api/cron/campaign-drip/` (Vercel cron, daily 19:00 UTC, `CRON_SECRET` bearer), webhook `src/app/api/webhooks/resend/` |
| AI note moderation | `src/app/api/moderate-note/` |
| Ratings audit | `src/app/api/admin/audit-ratings/` |
| Schema, RLS, shared-DB rules | `supabase/` — `migrations/README.md` first |
| Native app plan (paused at Phase 0, ghost) | `docs/planning/dev-plan-native.md` |
| What is X / what else moves if I change X (system map) | `map/CLAUDE.md` |

## Env vars (names only — values in Vercel and `.env.local`, never committed; template `.env.example`)

`ANTHROPIC_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.

## Hard rules

- Moderation writes on another user's row: `adminClient()` + assert a returned row (`.select().maybeSingle()`,
  `src/actions/admin.ts`) — the user-scoped client matches zero rows under RLS and reports success silently (fixed 2026-08-21).
- Several "Mods …" RLS policies are `USING(true)` (ratings delete, audits, admin log, notifications insert); the app
  relies on server/UI gating. Hardening pass pending — never widen them.
