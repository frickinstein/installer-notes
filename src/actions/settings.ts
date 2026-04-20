"use server";

import { createClient } from "@/lib/supabase/server";
import { NOTIFICATION_TYPES } from "@/lib/notificationTypes";

export type NotificationPreference = {
  type: string;
  in_app: boolean;
  email: boolean;
};

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("installer_notification_preferences")
    .select("type, in_app, email")
    .eq("user_id", user.id);

  // Merge with defaults (some types default to off)
  return NOTIFICATION_TYPES.map((t) => {
    const saved = data?.find((p) => p.type === t.key);
    return {
      type: t.key,
      in_app: saved?.in_app ?? true,
      email: saved?.email ?? t.defaultEmail,
    };
  });
}

export async function updateNotificationPreference(
  type: string,
  channel: "in_app" | "email",
  enabled: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const validTypes = NOTIFICATION_TYPES.map((t) => t.key);
  if (!validTypes.includes(type as typeof validTypes[number])) {
    return { error: "Invalid notification type." };
  }

  // Read existing row first so we don't clobber the other channel
  const { data: existing } = await supabase
    .from("installer_notification_preferences")
    .select("in_app, email")
    .eq("user_id", user.id)
    .eq("type", type)
    .single();

  const typeDef = NOTIFICATION_TYPES.find((t) => t.key === type);
  const row = {
    user_id: user.id,
    type,
    in_app: existing?.in_app ?? true,
    email: existing?.email ?? (typeDef?.defaultEmail ?? true),
    [channel]: enabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("installer_notification_preferences")
    .upsert(row, { onConflict: "user_id,type" });

  if (error) return { error: error.message };
  return {};
}
