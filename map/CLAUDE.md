# Installer Notes — system map (catalog)

A walkable graph of this repo for agents that will edit it: the nouns (tables, modules), their
universe, and — later slices — how they move and what a change hits. `src/` and the schema snapshot
`supabase/introspect_schema_response.json` are the truth; the map cites them. Slice 1 (catalog) as
of 2026-09-29, branch `main`. No cards yet: `objects/_index.md` holds one stub line per noun.

## Universes

| Universe | Meaning here |
|---|---|
| live | in the live Supabase project and read or written by a `.from('…')` call under `src/` |
| leftover | present in the schema snapshot, no `src/` reads (none found in slice 1) |
| ghost | planned, not wired: the native app / `apps/web` monorepo plan, and the one migration written but never applied |

## SHARED — the two nouns that are not ours

`profiles` and `vehicle_catalog` belong to **SnapTip** (`~/projects/tintfam-business-management`, migrations
`001_profiles.sql`, `039_vehicle_catalog.sql`; card `docs/map/objects/platform/shared-auth-tintnotes.md`); the Supabase
project and `auth.users` are shared. This repo reads both and updates its own `profiles` row, never migrates either.

## Name collisions (say both, once)

- **Installer Notes = Tint Notes = PPF Notes** — one app; `src/proxy.ts` sets `x-site-type` from
  the hostname, which picks copy and the `note_type` on a submitted note. Branding, not a boundary.
- **SnapTip** = the other app on this database, not this repo.
- **"Rating" ≠ "difficulty".** `installer_note_ratings` = stars a reader gives a note;
  `installer_note_difficulty` / `installer_note_ppf_difficulty` = the author's per-panel scores.
- **"Report" is two tables.** `installer_note_reports` flags a note; `installer_rating_reports` flags a rating.
- **"Notification"** = an `installer_notifications` row + Resend email (no push). **"Campaign"** = the
  `email_*` drip (lists → campaigns → steps → sends), fired by the Vercel cron, not by a user.

## Clusters — where to look

| Cluster | Holds | Stubs in |
|---|---|---|
| notes | installer_notes and its children: media, difficulty (tint / PPF), ratings, audits, reports | `objects/_index.md` § notes |
| people | profiles (SHARED), notifications + preferences, admin log, auth | § people |
| vehicles | vehicle_catalog (SHARED), vehicle_info_requests | § vehicles |
| email | email lists, members, campaigns, steps, sends, unsubscribes | § email |

## Route by question

| Question | Go to |
|---|---|
| What is X? | `objects/_index.md` — find the stub, follow its source path |
| How to walk / what stub, verified, stale mean | `CONTEXT.md` |
| Allowed node types and labels | `_meta/schema.md` |
| Writing a card | copy `_templates/object.md` or `process.md` |
| What else moves if I change X? / RLS truth per table | `effects/` not built yet (slice 4) / `../supabase/introspect_schema_response.json` (2026-05-19 snapshot) |
