# map/ — how to walk it

This shelf is a **system map** (ICM sixth form): a record library of nouns, later a short
shelf of verbs, later a change-impact index. Slice 1 only — the catalog. Nothing here tells you
to implement anything; `src/` and the schema snapshot are the truth and every line cites them.

## Walk

1. `CLAUDE.md` — the catalog: universes, the two SHARED nouns, name collisions, clusters. Read first.
2. `objects/_index.md` — one line per noun: `- [ ] noun — cluster — universe — status — source path`.
   `[ ]` + `stub` = no card, go to the source path. `[x]` + `verified` = a card exists at
   `objects/<cluster>/<slug>.md` with a date, commit and `path:line` citations. `stale` = card exists, trust source.
3. A card (when one exists) — one sentence, why this shape, shape with citations, connected-to,
   Hits / Does not hit, surfaces, see. Copy `_templates/object.md`; never write one blank.

Load only what the question needs: catalog + index + one card, not the folder.

## Universes

live / leftover / ghost as defined in `CLAUDE.md`. A table is live when `src/` has a
`.from('<table>')` call (`grep -rn "\.from('<table>')" src`) and the snapshot lists it. The
schema is not version-controlled here — the snapshot `supabase/introspect_schema_response.json`
(2026-05-19, Postgres 17.6) is the baseline; re-run `supabase/introspect_schema.sql` to refresh it
before trusting any RLS claim.

## Status is what exists

- A noun is *catalogued* when it has a line in `objects/_index.md`.
- A noun is *carded* when `objects/<cluster>/<slug>.md` exists; the index line flips to `[x]`.
- `processes/` and `effects/` do not exist yet on purpose — empty shelves are a failure mode.

## Processes to write later (slice 3 — do not create files now)

Only movements that actually run:

- **submit note → moderate** — `src/actions/notes.ts` (insert note + difficulty + media) → `src/app/api/moderate-note/route.ts` (Anthropic) → status; campaign events fire on submit (`src/lib/email/campaign-events.ts`).
- **rate → audit** — `src/actions/ratings.ts` → `installer_note_ratings`; `src/app/api/admin/audit-ratings/route.ts` writes `installer_rating_audits`.
- **campaign drip** — Vercel cron (`vercel.json`, daily 19:00 UTC) → `src/app/api/cron/campaign-drip/route.ts` → Resend → webhook `src/app/api/webhooks/resend/route.ts` updates `email_campaign_sends`; `src/app/api/unsubscribe/route.ts`.
- **notify** — `src/actions/notifications.ts` writes `installer_notifications` (gated by `installer_notification_preferences`) + Resend email via `src/lib/email/send.ts`.
- **request vehicle info** — `src/actions/requests.ts` → `vehicle_info_requests` (service-role only) + email.

## Human check

Billy reads `objects/_index.md` once before slice 2 starts: are the four clusters how he asks
questions, and is anything marked live that SnapTip actually owns?
