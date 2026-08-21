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

## Applying

No project credentials are present locally. Apply each migration via the
Supabase Dashboard → SQL Editor (paste & run), or `supabase db push` once the
project is linked with credentials. After applying, re-run
`../introspect_schema.sql` to confirm.

## Log

- `20260519170000_installer_note_media_delete_policy.sql` — adds the missing
  user DELETE policy on `installer_note_media`. **Status: written, NOT yet
  applied to the live DB.**
