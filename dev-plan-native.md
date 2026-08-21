# Installer Notes — Native App (React Native / Expo) Dev Plan

> Canonical, session-resumable build plan. Progress is tracked by the `[ ]` / `[x]`
> checkboxes below. Update **§0 Session Context** and **§8 Progress Log** at the end
> of every working session so the next session can resume cold.

---

## 0. Session Context — READ THIS FIRST · KEEP UPDATED

- **Last updated:** 2026-05-19
- **Overall status:** Phase 0 code complete (media DELETE-policy migration + de-service-roled
  `notes.ts`). **Migration NOT yet applied to the live DB.** No app code scaffolded yet.
- **Current phase:** Phase 0 finishing (apply migration) → Phase 1 (Monorepo Foundation;
  tooling decided: **npm workspaces**)
- **Next concrete action:** Apply
  `supabase/migrations/20260519170000_installer_note_media_delete_policy.sql` to the live DB
  (Dashboard → SQL Editor), then start Phase 1: create the npm-workspaces root and move the
  Next.js app into `apps/web` (keep Vercel green).
- **How to resume a cold session:**
  1. Read §0–§3 here (self-contained — no need to re-derive architecture).
  2. Scan the checklist (§4); the first unchecked `[ ]` box is the resume point.
  3. Cross-check the live task list (Task tool, tasks #1–#11) — IDs are referenced inline.
- **Key artifacts:**
  - Memory: `~/.claude/projects/-home-frickinstein-projects-installer-notes/memory/`
    (`project-native-app-initiative.md` holds the verified RLS findings).
  - DB schema dump: `supabase/introspect_schema.sql` (re-runnable) →
    `supabase/introspect_schema_response.json` (last result, Postgres 17.6).
  - This file is the source of truth for build progress.
- **Hard blockers right now:** none. Phase 1 and Phase 0's migration boxes need no
  external access.

---

## 1. Goal & Scope

- **Target:** React Native / **Expo**, **iOS + Android** together.
- **v1 scope ("Core + accounts"):** auth, vehicle search, read notes/difficulty/
  photos/ratings, create & edit own notes (+photos), profiles + leaderboard,
  notifications (in-app + push), notification settings, offline cache.
- **Out of scope for v1:** admin dashboard, email-campaign tooling, moderation UI.

---

## 2. Architecture (decided — do not re-litigate without a logged decision)

- **Monorepo:** `apps/web` (existing Next.js, unchanged on Vercel), `apps/mobile`
  (Expo Router), `packages/core` (generated DB types + framework-agnostic
  data-access layer shared by web + mobile).
- **Data:** mobile talks to **Supabase directly** with the public anon key + user
  JWT. RLS is verified enabled & correctly scoped for the entire v1 scope.
- **Server endpoints (thin, only where unavoidable):**
  - AI moderation (Anthropic) + campaign events on note submit.
  - Push send on `installer_notifications` insert.
  - "Request vehicle info" (`vehicle_info_requests` is service-role-only; email-bound).
  - No general API tier.
- **Photos:** uploaded client-side straight to Supabase Storage — bucket
  `installer-note-media` already has the needed authenticated upload/delete
  policies (per-user `auth.uid()/` folder). Web `notes.ts` will be simplified
  off the service-role client.
- **Derived fields** (`overall`, `notes_count`, `avg_rating`, `contributor_score`)
  are DB-trigger maintained — clients insert raw rows only, never compute these.

---

## 3. Constraints & Gotchas (so future sessions don't re-learn them)

- Next.js **server actions don't exist in RN** → all shared logic goes in
  `packages/core` as functions taking a Supabase client + plain params (no
  `FormData`, no `next/headers`); web server actions become thin wrappers.
- **Auth:** plain Supabase email/password + email-confirmation. Web uses
  `/auth/callback`; mobile needs a **deep/universal link** for the confirm step.
  Session persisted via `expo-secure-store`; use PKCE flow.
- **Multi-tenancy** (tint / ppf / installer) is **branding only**, set from
  hostname on web. Not a data boundary. Mobile picks site type via app config
  or a user-facing toggle — open decision (§5).
- `vehicle_info_requests`: only a service-role policy; non-service-role denied.
- `installer_note_media`: has user INSERT policy but **no user DELETE policy**
  → edit-remove-photo needs an additive migration (Phase 0 / task #10).
- **Pre-existing security finding (task #11):** several "Mods …" RLS policies
  have no real gating (`USING(true)`, role `public`) — anyone with the public
  anon key can delete any rating, read/alter audits & reports, read the admin
  log, spam notifications. Not caused by the port; harden before public launch.
- DB is **shared with another app** — coordinate any schema/RLS change.

---

## 4. Build Checklist

> Convention: `[x]` done · `[ ]` not done. Keep `(task #N)` tags in sync with the
> Task tool. When you finish a box, also update §0 and append to §8.

### Phase 0 — Database prerequisites
- [x] Verify RLS enabled & correctly scoped on all core tables *(task #1, done 2026-05-19)*
- [x] Verify Storage policies for `installer-note-media` / `profile-pictures` *(done 2026-05-19)*
- [x] Write migration: add `installer_note_media` user DELETE policy *(task #10, 2026-05-19)*
- [x] Refactor `src/actions/notes.ts` upload/sync off `adminClient()` → anon client *(task #10, 2026-05-19)*
- [x] Establish `supabase/migrations/` (forward-only; baseline = introspection snapshot — shared DB) *(2026-05-19)*
- [ ] **Apply** the media DELETE policy migration to the live DB + smoke-test *(needs Dashboard/CLI access — user action)*

### Phase 1 — Monorepo foundation *(task #2)*
- [ ] Decide tooling (recommend npm workspaces or pnpm + Turborepo) — log decision in §5/§8
- [ ] Create workspace root (`package.json` workspaces, shared `tsconfig.base.json`)
- [ ] Move existing app into `apps/web` (paths, `next.config.ts`, `vercel.json`)
- [ ] Confirm `apps/web` still builds locally and Vercel deploy config is updated
- [ ] Scaffold `apps/mobile` (Expo + Expo Router + TypeScript)
- [ ] Scaffold `packages/core` (build/exports, TS project references)
- [ ] Wire path aliases so web + mobile import from `packages/core`
- [ ] CI/lint/typecheck runs across the workspace

### Phase 2 — Shared data-access layer *(task #3)*
- [ ] `supabase gen types` → `packages/core/src/db.types.ts` (committed, regenerable)
- [ ] Supabase client factory: web-SSR, web-browser, RN (secure-store) variants
- [ ] Port read functions: vehicles, notes, profiles, leaderboard, ratings, notifications, settings
- [ ] Port write functions: submit/edit note, difficulty, media rows, ratings, reports, prefs, profile
- [ ] Shared validation + form/types (note submission rules: ≥20 char tips, URL checks, max 5 photos)
- [ ] Refactor web server actions into thin wrappers over `packages/core`
- [ ] Web regression check: all existing flows still work via the shared layer

### Phase 3 — Mobile auth *(task #4)*
- [ ] Supabase client in Expo with `expo-secure-store` session persistence + PKCE
- [ ] Sign-in screen
- [ ] Sign-up screen (full name, terms acceptance parity with web)
- [ ] Email-confirmation deep link (custom scheme + iOS/Android universal links)
- [ ] Session restore on launch + auth-gated navigation (mirror `proxy.ts` protected paths)
- [ ] Sign-out
- [ ] Password reset entry point (uses existing server/Supabase flow)

### Phase 4 — Mobile core read screens *(task #5)*
- [ ] App shell + navigation (Expo Router; tabs: Search / Notifications / Profile)
- [ ] Vehicle search + grouped browse (make/model/year/body)
- [ ] Vehicle detail: notes list, tint & PPF difficulty panels, photos, ratings/reviews
- [ ] Profile screen (own + others) and Leaderboard
- [ ] Notifications list + mark-read
- [ ] Settings: notification preferences
- [ ] Profile edit + avatar upload (direct storage)

### Phase 5 — Note submission path *(task #6, blocked by task #10)*
- [ ] Server endpoint: AI moderation (Anthropic) + set `status` + fire campaign events
- [ ] Note create/edit form (tint + PPF difficulty panels, trim, tips, tools, problems, URLs)
- [ ] Camera + photo-library capture; direct upload to `installer-note-media`
- [ ] Edit flow incl. remove-photo (depends on Phase 0 media DELETE policy)
- [ ] Report note / report review
- [ ] (Optional v1) Request vehicle info via server endpoint
- [ ] End-to-end: submit → moderation → appears as approved/flagged correctly

### Phase 6 — Push notifications *(task #7)*
- [ ] `push_tokens` table + migration (versioned in `supabase/migrations/`)
- [ ] Register Expo push token on login; clear on logout
- [ ] Send push on `installer_notifications` insert (Edge Function or DB trigger → Expo)
- [ ] Notification tap → deep link into the relevant screen
- [ ] Permission request UX + graceful denial

### Phase 7 — Offline cache *(task #8)*
- [ ] TanStack Query + persisted cache (and/or `expo-sqlite`)
- [ ] Cache + staleness policy for recently viewed vehicles/notes
- [ ] Decide & implement offline write-queue scope for note submission (§5 decision)
- [ ] Offline/online transition UX

### Phase 8 — Release pipeline *(task #9)*
- [ ] EAS project + `eas.json` profiles (dev / preview / production)
- [ ] Bundle IDs, app icons, splash, app config
- [ ] Secrets/env management (EAS secrets; no anon key hardcoding beyond what's already public)
- [ ] iOS internal build → TestFlight
- [ ] Android internal build → Play internal testing
- [ ] Store listings, privacy policy/data-safety, screenshots

### Phase 9 — Security hardening (pre-public-launch, separate track) *(task #11)*
- [ ] Rewrite over-permissive "Mods …" RLS policies to gate on real role/admin checks
- [ ] Coordinate the change with the other app sharing the DB
- [ ] Re-run `supabase/introspect_schema.sql` and confirm the fixes

---

## 5. Open Decisions (resolve & log here)

- [x] Monorepo tooling: **npm workspaces** — decided 2026-05-19 (already on npm; simplest for 3 packages; fine with Vercel + EAS)
- [ ] Mobile site type (tint / ppf / both): single universal app vs per-brand config — *pending*
- [ ] Offline write-queue scope for v1: read-only offline vs queued note submit — *pending*
- [ ] Note submission shape: client inserts rows then calls moderation endpoint, vs single server submit endpoint — *pending*

---

## 6. Scope Ledger (changes vs original plan)

- 2026-05-19: Photo upload confirmed fully client-side (storage policies already
  exist) — removed the planned upload endpoint; added cleanup of web service-role usage.
- 2026-05-19: Added task #10 (media DELETE policy) and task #11 (RLS hardening)
  discovered during verification.
- 2026-05-19: `supabase/migrations/` adopted as forward-only deltas for
  Installer-Notes objects only; the introspection snapshot is the baseline
  (shared DB — we do not reconstruct/own the full schema).

---

## 7. Quick Reference

- Tables: `installer_notes`, `installer_note_difficulty`,
  `installer_note_ppf_difficulty`, `installer_note_media`,
  `installer_note_ratings`, `installer_note_reports`,
  `installer_rating_reports`, `installer_rating_audits`,
  `installer_notifications`, `installer_notification_preferences`,
  `installer_admin_log`, `profiles`, `vehicle_catalog`,
  `vehicle_info_requests`.
- Buckets: `installer-note-media` (10MB, public read, per-user write/delete),
  `profile-pictures` (2MB, public read, per-user write/delete).
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_SITE_URL` (client-safe); `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET` (server-only).

---

## 8. Progress Log (append-only, newest last)

- **2026-05-19** — Explored codebase; chose RN/Expo + iOS&Android + Core&accounts.
  Created task roadmap #1–#9. Wrote `supabase/introspect_schema.sql`; user ran it.
  Verified (Postgres 17.6) RLS enabled & correctly scoped for full v1 scope; storage
  policies already support client-side photo upload/delete. Found media DELETE-policy
  gap (→#10) and pre-existing over-permissive "Mods" policies (→#11). Task #1 closed.
  Authored this plan file.
- **2026-05-19** — Decided **npm workspaces**. Phase 0: created `supabase/migrations/`
  + README + `20260519170000_installer_note_media_delete_policy.sql`; refactored
  `src/actions/notes.ts` `uploadPhotos`/`syncPhotos` off the service-role client to the
  anon client (confirmed no `admin` refs remain). Migration written but **not yet
  applied** to the live DB — task #10 code complete, apply step pending user.
