# objects/_index.md — one line per noun

Format: `- [ ] noun — cluster — universe — status — source path`. Hand-maintained in slice 1;
rebuilt from card frontmatter once cards exist. Verified on 2026-09-29 against `.from('…')`
calls under `src/` and the schema snapshot `supabase/introspect_schema_response.json` (2026-05-19).

## notes

- [ ] installer_notes (`note_type` tint | ppf, `status`) — notes — live — stub — `src/actions/notes.ts`, `src/actions/admin.ts`, snapshot `TABLE installer_notes`
- [ ] installer_note_media (Storage bucket `installer-note-media`) — notes — live — stub — `src/actions/notes.ts`, snapshot `TABLE installer_note_media`; DELETE policy in `supabase/migrations/20260519170000_installer_note_media_delete_policy.sql` (unapplied)
- [ ] installer_note_difficulty (per-glass-panel scores) — notes — live — stub — `src/actions/notes.ts`, snapshot `TABLE installer_note_difficulty`
- [ ] installer_note_ppf_difficulty (per-body-panel scores) — notes — live — stub — `src/actions/notes.ts`, snapshot `TABLE installer_note_ppf_difficulty`
- [ ] installer_note_reports (flag a note) — notes — live — stub — `src/actions/notifications.ts`, snapshot `TABLE installer_note_reports`
- [ ] installer_note_ratings (stars, one per user per note) — notes — live — stub — `src/actions/ratings.ts`, `src/lib/email/audience.ts`, snapshot `TABLE installer_note_ratings`
- [ ] installer_rating_audits — notes — live — stub — `src/app/api/admin/audit-ratings/route.ts`, `src/actions/admin.ts`, snapshot `TABLE installer_rating_audits`
- [ ] installer_rating_reports (flag a rating) — notes — live — stub — `src/actions/ratings.ts`, `src/actions/admin.ts`, snapshot `TABLE installer_rating_reports`
- [ ] site type / note_type by hostname (`x-site-type`) — notes — live — stub — `src/proxy.ts`, `src/lib/site.ts`

## people

- [ ] profiles — people — live, **SHARED with SnapTip** — stub — `src/actions/profiles.ts`, `src/app/auth/callback/route.ts`, snapshot `TABLE profiles`; owner: `~/projects/tintfam-business-management/supabase/migrations/001_profiles.sql`
- [ ] auth (Supabase email/password, shared `auth.users`) — people — live — stub — `src/actions/auth.ts`, `src/app/auth/callback/route.ts`, `src/lib/supabase/{server,client,admin}.ts`
- [ ] installer_notifications (in-app rows) — people — live — stub — `src/actions/notifications.ts`, `src/lib/notificationTypes.ts`, snapshot `TABLE installer_notifications`
- [ ] installer_notification_preferences — people — live — stub — `src/actions/settings.ts`, snapshot `TABLE installer_notification_preferences`
- [ ] installer_admin_log — people — live — stub — `src/actions/admin.ts`, `src/app/api/admin/campaign-send/route.ts`, snapshot `TABLE installer_admin_log`

## vehicles

- [ ] vehicle_catalog (year / make / model / body_type) — vehicles — live, **SHARED with SnapTip** — stub — `src/actions/vehicles.ts`, `src/actions/notes.ts`, snapshot `TABLE vehicle_catalog`; owner: `~/projects/tintfam-business-management/supabase/migrations/039_vehicle_catalog.sql`
- [ ] vehicle_info_requests (service-role only) — vehicles — live — stub — `src/actions/requests.ts`, snapshot `TABLE vehicle_info_requests`

## email

- [ ] email_lists — email — live — stub — `src/actions/admin.ts`, `src/app/api/admin/campaign-send/route.ts`, snapshot `TABLE email_lists`
- [ ] email_list_members — email — live — stub — `src/lib/email/audience.ts`, `src/actions/admin.ts`, snapshot `TABLE email_list_members`
- [ ] email_campaigns — email — live — stub — `src/app/api/cron/campaign-drip/route.ts`, `src/lib/email/campaign-events.ts`, snapshot `TABLE email_campaigns`
- [ ] email_campaign_steps — email — live — stub — `src/app/api/cron/campaign-drip/route.ts`, `src/app/api/admin/campaign-send/route.ts`, snapshot `TABLE email_campaign_steps`
- [ ] email_campaign_sends (Resend webhook updates status) — email — live — stub — `src/app/api/webhooks/resend/route.ts`, `src/app/api/cron/campaign-drip/route.ts`, snapshot `TABLE email_campaign_sends`
- [ ] email_unsubscribes — email — live — stub — `src/app/api/unsubscribe/route.ts`, `src/lib/email/unsubscribe.ts`, snapshot `TABLE email_unsubscribes`
- [ ] email templates + Resend client — email — live — stub — `src/lib/email/templates/`, `src/lib/email/resend.ts`, `src/lib/email/send.ts`

## ghost

- [ ] native app / `apps/web` + `apps/mobile` monorepo — ghost — stub — `docs/planning/dev-plan-native.md` (paused at Phase 0 since 2026-05-19; no code)
- [ ] `installer_note_media` DELETE policy migration — ghost — stub — `supabase/migrations/20260519170000_installer_note_media_delete_policy.sql` (written, never applied — `supabase/migrations/README.md` log)
