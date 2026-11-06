# Tint Notes — native app (Expo, iOS + Android)

> **STATUS (2026-11-06): Phase 1–5 code BUILT in `mobile/`, zero runtime testing.** Restarted from
> the 2026-05-19 plan with one architecture change (§2). Resume by reading §0, then the first
> unchecked box in §4.

## 0. Session context — keep current

- **Last updated:** 2026-11-06
- **Where the app lives:** `mobile/` inside this repo — a standalone Expo SDK 58 app (Expo Router,
  TypeScript, TanStack Query). The website is untouched except for the three doors in §2. The
  root `tsconfig.json` excludes `mobile/`; `.gitignore` covers `mobile/node_modules`, `.expo`, `.env`.
- **What's built:** sign in / sign up / check-email, vehicle search + recent notes, vehicle page
  (difficulty panel, note cards, reviews, photos lightbox, video links), add / edit own note with
  camera + library photos, rate a note, profiles + own profile + edit name/avatar, leaderboard
  (tint contributors), notifications list + badge, notification settings, sign out.
  `tsc`, `eslint`, `expo-doctor` all pass. **Nothing has run on a phone yet.**
- **Billy's setup list before first run** (none of these need code):
  1. ~~Apply SnapTip migration **234**~~ — applied 2026-11-06 (`tintfam-business-management/supabase/migrations/234_installer_note_media_delete_policy.sql`,
     ledger `docs/map/migrations.md`) — every migration on this shared project lives in SnapTip's ledger. Without it, removing a photo from an existing note leaves the DB row.
  2. Supabase → Authentication → URL configuration → Redirect URLs: add
     `https://tintnotes.com/auth/mobile**` (the email-confirm bridge) — custom-scheme
     entries are not needed because the bridge page does the hop.
  3. Put the website's Turnstile site key in `mobile/.env` as `EXPO_PUBLIC_TURNSTILE_SITE_KEY`
     (Vercel → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`). Supabase Auth CAPTCHA is on, so sign-in
     without it fails. The key's allowed hostnames must include `tintnotes.com`.
  4. Deploy the website (main → Vercel) so `/api/mobile/submit-note` and `/auth/mobile` exist.
  4b. Vercel env `SUPABASE_WEBHOOK_SECRET` + the Supabase Database Webhook on
     `installer_note_ratings` (see §3 #5). Until it exists, rating notifications don't send — web or app.
  5. Install **Expo Go** on the Android phone; on the Pi: `cd mobile && npx expo start`, scan the
     QR. (Claude never starts it.)
- **Accounts not yet created:** Expo (free), Apple Developer ($99/yr), Google Play ($25). Needed
  only from Phase 8 (EAS builds / stores). Push (Phase 6) needs a dev build, so it also needs
  an Expo account.
- **Machines:** builds happen on EAS in the cloud; the Pi is the dev host. The 2017 MacBook
  (Monterey) cannot run a current Xcode, so it's no help for iOS. The Windows PC can host
  `expo start` + an Android emulator if the Pi's Metro bundler OOMs next to SnapTip's dev server.

## 1. Goal & scope

- **Tint Notes only**: `note_type = 'tint'`, tint panels, tint leaderboard. PPF Notes gets its
  own app later (same code, a config switch) if wanted.
- **v1 (Billy 2026-11-06): Core + push + offline cache.** Admin / moderation / email campaigns
  stay web-only.
- **Purpose beyond the app:** the dress rehearsal for SnapTip's native apps (Payments app,
  M2 + Tap to Pay — see SnapTip `docs/map/open-plans.md`). Everything learned here —
  Expo Router, Supabase-direct under RLS, deep links, EAS, store review — carries over.

## 2. Architecture (decided 2026-11-06 — replaces the 2026-05-19 monorepo plan)

- **No monorepo.** `mobile/` is its own npm project. Shared truth is the database, not a
  package: `mobile/src/lib/database.types.ts` is generated from the live schema
  (`npx supabase gen types typescript --linked --schema public` from the SnapTip repo, trimmed
  to `installer_*` / `profiles` / `vehicle_catalog`). Query logic is ported, not shared —
  the website's server actions stay as they are.
- **Phone → Supabase directly** (anon key + user JWT, RLS). Verified 2026-11-06 against the live
  policies: every read and write v1 makes is allowed by RLS, and the old `USING(true)` "Mods …"
  holes are gone (`is_installer_mod()`, SnapTip's security pass). Sessions in AsyncStorage
  (SecureStore caps at 2 KB), PKCE flow.
- **Three doors on the website** (the only server code):
  - `POST /api/mobile/submit-note` — bearer user token + `{ noteId }`. The app has already
    written the note (status `pending` — an author can't self-approve, SnapTip mig 195 / S-40),
    its difficulty row and photos. The server runs the AI check (`src/lib/moderate.ts`, now shared
    with `/api/moderate-note`), applies approval with the service role, flags on doubt, fires
    the campaign events. If the call fails the note stays pending for a mod.
  - `GET /auth/mobile?app=<app callback>&code=…` — email-confirm bridge. Mail clients don't
    reliably linkify custom schemes, so `emailRedirectTo` points here and the page hops to
    `tintnotes://auth/callback?code=` (or `exp://…` in Expo Go). The PKCE verifier is on the
    phone; `AuthProvider` exchanges the code and sets `signup_domain = 'tintnotes'` for new users.
  - CAPTCHA: Cloudflare Turnstile rendered in a WebView (`components/Turnstile.tsx`) with the
    site's origin as `baseUrl`; token passed as `captchaToken`.
- **Photos** upload straight to Storage bucket `installer-note-media` under
  `${userId}/${noteId}/…` via `new File(uri).arrayBuffer()`; avatars to `profile-pictures`.
- **Derived fields** (`overall`, `notes_count`, `avg_rating`, `contributor_score`) are trigger
  maintained — the app never computes them.

## 3. Known gaps (v1, logged so they're choices)

- ~~Rating from the phone doesn't notify the author~~ — fixed 2026-11-06: the site's rating
  notification moved behind a Supabase Database Webhook (`/api/hooks/rating-created`); web and
  app ratings both go through it. **Billy creates the webhook** (dashboard → Database → Webhooks:
  table `installer_note_ratings`, Insert, POST `https://tintnotes.com/api/hooks/rating-created`,
  header `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`; same secret in Vercel env).
- ~~No `signup` campaign event from mobile sign-ups~~ — fixed: `/api/mobile/signed-up`.
- ~~Report note has no UI~~ — fixed: Report on a note card (web + app); the row insert flags the
  note via trigger (SnapTip migration 235). Report a *review* is still web-only in v1.
- ~~Password reset points at the website, which had none~~ — fixed: tintnotes.com now has
  `/forgot-password` → `/auth/confirm` → `/reset-password`; the app links to it.
- **Request vehicle info** (service-role-only table, email-bound) — not in v1.
- Icon / splash are still Expo's placeholders; Billy supplies Tint Notes art (1024×1024).
- In Expo Go the email-confirm hop uses `exp://<pi-ip>:8081/--/auth/callback`; it works only
  while the dev server is up on that address. Real builds use `tintnotes://`.

## 4. Build checklist

### Phase 0 — database
- [x] RLS verified for all v1 reads/writes (2026-05-19, re-verified 2026-11-06)
- [x] "Mods …" policies hardened (SnapTip security pass, confirmed live 2026-11-06)
- [x] **Apply** SnapTip migration 234 (`installer_note_media` user DELETE policy) — Billy, 2026-11-06
- [x] **Apply** SnapTip migration 235 (`installer_note_reports` → flag trigger) — Billy, 2026-11-06

### Phase 1 — foundation (BUILT 2026-11-06)
- [x] `mobile/` scaffolded (Expo SDK 58, Router, TS, React Compiler); template pruned
- [x] `app.json`: name, `tintnotes` scheme, bundle ids `com.tintnotes.app`, dark UI, permissions copy
- [x] `.env` / `.env.example`, root tsconfig exclude, gitignore
- [x] Design tokens mirrored from `globals.css` (`src/lib/theme.ts`), UI kit (`components/ui.tsx`)

### Phase 2 — data layer (BUILT 2026-11-06)
- [x] Generated + trimmed DB types
- [x] Supabase client (AsyncStorage, PKCE, foreground-only refresh)
- [x] Queries ported: vehicles, notes (read/write/photos/moderation call), profiles, ratings,
      notifications + preferences

### Phase 3 — auth (BUILT 2026-11-06)
- [x] `Stack.Protected` gate in root layout; welcome / sign-in / sign-up / check-email
- [x] Turnstile WebView; password rule (12+, ≤72 bytes) and terms checkbox parity with web
- [x] Email-confirm bridge page + in-app code exchange
- [ ] Walk on Android (Expo Go): sign in with an existing account; sign up a throwaway, confirm
      from the phone's mail app

### Phase 4 — read screens (BUILT 2026-11-06)
- [x] Tabs: Search (with recent notes) / Notifications (badge, mark-read on focus) / Me
- [x] Vehicle page, profile pages, leaderboard, notification settings, edit profile + avatar
- [ ] Walk on Android; then iPhone

### Phase 5 — note submission (BUILT 2026-11-06)
- [x] Form with trim, tips, tools, problems, panel picker, up to 5 photos (camera / library), links
- [x] Create + edit (keep/remove photos), moderation door, pending/approved notice on return
- [x] Rate a note (modal)
- [ ] Walk end to end: submit → approved note appears; flagged path (gibberish) → pending notice
- [ ] Report note / report review UI (⋮ on a card)

### Phase 6 — push notifications (not started; needs a dev build + Expo account)
- [ ] `installer_push_tokens` table + RLS (own rows) — a SnapTip-numbered migration
- [ ] Register Expo push token on sign-in, clear on sign-out
- [ ] Send on `installer_notifications` insert (DB webhook → website route → Expo push API)
- [ ] `/api/mobile/rated` so phone ratings notify the author like web ratings do
- [ ] Tap → deep link to the vehicle / profile

### Phase 7 — offline cache (not started)
- [ ] TanStack Query persister (AsyncStorage) for recent notes + viewed vehicles
- [ ] Offline banner; writes stay online-only in v1 (decision: no queued submits)

### Phase 8 — release (not started; needs the three accounts)
- [ ] `eas build:configure`, `eas.json` (development / preview / production), `extra.eas.projectId`
- [ ] Icons + splash from Billy's art; `EXPO_PUBLIC_*` as EAS env vars
- [ ] Android internal testing → Play; iOS TestFlight → App Store
- [ ] Store listings, privacy labels (camera, photos, email), support URL

## 5. Decisions log

- 2026-05-19: React Native / Expo over Capacitor / PWA; iOS + Android together.
- 2026-05-19: npm-workspaces monorepo — **superseded 2026-11-06** by a standalone `mobile/`.
- 2026-11-06: Tint-only app; Core + push + offline for v1; no store accounts yet; AsyncStorage
  sessions; email-confirm via website bridge page; Turnstile in a WebView; JS `Tabs` (not native
  tabs) so Expo Go behaves the same on both platforms.
