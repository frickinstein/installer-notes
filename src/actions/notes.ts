"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
const MAX_PHOTOS = 5;

export type NoteFormState = { error: string } | { success: true; noteId: string; status: string } | null;

export async function submitNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to submit a note." };

  const groupId     = formData.get("group_id") as string;
  const noteType    = (formData.get("note_type") as string) === "ppf" ? "ppf" : "tint";
  const trimPackage = (formData.get("trim_package") as string)?.trim() || null;
  const generalTips    = (formData.get("general_tips") as string)?.trim();
  const toolsNeeded    = (formData.get("tools_needed") as string)?.trim() || null;
  const commonProblems = (formData.get("common_problems") as string)?.trim() || null;
  const youtubeUrl     = (formData.get("youtube_url") as string)?.trim() || null;
  const facebookUrl    = (formData.get("facebook_url") as string)?.trim() || null;

  // Tint difficulty panels
  const rollups     = formData.get("rollups")      ? parseInt(formData.get("rollups")      as string) : null;
  const backGlass   = formData.get("back_glass")   ? parseInt(formData.get("back_glass")   as string) : null;
  const windshield  = formData.get("windshield")   ? parseInt(formData.get("windshield")   as string) : null;
  const sunroof     = formData.get("sunroof")      ? parseInt(formData.get("sunroof")      as string) : null;
  const quarterGlass= formData.get("quarter_glass")? parseInt(formData.get("quarter_glass")as string) : null;

  // PPF difficulty panels
  const hood          = formData.get("hood")           ? parseInt(formData.get("hood")           as string) : null;
  const frontBumper   = formData.get("front_bumper")   ? parseInt(formData.get("front_bumper")   as string) : null;
  const fender        = formData.get("fender")         ? parseInt(formData.get("fender")         as string) : null;
  const roof          = formData.get("roof")           ? parseInt(formData.get("roof")           as string) : null;
  const doors         = formData.get("doors")          ? parseInt(formData.get("doors")          as string) : null;
  const quarterPanels = formData.get("quarter_panels") ? parseInt(formData.get("quarter_panels") as string) : null;
  const trunkLid      = formData.get("trunk_lid")      ? parseInt(formData.get("trunk_lid")      as string) : null;
  const rearBumper    = formData.get("rear_bumper")    ? parseInt(formData.get("rear_bumper")    as string) : null;

  if (!groupId) return { error: "Vehicle group is required." };
  if (!generalTips || generalTips.length < 20) {
    return { error: "General tips must be at least 20 characters." };
  }
  if (youtubeUrl && !isValidYoutubeUrl(youtubeUrl)) {
    return { error: "Please enter a valid YouTube URL." };
  }
  if (facebookUrl && !isValidFacebookUrl(facebookUrl)) {
    return { error: "Please enter a valid Facebook URL." };
  }

  // Check for existing note by this user for this vehicle + type
  const { data: existing } = await supabase
    .from("installer_notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("group_id", groupId)
    .eq("note_type", noteType)
    .maybeSingle();

  // AI moderation
  let status: string;
  try {
    const moderationRes = await fetch(`${SITE_URL}/api/moderate-note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ general_tips: generalTips, tools_needed: toolsNeeded, common_problems: commonProblems }),
    });
    const moderation = await moderationRes.json();
    status = moderation.result === "approved" ? "approved" : "flagged";
  } catch {
    status = "flagged";
  }

  // Collect photos from form
  const photos: File[] = [];
  for (let i = 0; i < MAX_PHOTOS; i++) {
    const file = formData.get(`photo_${i}`) as File | null;
    if (file && file.size > 0) photos.push(file);
  }
  const keepPhotoIds = (formData.get("keep_photo_ids") as string)?.split(",").filter(Boolean) ?? [];

  if (existing) {
    const { error: updateErr } = await supabase
      .from("installer_notes")
      .update({
        trim_package: trimPackage,
        general_tips: generalTips,
        tools_needed: toolsNeeded,
        common_problems: commonProblems,
        youtube_url: youtubeUrl,
        facebook_url: facebookUrl,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateErr) return { error: updateErr.message };

    if (noteType === "ppf") {
      const hasDifficulty = [hood, frontBumper, fender, roof, doors, quarterPanels, trunkLid, rearBumper].some((v) => v !== null);
      if (hasDifficulty) {
        await upsertPpfDifficulty(supabase, existing.id, { hood, frontBumper, fender, roof, doors, quarterPanels, trunkLid, rearBumper });
      }
    } else {
      const hasDifficulty = [rollups, backGlass, windshield, sunroof, quarterGlass].some((v) => v !== null);
      if (hasDifficulty) {
        await upsertDifficulty(supabase, existing.id, { rollups, backGlass, windshield, sunroof, quarterGlass });
      }
    }

    try {
      await syncPhotos(supabase, user.id, existing.id, keepPhotoIds, photos);
    } catch (err: any) {
      return { error: `Photo sync failed: ${err?.message ?? String(err)}` };
    }

    return { success: true, noteId: existing.id, status };
  }

  // Create new note
  const { data: note, error: insertErr } = await supabase
    .from("installer_notes")
    .insert({
      group_id: groupId,
      user_id: user.id,
      note_type: noteType,
      trim_package: trimPackage,
      general_tips: generalTips,
      tools_needed: toolsNeeded,
      common_problems: commonProblems,
      youtube_url: youtubeUrl,
      facebook_url: facebookUrl,
      status,
    })
    .select("id")
    .single();

  if (insertErr) return { error: insertErr.message };

  if (note) {
    const { fireCampaignEvent } = await import("@/lib/email/campaign-events");
    void fireCampaignEvent(user.id, "note_submitted");

    const { count } = await supabase
      .from("installer_notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const noteCount = count ?? 0;
    if (noteCount === 1) void fireCampaignEvent(user.id, "first_note");
    else if (noteCount === 5) void fireCampaignEvent(user.id, "milestone_notes_5");
    else if (noteCount === 10) void fireCampaignEvent(user.id, "milestone_notes_10");
  }

  if (noteType === "ppf") {
    const hasDifficulty = [hood, frontBumper, fender, roof, doors, quarterPanels, trunkLid, rearBumper].some((v) => v !== null);
    if (hasDifficulty && note) {
      await supabase.from("installer_note_ppf_difficulty").insert({
        note_id: note.id,
        hood,
        front_bumper: frontBumper,
        fender,
        roof,
        doors,
        quarter_panels: quarterPanels,
        trunk_lid: trunkLid,
        rear_bumper: rearBumper,
      });
    }
  } else {
    const hasDifficulty = [rollups, backGlass, windshield, sunroof, quarterGlass].some((v) => v !== null);
    if (hasDifficulty && note) {
      await supabase.from("installer_note_difficulty").insert({
        note_id: note.id,
        rollups,
        back_glass: backGlass,
        windshield,
        sunroof,
        quarter_glass: quarterGlass,
      });
    }
  }

  if (photos.length > 0 && note) {
    try {
      await uploadPhotos(supabase, user.id, note.id, photos);
    } catch (err: any) {
      return { error: `Photo upload failed: ${err?.message ?? String(err)}` };
    }
  }

  return { success: true, noteId: note.id, status };
}

export async function getNotesForVehicle(groupId: string) {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("installer_notes")
    .select(`
      id, group_id, user_id, note_type, trim_package,
      general_tips, tools_needed, common_problems,
      youtube_url, facebook_url, status, created_at, updated_at,
      installer_note_difficulty (rollups, back_glass, windshield, sunroof, quarter_glass, overall),
      installer_note_ppf_difficulty (hood, front_bumper, fender, roof, doors, quarter_panels, trunk_lid, rear_bumper, overall),
      installer_note_ratings (id, user_id, stars, review, created_at, profiles!installer_note_ratings_user_id_fkey (full_name, avatar_url)),
      installer_note_media (id, storage_path),
      profiles!installer_notes_user_id_fkey (full_name, avatar_url)
    `)
    .eq("group_id", groupId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return notes ?? [];
}

export async function getUserNotesForVehicle(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { tintNote: null, ppfNote: null };

  const { data } = await supabase
    .from("installer_notes")
    .select(`
      id, note_type, trim_package, general_tips, tools_needed, common_problems,
      youtube_url, facebook_url, status,
      installer_note_difficulty (rollups, back_glass, windshield, sunroof, quarter_glass),
      installer_note_ppf_difficulty (hood, front_bumper, fender, roof, doors, quarter_panels, trunk_lid, rear_bumper),
      installer_note_media (id, storage_path)
    `)
    .eq("user_id", user.id)
    .eq("group_id", groupId);

  const tintNote = data?.find((n) => n.note_type === "tint") ?? null;
  const ppfNote  = data?.find((n) => n.note_type === "ppf")  ?? null;

  return { tintNote, ppfNote };
}

/** @deprecated Use getUserNotesForVehicle instead */
export async function getUserNoteForVehicle(groupId: string) {
  const { tintNote } = await getUserNotesForVehicle(groupId);
  return tintNote;
}

export async function getRecentNotes(limit = 30) {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from("installer_notes")
    .select(`
      id, group_id, user_id, general_tips, note_type, created_at,
      installer_note_difficulty (overall),
      installer_note_ratings (stars),
      profiles!installer_notes_user_id_fkey (id, full_name, avatar_url)
    `)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!notes || notes.length === 0) return [];

  const groupIds = [...new Set(notes.map((n) => n.group_id))];
  const { data: vehicles } = await supabase
    .from("vehicle_catalog")
    .select("group_id, year, make, model, body_type_alt")
    .in("group_id", groupIds);

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "www.youtube.com" ||
      u.hostname === "youtube.com" ||
      u.hostname === "youtu.be" ||
      u.hostname === "www.youtu.be"
    );
  } catch {
    return false;
  }
}

function isValidFacebookUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "www.facebook.com" ||
      u.hostname === "facebook.com" ||
      u.hostname === "fb.watch" ||
      u.hostname === "www.fb.watch"
    );
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadPhotos(supabase: any, userId: string, noteId: string, photos: File[]) {
  const admin = adminClient();

  for (const photo of photos.slice(0, MAX_PHOTOS)) {
    const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const fileName = `${userId}/${noteId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await admin.storage
      .from("installer-note-media")
      .upload(fileName, photo, { contentType: photo.type, upsert: false });

    if (uploadErr) {
      throw new Error(uploadErr.message ?? "Failed to upload photo");
    }

    await supabase.from("installer_note_media").insert({
      note_id: noteId,
      storage_path: fileName,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncPhotos(supabase: any, userId: string, noteId: string, keepIds: string[], newPhotos: File[]) {
  const { data: currentPhotos } = await supabase
    .from("installer_note_media")
    .select("id, storage_path")
    .eq("note_id", noteId);

  const current = currentPhotos ?? [];
  const admin = adminClient();
  const toDelete = current.filter((p: { id: string }) => !keepIds.includes(p.id));
  for (const photo of toDelete) {
    await admin.storage.from("installer-note-media").remove([photo.storage_path]);
    await supabase.from("installer_note_media").delete().eq("id", photo.id);
  }

  const remainingSlots = MAX_PHOTOS - keepIds.length;
  if (remainingSlots > 0 && newPhotos.length > 0) {
    await uploadPhotos(supabase, userId, noteId, newPhotos.slice(0, remainingSlots));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertDifficulty(supabase: any, noteId: string, ratings: {
  rollups: number | null;
  backGlass: number | null;
  windshield: number | null;
  sunroof: number | null;
  quarterGlass: number | null;
}) {
  const { data: existing } = await supabase
    .from("installer_note_difficulty")
    .select("id")
    .eq("note_id", noteId)
    .maybeSingle();

  const payload = {
    rollups: ratings.rollups,
    back_glass: ratings.backGlass,
    windshield: ratings.windshield,
    sunroof: ratings.sunroof,
    quarter_glass: ratings.quarterGlass,
  };

  if (existing) {
    await supabase.from("installer_note_difficulty").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("installer_note_difficulty").insert({ note_id: noteId, ...payload });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertPpfDifficulty(supabase: any, noteId: string, ratings: {
  hood: number | null;
  frontBumper: number | null;
  fender: number | null;
  roof: number | null;
  doors: number | null;
  quarterPanels: number | null;
  trunkLid: number | null;
  rearBumper: number | null;
}) {
  const { data: existing } = await supabase
    .from("installer_note_ppf_difficulty")
    .select("id")
    .eq("note_id", noteId)
    .maybeSingle();

  const payload = {
    hood: ratings.hood,
    front_bumper: ratings.frontBumper,
    fender: ratings.fender,
    roof: ratings.roof,
    doors: ratings.doors,
    quarter_panels: ratings.quarterPanels,
    trunk_lid: ratings.trunkLid,
    rear_bumper: ratings.rearBumper,
  };

  if (existing) {
    await supabase.from("installer_note_ppf_difficulty").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("installer_note_ppf_difficulty").insert({ note_id: noteId, ...payload });
  }
}
