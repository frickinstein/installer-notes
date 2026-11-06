# supabase/migrations

Forward-only SQL migrations for **Installer-Notes-owned** schema/policy changes.

## Important: shared database

This Postgres database is **shared with another app**. We do **not** own or
reconstruct the full baseline schema here. The authoritative current-state
snapshot is produced by `../introspect_schema.sql` (last result:
`../introspect_schema_response.json`). Treat that as the baseline; these
migrations are only the additive, Installer-Notes-scoped deltas we apply
going forward.

## Conventions

- Filename: `<UTC timestamp YYYYMMDDHHMMSS>_<slug>.sql`
- Additive and reversible-by-intent; scope strictly to `installer_*` /
  Installer-Notes objects to avoid colliding with the other app.
- Make policy changes idempotent (`drop policy if exists` then `create`).
- Coordinate before changing any shared/global object.

## Applying — read this first (2026-11-06)

**Migrations for this project are numbered and applied from SnapTip's ledger**
(`~/projects/tintfam-business-management/supabase/migrations/NNN_*.sql`, ledger
`docs/map/migrations.md`, next number at its top). This folder keeps the shared-DB
rules and the schema snapshot only; don't add SQL files here. Scope stays the
same — only `installer_*` / `email_*` / `vehicle_info_requests` objects — and the
ledger row names the card `platform/shared-auth-tintnotes`.

## Log

- 2026-11-06: `20260519170000_installer_note_media_delete_policy.sql` (written
  2026-05-19, never applied) moved to SnapTip as **migration 234**.
