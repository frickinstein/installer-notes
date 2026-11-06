import { File } from "expo-file-system";
import { supabase } from "../supabase";
import { vehicleLabels } from "./vehicles";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  installer_role: string;
  notes_count: number;
  avg_rating: number;
  contributor_score: number;
  created_at: string;
  suspended_until: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, installer_role, notes_count, avg_rating, contributor_score, created_at, suspended_until")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProfileNote = {
  id: string;
  group_id: string;
  general_tips: string;
  status: string;
  created_at: string;
  installer_note_difficulty: { overall: number | null }[];
  installer_note_ratings: { stars: number }[];
  vehicleLabel: string | null;
};

/** A user's approved tint notes (own pending/flagged ones too when viewing yourself — RLS decides). */
export async function getProfileNotes(userId: string, includeUnapproved = false): Promise<ProfileNote[]> {
  let qb = supabase
    .from("installer_notes")
    .select(`id, group_id, general_tips, status, created_at,
             installer_note_difficulty (overall), installer_note_ratings (stars)`)
    .eq("user_id", userId)
    .eq("note_type", "tint")
    .order("created_at", { ascending: false });
  if (!includeUnapproved) qb = qb.eq("status", "approved");
  const { data, error } = await qb;
  if (error) throw error;
  const notes = (data ?? []) as unknown as Omit<ProfileNote, "vehicleLabel">[];
  const labels = await vehicleLabels(notes.map((n) => n.group_id));
  return notes.map((n) => ({ ...n, vehicleLabel: labels[n.group_id] ?? null }));
}

export type Leader = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  notes_count: number;
  avg_rating: number;
  contributor_score: number;
};

/** Top contributors who have at least one approved tint note. */
export async function getTintLeaderboard(limit = 50): Promise<Leader[]> {
  const [{ data: leaders, error }, { data: tint }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, notes_count, avg_rating, contributor_score")
      .gt("contributor_score", 0)
      .order("contributor_score", { ascending: false })
      .limit(limit),
    supabase.from("installer_notes").select("user_id").eq("note_type", "tint").eq("status", "approved"),
  ]);
  if (error) throw error;
  const tintIds = new Set((tint ?? []).map((n) => n.user_id));
  return (leaders ?? []).filter((l) => tintIds.has(l.id));
}

export async function updateName(fullName: string) {
  const name = fullName.trim();
  if (name.length < 2) throw new Error("Name must be at least 2 characters.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name, updated_at: new Date().toISOString() })
    .eq("id", auth.user.id);
  if (error) throw new Error(error.message);
}

const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];
const AVATAR_MAX = 2 * 1024 * 1024;

export async function uploadAvatar(uri: string, mimeType: string | undefined): Promise<string> {
  const type = mimeType ?? "image/jpeg";
  if (!AVATAR_TYPES.includes(type)) throw new Error("Photo must be PNG, JPEG, or WebP.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const bytes = await new File(uri).arrayBuffer();
  if (bytes.byteLength > AVATAR_MAX) throw new Error("Photo must be under 2 MB.");
  const ext = type.split("/")[1] === "jpeg" ? "jpg" : type.split("/")[1];
  const path = `${auth.user.id}/avatar.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("profile-pictures")
    .upload(path, bytes, { upsert: true, contentType: type });
  if (upErr) throw new Error(upErr.message);
  const { data: urlData } = supabase.storage.from("profile-pictures").getPublicUrl(path);
  const url = `${urlData.publicUrl}?t=${Date.now()}`;
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", auth.user.id);
  if (error) throw new Error(error.message);
  return url;
}

export async function removeAvatar() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { data: files } = await supabase.storage.from("profile-pictures").list(auth.user.id);
  if (files && files.length > 0) {
    await supabase.storage.from("profile-pictures").remove(files.map((f) => `${auth.user!.id}/${f.name}`));
  }
  await supabase.from("profiles").update({ avatar_url: null }).eq("id", auth.user.id);
}
