import { File } from "expo-file-system";
import { supabase, SITE_URL } from "../supabase";
import type { PanelScores } from "../difficulty";
import { MAX_PHOTOS } from "../validation";
import { vehicleLabels } from "./vehicles";

const NOTE_TYPE = "tint" as const;

export type NoteProfile = { full_name: string | null; avatar_url: string | null } | null;

export type VehicleNote = {
  id: string;
  group_id: string;
  user_id: string;
  note_type: string;
  trim_package: string | null;
  general_tips: string;
  tools_needed: string | null;
  common_problems: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  installer_note_difficulty: {
    rollups: number | null;
    back_glass: number | null;
    windshield: number | null;
    sunroof: number | null;
    quarter_glass: number | null;
    overall: number | null;
  }[];
  installer_note_ratings: {
    id: string;
    user_id: string;
    stars: number;
    review: string;
    created_at: string;
    profiles: NoteProfile;
  }[];
  installer_note_media: { id: string; storage_path: string }[];
  profiles: NoteProfile;
};

const NOTE_SELECT = `
  id, group_id, user_id, note_type, trim_package,
  general_tips, tools_needed, common_problems,
  youtube_url, facebook_url, status, created_at, updated_at,
  installer_note_difficulty (rollups, back_glass, windshield, sunroof, quarter_glass, overall),
  installer_note_ratings (id, user_id, stars, review, created_at, profiles!installer_note_ratings_user_id_fkey (full_name, avatar_url)),
  installer_note_media (id, storage_path),
  profiles!installer_notes_user_id_fkey (full_name, avatar_url)
`;

/** Approved tint notes for a vehicle, newest first. */
export async function getNotesForVehicle(groupId: string): Promise<VehicleNote[]> {
  const { data, error } = await supabase
    .from("installer_notes")
    .select(NOTE_SELECT)
    .eq("group_id", groupId)
    .eq("note_type", NOTE_TYPE)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as VehicleNote[];
}

export type MyNote = {
  id: string;
  trim_package: string | null;
  general_tips: string;
  tools_needed: string | null;
  common_problems: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  status: string;
  installer_note_difficulty: {
    rollups: number | null;
    back_glass: number | null;
    windshield: number | null;
    sunroof: number | null;
    quarter_glass: number | null;
  }[];
  installer_note_media: { id: string; storage_path: string }[];
};

/** The signed-in user's own tint note for a vehicle (any status), or null. */
export async function getMyNoteForVehicle(groupId: string): Promise<MyNote | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("installer_notes")
    .select(
      `id, trim_package, general_tips, tools_needed, common_problems, youtube_url, facebook_url, status,
       installer_note_difficulty (rollups, back_glass, windshield, sunroof, quarter_glass),
       installer_note_media (id, storage_path)`
    )
    .eq("user_id", auth.user.id)
    .eq("group_id", groupId)
    .eq("note_type", NOTE_TYPE)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as MyNote) ?? null;
}

export type RecentNote = {
  id: string;
  group_id: string;
  user_id: string;
  general_tips: string;
  created_at: string;
  installer_note_difficulty: { overall: number | null }[];
  installer_note_ratings: { stars: number }[];
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null;
  vehicleLabel: string | null;
};

export async function getRecentNotes(limit = 30): Promise<RecentNote[]> {
  const { data, error } = await supabase
    .from("installer_notes")
    .select(
      `id, group_id, user_id, general_tips, created_at,
       installer_note_difficulty (overall),
       installer_note_ratings (stars),
       profiles!installer_notes_user_id_fkey (id, full_name, avatar_url)`
    )
    .eq("note_type", NOTE_TYPE)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  const notes = (data ?? []) as unknown as Omit<RecentNote, "vehicleLabel">[];
  const labels = await vehicleLabels(notes.map((n) => n.group_id));
  return notes.map((n) => ({ ...n, vehicleLabel: labels[n.group_id] ?? null }));
}

// ─── Writes ─────────────────────────────────────────────────────────────────

export type NoteDraft = {
  trimPackage: string | null;
  generalTips: string;
  toolsNeeded: string | null;
  commonProblems: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  scores: PanelScores;
};

export type NewPhoto = { uri: string; mimeType?: string; fileName?: string | null };

export type SubmitResult = { noteId: string; status: "approved" | "pending" | "flagged" };

/**
 * Create or update the user's tint note for a vehicle.
 *
 * The phone writes the rows itself under RLS (the author can only set
 * pending/flagged — SnapTip migration 195), uploads photos straight to
 * Storage, then asks the website to moderate: /api/mobile/submit-note runs the
 * AI check, applies an approval with the service role and fires the campaign
 * emails — the only parts RLS can't do from a phone. If that call fails the
 * note simply stays pending for a mod.
 */
