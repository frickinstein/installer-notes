import { supabase } from "../supabase";

export type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
};

export async function getNotifications(): Promise<Notification[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("installer_notifications")
    .select("id, type, message, read, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return 0;
  const { count } = await supabase
    .from("installer_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("read", false);
  return count ?? 0;
}

export async function markAllRead() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  await supabase
    .from("installer_notifications")
    .update({ read: true })
    .eq("user_id", auth.user.id)
    .eq("read", false);
}

// Same list as the website's src/lib/notificationTypes.ts, tint-only.
export const NOTIFICATION_TYPES = [
  { key: "new_rating", label: "New rating on your note", description: "When someone rates or reviews one of your notes", defaultEmail: true },
  { key: "note_approved", label: "Note approved", description: "When your note is approved by a moderator", defaultEmail: true },
  { key: "note_rejected", label: "Note rejected", description: "When your note is rejected by a moderator", defaultEmail: true },
  { key: "vehicle_info_request_tint", label: "Tint install requests", description: "When a member asks for tint install info on a vehicle you may know", defaultEmail: false },
  { key: "vehicle_note_posted", label: "Note posted on requested vehicle", description: "When someone posts a note on a vehicle you asked about", defaultEmail: true },
] as const;

export type NotificationPreference = { type: string; in_app: boolean; email: boolean };

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data } = await supabase
    .from("installer_notification_preferences")
    .select("type, in_app, email")
    .eq("user_id", auth.user.id);
  return NOTIFICATION_TYPES.map((t) => {
    const saved = data?.find((p) => p.type === t.key);
    return { type: t.key, in_app: saved?.in_app ?? true, email: saved?.email ?? t.defaultEmail };
  });
}

export async function updateNotificationPreference(type: string, channel: "in_app" | "email", enabled: boolean) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const def = NOTIFICATION_TYPES.find((t) => t.key === type);
  if (!def) throw new Error("Invalid notification type.");
  const { data: existing } = await supabase
    .from("installer_notification_preferences")
    .select("in_app, email")
    .eq("user_id", auth.user.id)
    .eq("type", type)
    .maybeSingle();
  const inApp = existing?.in_app ?? true;
  const email = existing?.email ?? def.defaultEmail;
  const row = {
    user_id: auth.user.id,
    type,
    in_app: channel === "in_app" ? enabled : inApp,
    email: channel === "email" ? enabled : email,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("installer_notification_preferences")
    .upsert(row, { onConflict: "user_id,type" });
  if (error) throw new Error(error.message);
}
