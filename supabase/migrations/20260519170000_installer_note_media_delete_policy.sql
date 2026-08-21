-- Migration: allow note authors to delete their own installer_note_media rows.
--
-- Why: installer_note_media already has a user INSERT policy
-- ("Users insert own installer media") but NO user DELETE policy. The note
-- edit flow (remove a photo) and the de-service-roled syncPhotos() in
-- src/actions/notes.ts need to delete media rows as the authenticated user.
-- The matching Storage DELETE policy ("Users can delete own note media")
-- already exists on storage.objects, so this closes the DB-row side.
--
-- Mirrors the existing INSERT policy's check. DELETE policies use USING only.
-- Shared DB: this is an additive, Installer-Notes-scoped policy only.

drop policy if exists "Users delete own installer media" on public.installer_note_media;

create policy "Users delete own installer media"
  on public.installer_note_media
  for delete
  to public
  using (
    auth.uid() = (
      select installer_notes.user_id
      from public.installer_notes
      where installer_notes.id = installer_note_media.note_id
    )
  );
