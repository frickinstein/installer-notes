"use server";

import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error: string } | { success: true } | null;

export async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, installer_role, plan, notes_count, avg_rating, contributor_score, created_at")
    .eq("id", userId)
    .single();

  return data;
}

export async function getProfileNotes(userId: string) {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("installer_notes")
    .select(`
      id, group_id, general_tips, status, created_at,
      installer_note_difficulty (overall),
      installer_note_ratings (stars)
    `)
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (!notes || notes.length === 0) return [];

  // Fetch vehicle info for each unique group_id
  const groupIds = [...new Set(notes.map((n) => n.group_id))];
  const { data: vehicles } = await supabase
    .from("vehicle_catalog")
    .select("group_id, year, make, model, body_type_alt")
    .in("group_id", groupIds);

  // Build a map of group_id → vehicle summary
  const vehicleMap: Record<string, { make: string; model: string; body_type_alt: string; years: number[] }> = {};
  for (const v of vehicles ?? []) {
    if (!vehicleMap[v.group_id]) {
      vehicleMap[v.group_id] = { make: v.make, model: v.model, body_type_alt: v.body_type_alt, years: [] };
    }
    vehicleMap[v.group_id].years.push(v.year);
  }

  return notes.map((n) => {
    const veh = vehicleMap[n.group_id];
    let vehicleLabel: string | null = null;
    if (veh) {
      const minYear = Math.min(...veh.years);
      const maxYear = Math.max(...veh.years);
      const yearStr = minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`;
      vehicleLabel = `${yearStr} ${veh.make} ${veh.model} — ${veh.body_type_alt}`;
    }
    return { ...n, vehicleLabel };
  });
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const fullName = (formData.get("full_name") as string)?.trim();

  if (!fullName || fullName.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  return { success: true };
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function uploadProfilePicture(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("avatar") as File | null;
  if (!file || file.size === 0) return { error: "No file selected." };
  if (!ALLOWED_TYPES.includes(file.type)) return { error: "File must be PNG, JPEG, or WebP." };
  if (file.size > MAX_SIZE) return { error: "File must be under 2 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const { data: urlData } = supabase.storage.from("profile-pictures").getPublicUrl(path);
  const url = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (updateError) return { error: updateError.message };

  return { url };
}

export async function removeProfilePicture(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: files } = await supabase.storage
    .from("profile-pictures")
    .list(user.id);

  if (files && files.length > 0) {
    await supabase.storage
      .from("profile-pictures")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  return null;
}

export async function searchProfiles(query: string, limit = 30) {
  const supabase = await createClient();

  const trimmed = query.trim();
  if (!trimmed) {
    // No search term — return recent contributors
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, notes_count, avg_rating, contributor_score, created_at")
      .gt("notes_count", 0)
      .order("contributor_score", { ascending: false })
      .limit(limit);

    return data ?? [];
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, notes_count, avg_rating, contributor_score, created_at")
    .gt("notes_count", 0)
    .ilike("full_name", `%${trimmed}%`)
    .order("contributor_score", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getLeaderboard(limit = 50) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, notes_count, avg_rating, contributor_score")
    .gt("contributor_score", 0)
    .order("contributor_score", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/** Returns the distinct user IDs who have at least one approved note of each type. */
export async function getNoteTypeUserIds(): Promise<{ tintUserIds: string[]; ppfUserIds: string[] }> {
  const supabase = await createClient();

  const [{ data: tint }, { data: ppf }] = await Promise.all([
    supabase.from("installer_notes").select("user_id").eq("note_type", "tint").eq("status", "approved"),
    supabase.from("installer_notes").select("user_id").eq("note_type", "ppf").eq("status", "approved"),
  ]);

  return {
    tintUserIds: [...new Set((tint ?? []).map((n) => n.user_id))],
    ppfUserIds:  [...new Set((ppf  ?? []).map((n) => n.user_id))],
  };
}
