"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function reportNote(noteId: string, reason: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  await supabase.from("installer_note_reports").insert({
    note_id: noteId,
    reported_by: user.id,
    reason,
  });

  // Flag the note for review
  await supabase
    .from("installer_notes")
    .update({ status: "flagged" })
    .eq("id", noteId)
    .neq("status", "flagged");

  return { success: true };
}
