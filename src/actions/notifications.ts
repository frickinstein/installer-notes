"use server";

import { createClient } from "@/lib/supabase/server";
import { NOTE_REPORT_REASONS } from "@/lib/noteReportReasons";

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("installer_notifications")
    .select("id, type, message, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function markNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("installer_notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("installer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return count ?? 0;
}

export type NoteReportState = { error: string } | { success: true } | null;

/**
 * Report a note. Inserting the row is all this does — the
 * `installer_note_reports_flag_note` trigger (SnapTip migration 235) moves the
 * note to `flagged` so it lands on the mods' queue. (Before 235 this action
 * tried that update as the reporter and RLS silently refused it.)
 */
export async function reportNote(
  _prevState: NoteReportState,
  formData: FormData
): Promise<NoteReportState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to report a note." };

  const noteId = formData.get("note_id") as string;
  const reason = (formData.get("reason") as string) ?? "";
  const detail = (formData.get("reason_detail") as string)?.trim() || "";

  if (!noteId) return { error: "Note ID is required." };
  if (!(NOTE_REPORT_REASONS as readonly string[]).includes(reason)) return { error: "Pick a reason." };
  if (detail.length > 500) return { error: "Details must be 500 characters or less." };

  const { data: note } = await supabase.from("installer_notes").select("user_id").eq("id", noteId).maybeSingle();
  if (!note) return { error: "Note not found." };
  if (note.user_id === user.id) return { error: "You can't report your own note." };

  const { data: existing } = await supabase
    .from("installer_note_reports")
    .select("id")
    .eq("note_id", noteId)
    .eq("reported_by", user.id)
    .maybeSingle();
  if (existing) return { error: "You've already reported this note." };

  const { error } = await supabase.from("installer_note_reports").insert({
    note_id: noteId,
    reported_by: user.id,
    reason: detail ? `${reason} — ${detail}` : reason,
  });
  if (error) return { error: error.message };

  return { success: true };
}