export async function submitNote(
  groupId: string,
  draft: NoteDraft,
  existing: MyNote | null,
  keepPhotoIds: string[],
  newPhotos: NewPhoto[]
): Promise<SubmitResult> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to submit a note.");
  const userId = auth.user.id;

  const fields = {
    trim_package: draft.trimPackage,
    general_tips: draft.generalTips,
    tools_needed: draft.toolsNeeded,
    common_problems: draft.commonProblems,
    youtube_url: draft.youtubeUrl,
    facebook_url: draft.facebookUrl,
    status: "pending",
  };

  let noteId: string;
  if (existing) {
    const { error } = await supabase
      .from("installer_notes")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    noteId = existing.id;
  } else {
    const { data, error } = await supabase
      .from("installer_notes")
      .insert({ group_id: groupId, user_id: userId, note_type: NOTE_TYPE, ...fields })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    noteId = data.id;
  }

  await upsertDifficulty(noteId, draft.scores);

  if (existing) {
    await syncPhotos(userId, noteId, keepPhotoIds, newPhotos);
  } else if (newPhotos.length > 0) {
    await uploadPhotos(userId, noteId, newPhotos);
  }

  const status = await requestModeration(noteId);
  return { noteId, status };
}

async function upsertDifficulty(noteId: string, scores: PanelScores) {
  const hasAny = Object.values(scores).some((v) => v !== null);
  const { data: existing } = await supabase
    .from("installer_note_difficulty")
    .select("id")
    .eq("note_id", noteId)
    .maybeSingle();
  if (existing) {
    await supabase.from("installer_note_difficulty").update(scores).eq("id", existing.id);
  } else if (hasAny) {
    await supabase.from("installer_note_difficulty").insert({ note_id: noteId, ...scores });
  }
}

async function uploadPhotos(userId: string, noteId: string, photos: NewPhoto[]) {
  for (const photo of photos.slice(0, MAX_PHOTOS)) {
    const ext = (photo.fileName?.split(".").pop() ?? photo.mimeType?.split("/").pop() ?? "jpg").toLowerCase();
    const path = `${userId}/${noteId}/${uuid()}.${ext}`;
    const bytes = await new File(photo.uri).arrayBuffer();
    const { error } = await supabase.storage
      .from("installer-note-media")
      .upload(path, bytes, { contentType: photo.mimeType ?? "image/jpeg", upsert: false });
    if (error) throw new Error(error.message ?? "Failed to upload photo");
    await supabase.from("installer_note_media").insert({ note_id: noteId, storage_path: path });
  }
}

async function syncPhotos(userId: string, noteId: string, keepIds: string[], newPhotos: NewPhoto[]) {
  const { data: current } = await supabase
    .from("installer_note_media")
    .select("id, storage_path")
    .eq("note_id", noteId);
  const toDelete = (current ?? []).filter((p) => !keepIds.includes(p.id));
  for (const p of toDelete) {
    await supabase.storage.from("installer-note-media").remove([p.storage_path]);
    // Needs the "Users delete own installer media" policy (SnapTip migration 234).
    await supabase.from("installer_note_media").delete().eq("id", p.id);
  }
  const slots = MAX_PHOTOS - keepIds.length;
  if (slots > 0 && newPhotos.length > 0) {
    await uploadPhotos(userId, noteId, newPhotos.slice(0, slots));
  }
}

async function requestModeration(noteId: string): Promise<SubmitResult["status"]> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return "pending";
    const res = await fetch(`${SITE_URL}/api/mobile/submit-note`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ noteId }),
    });
    if (!res.ok) return "pending";
    const json = (await res.json()) as { status?: string };
    return json.status === "approved" ? "approved" : json.status === "flagged" ? "flagged" : "pending";
  } catch {
    return "pending";
  }
}

export const NOTE_REPORT_REASONS = [
  "Inaccurate or incorrect information",
  "Spam or promotional",
  "Inappropriate or offensive",
  "Dangerous or harmful advice",
  "Other",
] as const;

/** Inserting the report is all this does — a trigger (SnapTip migration 235) flags the note for a mod. */
export async function reportNote(noteId: string, reason: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in.");
  const { data: existing } = await supabase
    .from("installer_note_reports")
    .select("id")
    .eq("note_id", noteId)
    .eq("reported_by", auth.user.id)
    .maybeSingle();
  if (existing) throw new Error("You've already reported this note.");
  const { error } = await supabase
    .from("installer_note_reports")
    .insert({ note_id: noteId, reported_by: auth.user.id, reason });
  if (error) throw new Error(error.message);
}

function uuid(): string {
  // crypto.randomUUID is not guaranteed in RN; v4 from Math.random is fine for a file name.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
