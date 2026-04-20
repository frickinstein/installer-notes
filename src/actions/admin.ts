"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

async function requireModOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, role: null, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("installer_role")
    .eq("id", user.id)
    .single();

  if (!profile || !["mod", "admin"].includes(profile.installer_role)) {
    return { supabase, user, role: null, error: "Insufficient permissions." };
  }

  return { supabase, user, role: profile.installer_role, error: null };
}

async function logAction(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: string
) {
  await supabase.from("installer_admin_log").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    detail: detail ?? null,
  });
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const { supabase, error } = await requireModOrAdmin();
  if (error) return null;

  const admin = adminClient();

  const [vehicles, notes, users, pendingNotes, reportedReviews, pendingAudits] = await Promise.all([
    supabase.from("vehicle_catalog").select("id", { count: "exact", head: true }),
    supabase.from("installer_notes").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("installer_notes").select("id", { count: "exact", head: true }).in("status", ["flagged", "pending"]),
    supabase.from("installer_rating_reports").select("id", { count: "exact", head: true }),
    supabase.from("installer_rating_audits").select("id", { count: "exact", head: true }).eq("reviewed", false),
  ]);

  return {
    vehicles: vehicles.count ?? 0,
    approvedNotes: notes.count ?? 0,
    users: users.count ?? 0,
    pendingNotes: pendingNotes.count ?? 0,
    reportedReviews: reportedReviews.count ?? 0,
    pendingAudits: pendingAudits.count ?? 0,
  };
}

// ─── Flagged Notes ───────────────────────────────────────────────────────────

export async function getFlaggedNotes() {
  const { error } = await requireModOrAdmin();
  if (error) return [];

  const { data } = await adminClient()
    .from("installer_notes")
    .select(`
      id, group_id, user_id, general_tips, tools_needed, common_problems,
      youtube_url, status, created_at,
      profiles!installer_notes_user_id_fkey (full_name),
      installer_note_reports (id, reason, created_at)
    `)
    .in("status", ["flagged", "pending"])
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function approveNote(noteId: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  const { error: updateErr } = await supabase
    .from("installer_notes")
    .update({ status: "approved" })
    .eq("id", noteId);

  if (updateErr) return { error: updateErr.message };

  const { data: note } = await supabase
    .from("installer_notes")
    .select("user_id, group_id")
    .eq("id", noteId)
    .single();

  if (note) {
    await supabase.from("installer_notifications").insert({
      user_id: note.user_id,
      type: "note_approved",
      message: "Your install note has been approved and is now live!",
    });

    // Fire campaign event (fire-and-forget)
    const { fireCampaignEvent } = await import("@/lib/email/campaign-events");
    void fireCampaignEvent(note.user_id, "note_approved");

    // Notify anyone who requested info on this vehicle (fire-and-forget)
    if (note.group_id) {
      const { notifyRequestersOfNewNote } = await import("@/actions/requests");
      // Fetch vehicle label for the email
      const { data: vehicle } = await adminClient()
        .from("vehicle_catalog")
        .select("make, model")
        .eq("group_id", note.group_id)
        .limit(1)
        .maybeSingle();
      const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : "this vehicle";
      void notifyRequestersOfNewNote(note.group_id, vehicleLabel);
    }
  }

  await logAction(supabase, user.id, "approve_note", "note", noteId);
  return { success: true };
}

export async function rejectNote(noteId: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  const { error: updateErr } = await supabase
    .from("installer_notes")
    .update({ status: "rejected" })
    .eq("id", noteId);

  if (updateErr) return { error: updateErr.message };

  const { data: note } = await supabase
    .from("installer_notes")
    .select("user_id")
    .eq("id", noteId)
    .single();

  if (note) {
    await supabase.from("installer_notifications").insert({
      user_id: note.user_id,
      type: "note_rejected",
      message: "Your install note was reviewed and could not be approved. Please review our guidelines and resubmit.",
    });

    const { fireCampaignEvent } = await import("@/lib/email/campaign-events");
    void fireCampaignEvent(note.user_id, "note_rejected");
  }

  await logAction(supabase, user.id, "reject_note", "note", noteId);
  return { success: true };
}

// ─── Reported Reviews ────────────────────────────────────────────────────────

export async function getReportedReviews() {
  const { supabase, error } = await requireModOrAdmin();
  if (error) return [];

  const { data } = await supabase
    .from("installer_rating_reports")
    .select(`
      id, reason, reason_detail, created_at,
      installer_note_ratings!installer_rating_reports_rating_id_fkey (
        id, stars, review, user_id, note_id,
        profiles!installer_note_ratings_user_id_fkey (full_name)
      ),
      profiles!installer_rating_reports_reported_by_fkey (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function dismissReviewReport(reportId: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  const { error: deleteErr } = await supabase
    .from("installer_rating_reports")
    .delete()
    .eq("id", reportId);

  if (deleteErr) return { error: deleteErr.message };

  await logAction(supabase, user.id, "dismiss_report", "rating_report", reportId);
  return { success: true };
}

export async function removeReview(ratingId: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  const { error: deleteErr } = await supabase
    .from("installer_note_ratings")
    .delete()
    .eq("id", ratingId);

  if (deleteErr) return { error: deleteErr.message };

  await logAction(supabase, user.id, "remove_review", "rating", ratingId);
  return { success: true };
}

// ─── Rating Audits ───────────────────────────────────────────────────────────

export async function getPendingAudits() {
  const { supabase, error } = await requireModOrAdmin();
  if (error) return [];

  const { data } = await supabase
    .from("installer_rating_audits")
    .select(`
      id, note_avg_at_audit, outlier_stars, ai_summary, reviewed, created_at,
      installer_note_ratings!installer_rating_audits_rating_id_fkey (
        id, stars, review, user_id,
        profiles!installer_note_ratings_user_id_fkey (full_name)
      ),
      installer_notes!installer_rating_audits_note_id_fkey (general_tips)
    `)
    .eq("reviewed", false)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function markAuditReviewed(auditId: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  const { error: updateErr } = await supabase
    .from("installer_rating_audits")
    .update({ reviewed: true })
    .eq("id", auditId);

  if (updateErr) return { error: updateErr.message };

  await logAction(supabase, user.id, "dismiss_audit", "rating_audit", auditId);
  return { success: true };
}

// ─── User Management ─────────────────────────────────────────────────────────

export type UserSortField = "full_name" | "contributor_score" | "created_at";
export type UserSortDir = "asc" | "desc";

export async function listUsers(opts: {
  page: number;
  perPage: number;
  sortField: UserSortField;
  sortDir: UserSortDir;
  search?: string;
}): Promise<{ users: any[]; total: number }> {
  const { supabase, error } = await requireModOrAdmin();
  if (error) return { users: [], total: 0 };

  const { page, perPage, sortField, sortDir, search } = opts;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, installer_role, contributor_score, suspended_until, suspension_reason, created_at", { count: "exact" });

  if (search && search.length >= 2) {
    query = query.ilike("full_name", `%${search}%`);
  }

  query = query.order(sortField, { ascending: sortDir === "asc", nullsFirst: false });
  query = query.range(from, to);

  const { data: profiles, count } = await query;

  if (!profiles || profiles.length === 0) return { users: [], total: count ?? 0 };

  // Get actual approved note counts for these users
  const userIds = profiles.map((p) => p.id);
  const { data: noteCounts } = await supabase
    .from("installer_notes")
    .select("user_id")
    .in("user_id", userIds)
    .eq("status", "approved");

  const countMap: Record<string, number> = {};
  for (const row of noteCounts ?? []) {
    countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1;
  }

  // Get emails from auth.users via admin client
  const admin = adminClient();
  const emailMap: Record<string, string> = {};
  for (const p of profiles) {
    const { data: authUser } = await admin.auth.admin.getUserById(p.id);
    if (authUser?.user?.email) emailMap[p.id] = authUser.user.email;
  }

  return {
    users: profiles.map((p) => ({
      ...p,
      email: emailMap[p.id] ?? null,
      actual_notes_count: countMap[p.id] ?? 0,
    })),
    total: count ?? 0,
  };
}

export async function updateUserRole(userId: string, role: string) {
  const { supabase, user, error, role: callerRole } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  if (!["user", "mod", "admin"].includes(role)) {
    return { error: "Invalid role." };
  }

  if (role === "admin" && callerRole !== "admin") {
    return { error: "Only admins can promote to admin." };
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ installer_role: role })
    .eq("id", userId);

  if (updateErr) return { error: updateErr.message };

  await logAction(supabase, user.id, "change_role", "user", userId, `Set role to ${role}`);
  return { success: true };
}

export async function suspendUser(userId: string, days: number, reason: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  if (days < 1 || days > 365) return { error: "Suspension must be 1-365 days." };
  if (!reason.trim()) return { error: "A reason is required." };

  const suspendedUntil = new Date();
  suspendedUntil.setDate(suspendedUntil.getDate() + days);

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      suspended_until: suspendedUntil.toISOString(),
      suspension_reason: reason.trim(),
    })
    .eq("id", userId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("installer_notifications").insert({
    user_id: userId,
    type: "account_suspended",
    message: `Your account has been suspended for ${days} day${days !== 1 ? "s" : ""}. Reason: ${reason.trim()}`,
  });

  await logAction(supabase, user.id, "suspend_user", "user", userId, `${days} days — ${reason.trim()}`);
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  const { supabase, user, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ suspended_until: null, suspension_reason: null })
    .eq("id", userId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from("installer_notifications").insert({
    user_id: userId,
    type: "account_unsuspended",
    message: "Your account suspension has been lifted.",
  });

  await logAction(supabase, user.id, "unsuspend_user", "user", userId);
  return { success: true };
}

// ─── Password Reset & Account Deletion ───────────────────────────────────────

export async function sendPasswordResetLink(userId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can send password resets." };

  const admin = adminClient();

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;
  if (!email) return { error: "No email address found for this user." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

  const { error: resetError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${siteUrl}/auth/callback` },
  });

  if (resetError) return { error: resetError.message };

  // Also send via Supabase's built-in reset (which actually emails the user)
  const { error: sendError } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`,
  });

  if (sendError) return { error: sendError.message };

  await logAction(supabase, user.id, "send_password_reset", "user", userId, email);
  return { success: true, email };
}

export async function deleteUserAccount(userId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can delete accounts." };

  if (userId === user.id) return { error: "You cannot delete your own account." };

  const admin = adminClient();

  // Get user info for logging before deletion
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, username")
    .eq("id", userId)
    .single();

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email ?? "unknown";
  const name = profile?.full_name ?? profile?.username ?? "unknown";

  // Delete from auth (cascades to profiles and all related data via FK ON DELETE CASCADE)
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

  if (deleteError) return { error: deleteError.message };

  await logAction(supabase, user.id, "delete_user", "user", userId, `${name} (${email})`);
  return { success: true };
}

// ─── Vehicle Catalog Import ──────────────────────────────────────────────────

type VehicleRow = {
  year: number;
  make: string;
  model: string;
  body_type_alt: string;
  body_type: string;
  generation: number;
};

type ImportResult = {
  error?: string;
  inserted: number;
  updated: number;
  skipped: number;
  duplicatesInCsv: VehicleRow[];
  duplicatesInDb: VehicleRow[];
};

export async function importVehicleCsv(rows: VehicleRow[]): Promise<ImportResult> {
  const empty: ImportResult = { inserted: 0, updated: 0, skipped: 0, duplicatesInCsv: [], duplicatesInDb: [] };

  const { user, role, error } = await requireModOrAdmin();
  if (error || !user) return { ...empty, error: error ?? "Not authenticated." };

  if (role !== "admin") return { ...empty, error: "Only admins can import vehicles." };
  if (!rows.length) return { ...empty, error: "CSV is empty." };
  if (rows.length > 10000) return { ...empty, error: "Maximum 10,000 rows per import." };

  // Deduplicate within the CSV itself
  const seen = new Set<string>();
  const deduped: VehicleRow[] = [];
  const duplicatesInCsv: VehicleRow[] = [];

  for (const row of rows) {
    const key = `${row.year}|${row.make}|${row.model}|${row.body_type_alt}`;
    if (seen.has(key)) {
      duplicatesInCsv.push(row);
    } else {
      seen.add(key);
      deduped.push(row);
    }
  }

  const admin = adminClient();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const duplicatesInDb: VehicleRow[] = [];

  // Process in batches of 500
  const BATCH = 500;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const batch = deduped.slice(i, i + BATCH);

    // Check which rows already exist
    const { data: existing } = await admin
      .from("vehicle_catalog")
      .select("year, make, model, body_type_alt, body_type, generation")
      .or(batch.map((r) =>
        `and(year.eq.${r.year},make.eq.${r.make},model.eq.${r.model},body_type_alt.eq.${r.body_type_alt})`
      ).join(","));

    const existingMap = new Map(
      (existing ?? []).map((e) => [`${e.year}|${e.make}|${e.model}|${e.body_type_alt}`, e])
    );

    const toInsert: VehicleRow[] = [];
    const toUpdate: VehicleRow[] = [];

    for (const row of batch) {
      const key = `${row.year}|${row.make}|${row.model}|${row.body_type_alt}`;
      const ex = existingMap.get(key);
      if (ex) {
        if (ex.body_type !== row.body_type || ex.generation !== row.generation) {
          toUpdate.push(row);
        } else {
          duplicatesInDb.push(row);
          skipped++;
        }
      } else {
        toInsert.push(row);
      }
    }

    if (toInsert.length) {
      const { error: insertErr } = await admin.from("vehicle_catalog").insert(toInsert);
      if (insertErr) return { error: `Insert failed: ${insertErr.message}`, inserted, updated, skipped, duplicatesInCsv, duplicatesInDb };
      inserted += toInsert.length;
    }

    for (const row of toUpdate) {
      const { error: updateErr } = await admin
        .from("vehicle_catalog")
        .update({ body_type: row.body_type, generation: row.generation })
        .eq("year", row.year)
        .eq("make", row.make)
        .eq("model", row.model)
        .eq("body_type_alt", row.body_type_alt);
      if (updateErr) return { error: `Update failed: ${updateErr.message}`, inserted, updated, skipped, duplicatesInCsv, duplicatesInDb };
      updated++;
    }
  }

  const supabase = await createClient();
  await logAction(supabase, user.id, "import_vehicles", "vehicle_catalog", "bulk", `Inserted ${inserted}, updated ${updated}, skipped ${skipped} (${rows.length} total rows)`);

  return { inserted, updated, skipped, duplicatesInCsv, duplicatesInDb };
}

// ─── Vehicle Catalog — Search & Edit ─────────────────────────────────────────

export type VehicleSearchResult = {
  id: string;
  year: number;
  make: string;
  model: string;
  body_type_alt: string;
  body_type: string;
  generation: number;
  group_id: string | null;
};

function generateGroupId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'group_';
  for (let i = 0; i < 16; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function searchVehicles(params: {
  make: string;
  model: string;
  yearMin?: number;
  yearMax?: number;
}): Promise<VehicleSearchResult[] | { error: string }> {
  const { role, error } = await requireModOrAdmin();
  if (error) return { error };
  if (role !== 'admin') return { error: 'Only admins can manage vehicles.' };
  if (!params.make.trim() && !params.model.trim()) return { error: 'Enter a make or model to search.' };

  const admin = adminClient();
  let query = admin
    .from('vehicle_catalog')
    .select('id, year, make, model, body_type_alt, body_type, generation, group_id')
    .order('make')
    .order('model')
    .order('year')
    .limit(200);

  if (params.make.trim()) query = query.ilike('make', `%${params.make.trim()}%`);
  if (params.model.trim()) query = query.ilike('model', `%${params.model.trim()}%`);
  if (params.yearMin) query = query.gte('year', params.yearMin);
  if (params.yearMax) query = query.lte('year', params.yearMax);

  const { data, error: dbErr } = await query;
  if (dbErr) return { error: dbErr.message };
  return (data ?? []) as VehicleSearchResult[];
}

export async function updateVehicle(
  id: string,
  fields: {
    year?: number;
    make?: string;
    model?: string;
    body_type_alt?: string;
    body_type?: string;
    generation?: number;
  }
): Promise<{ error?: string }> {
  const { user, role, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? 'Not authenticated.' };
  if (role !== 'admin') return { error: 'Only admins can edit vehicles.' };

  const admin = adminClient();

  const updatePayload: Record<string, unknown> = { ...fields };

  if (fields.generation !== undefined) {
    const { data: current } = await admin
      .from('vehicle_catalog')
      .select('make, model, body_type, generation')
      .eq('id', id)
      .single();

    if (!current) return { error: 'Vehicle not found.' };

    if (current.generation !== fields.generation) {
      const make = fields.make ?? current.make;
      const model = fields.model ?? current.model;
      const bodyType = fields.body_type ?? current.body_type;

      const { data: existing } = await admin
        .from('vehicle_catalog')
        .select('group_id')
        .eq('make', make)
        .eq('model', model)
        .eq('body_type', bodyType)
        .eq('generation', fields.generation)
        .not('group_id', 'is', null)
        .neq('id', id)
        .limit(1)
        .maybeSingle();

      updatePayload.group_id = existing?.group_id ?? generateGroupId();
    }
  }

  const { error: updateErr } = await admin
    .from('vehicle_catalog')
    .update(updatePayload)
    .eq('id', id);

  if (updateErr) return { error: updateErr.message };

  const supabase = await createClient();
  await logAction(supabase, user.id, 'update_vehicle', 'vehicle_catalog', id, JSON.stringify(fields));

  return {};
}

export async function bulkUpdateVehicleGeneration(
  ids: string[],
  generation: number
): Promise<{ updated: number; error?: string }> {
  const { user, role, error } = await requireModOrAdmin();
  if (error || !user) return { updated: 0, error: error ?? 'Not authenticated.' };
  if (role !== 'admin') return { updated: 0, error: 'Only admins can edit vehicles.' };
  if (!ids.length) return { updated: 0, error: 'No vehicles selected.' };
  if (ids.length > 500) return { updated: 0, error: 'Maximum 500 vehicles per bulk update.' };

  const admin = adminClient();

  const { data: vehicles } = await admin
    .from('vehicle_catalog')
    .select('id, make, model, body_type, generation')
    .in('id', ids);

  if (!vehicles?.length) return { updated: 0, error: 'No vehicles found.' };

  // Cache group_id per (make, model, body_type) so we only query once per group
  const groupIdCache = new Map<string, string>();

  async function getGroupId(make: string, model: string, bodyType: string): Promise<string> {
    const key = `${make}|${model}|${bodyType}`;
    if (groupIdCache.has(key)) return groupIdCache.get(key)!;

    const { data } = await admin
      .from('vehicle_catalog')
      .select('group_id')
      .eq('make', make)
      .eq('model', model)
      .eq('body_type', bodyType)
      .eq('generation', generation)
      .not('group_id', 'is', null)
      .not('id', 'in', `(${ids.join(',')})`)
      .limit(1)
      .maybeSingle();

    const gid = data?.group_id ?? generateGroupId();
    groupIdCache.set(key, gid);
    return gid;
  }

  let updated = 0;
  for (const v of vehicles) {
    if (v.generation === generation) {
      updated++;
      continue;
    }
    const groupId = await getGroupId(v.make, v.model, v.body_type);
    const { error: updateErr } = await admin
      .from('vehicle_catalog')
      .update({ generation, group_id: groupId })
      .eq('id', v.id);

    if (updateErr) return { updated, error: updateErr.message };
    updated++;
  }

  const supabase = await createClient();
  await logAction(supabase, user.id, 'bulk_update_generation', 'vehicle_catalog', 'bulk', `Set generation ${generation} on ${updated} vehicles`);

  return { updated };
}

// ─── Admin Log ───────────────────────────────────────────────────────────────

export async function getAdminLog(limit = 50) {
  const { supabase, error } = await requireModOrAdmin();
  if (error) return [];

  const { data } = await supabase
    .from("installer_admin_log")
    .select(`
      id, action, target_type, target_id, detail, created_at,
      profiles!installer_admin_log_admin_id_fkey (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

// ─── AI Audit Trigger ────────────────────────────────────────────────────────

const auditCooldowns = new Map<string, number>();

export async function canRunAudit(): Promise<{ canRun: boolean; waitMinutes?: number }> {
  const { user, role, error } = await requireModOrAdmin();
  if (error || !user) return { canRun: false };

  if (role === "admin") return { canRun: true };

  const lastRun = auditCooldowns.get(user.id) ?? 0;
  const elapsed = Date.now() - lastRun;
  const cooldown = 60 * 60 * 1000;

  if (elapsed < cooldown) {
    return { canRun: false, waitMinutes: Math.ceil((cooldown - elapsed) / 60000) };
  }

  return { canRun: true };
}

export async function triggerAudit(): Promise<{
  error?: string;
  notes_checked?: number;
  outliers_found?: number;
  audits_inserted?: number;
}> {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user) return { error: error ?? "Not authenticated." };

  if (role === "mod") {
    const lastRun = auditCooldowns.get(user.id) ?? 0;
    const elapsed = Date.now() - lastRun;
    if (elapsed < 60 * 60 * 1000) {
      const wait = Math.ceil((60 * 60 * 1000 - elapsed) / 60000);
      return { error: `Audit cooldown: try again in ${wait} minute${wait !== 1 ? "s" : ""}.` };
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${siteUrl}/api/admin/audit-ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();

    if (result.error) return { error: result.error };

    if (role === "mod") {
      auditCooldowns.set(user.id, Date.now());
    }

    await logAction(supabase, user.id, "run_audit", "system", "audit", `Checked ${result.notes_checked}, found ${result.outliers_found}, inserted ${result.audits_inserted}`);

    return result;
  } catch {
    return { error: "Failed to run audit." };
  }
}

// ─── Email Campaigns ─────────────────────────────────────────────────────────

export async function listCampaigns() {
  const { error } = await requireModOrAdmin();
  if (error) return [];

  const admin = adminClient();

  const { data: campaigns } = await admin
    .from("email_campaigns")
    .select("slug, name, description, status, created_at, list_id, email_lists(slug, name)")
    .order("created_at", { ascending: true });

  if (!campaigns || campaigns.length === 0) return [];

  const [stepsResult, sendsResult] = await Promise.all([
    admin.from("email_campaign_steps").select("campaign"),
    admin.from("email_campaign_sends").select("campaign"),
  ]);

  const stepCounts: Record<string, number> = {};
  for (const s of stepsResult.data ?? []) {
    stepCounts[s.campaign] = (stepCounts[s.campaign] ?? 0) + 1;
  }

  const sendCounts: Record<string, number> = {};
  for (const s of sendsResult.data ?? []) {
    sendCounts[s.campaign] = (sendCounts[s.campaign] ?? 0) + 1;
  }

  return campaigns.map((c) => {
    const list = Array.isArray(c.email_lists) ? c.email_lists[0] : c.email_lists;
    return {
      name: c.slug,
      displayName: c.name,
      description: c.description,
      status: c.status,
      listId: c.list_id ?? null,
      listName: list?.name ?? null,
      listSlug: list?.slug ?? null,
      stepCount: stepCounts[c.slug] ?? 0,
      sendCount: sendCounts[c.slug] ?? 0,
    };
  });
}

export async function createCampaign(name: string, listId?: string | null) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can create campaigns." };

  const slug = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!slug || slug.length < 3) return { error: "Campaign name must be at least 3 characters." };

  const admin = adminClient();

  const { error: insertError } = await admin.from("email_campaigns").insert({
    slug,
    name: name.trim(),
    status: "draft",
    list_id: listId ?? null,
    created_by: user.id,
  });

  if (insertError) {
    if (insertError.code === "23505") return { error: "A campaign with this name already exists." };
    return { error: insertError.message };
  }

  await logAction(supabase, user.id, "create_campaign", "campaign", slug);
  return { success: true, campaign: slug };
}

export async function updateCampaignStatus(slug: string, status: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can update campaign status." };

  if (!["draft", "active", "paused", "archived"].includes(status)) {
    return { error: "Invalid status." };
  }

  const admin = adminClient();

  const { error: updateError } = await admin
    .from("email_campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (updateError) return { error: updateError.message };

  await logAction(supabase, user.id, "update_campaign_status", "campaign", slug, `Set to ${status}`);
  return { success: true };
}

export async function getCampaignSteps(campaign: string) {
  const { error } = await requireModOrAdmin();
  if (error) return [];

  const admin = adminClient();

  const { data: steps } = await admin
    .from("email_campaign_steps")
    .select("*")
    .eq("campaign", campaign)
    .order("sort_order", { ascending: true });

  if (!steps) return [];

  const { data: sends } = await admin
    .from("email_campaign_sends")
    .select("step_key")
    .eq("campaign", campaign);

  const sendCounts: Record<string, number> = {};
  for (const s of sends ?? []) {
    sendCounts[s.step_key] = (sendCounts[s.step_key] ?? 0) + 1;
  }

  return steps.map((step) => ({
    ...step,
    send_count: sendCounts[step.step_key] ?? 0,
  }));
}

export async function getCampaignStats(campaign: string) {
  const { error } = await requireModOrAdmin();
  if (error) return null;

  const admin = adminClient();

  const [totalUsers, totalSends] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).not("username", "is", null),
    admin.from("email_campaign_sends").select("id", { count: "exact", head: true }).eq("campaign", campaign),
  ]);

  return {
    totalUsers: totalUsers.count ?? 0,
    totalSends: totalSends.count ?? 0,
  };
}

export async function createCampaignStep(step: {
  campaign: string;
  step_key: string;
  delay_days: number;
  subject: string;
  preview_text?: string | null;
  body_html: string;
  sort_order: number;
  trigger_type?: string;
  trigger_event?: string | null;
  after_step_key?: string | null;
  audience?: Record<string, unknown> | null;
}) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can create campaign steps." };

  const admin = adminClient();

  const { data, error: insertError } = await admin
    .from("email_campaign_steps")
    .insert({
      campaign: step.campaign,
      step_key: step.step_key,
      delay_days: step.delay_days,
      subject: step.subject,
      preview_text: step.preview_text ?? null,
      body_html: step.body_html,
      sort_order: step.sort_order,
      trigger_type: step.trigger_type ?? "delay_after_signup",
      trigger_event: step.trigger_event ?? null,
      after_step_key: step.after_step_key ?? null,
      audience: step.audience ?? null,
    })
    .select("id")
    .single();

  if (insertError) return { error: insertError.message };

  await logAction(supabase, user.id, "create_campaign_step", "campaign_step", data.id, step.step_key);
  return { success: true, id: data.id };
}

export async function updateCampaignStep(
  stepId: string,
  updates: {
    subject?: string;
    preview_text?: string | null;
    delay_days?: number;
    body_html?: string;
    is_active?: boolean;
    sort_order?: number;
    trigger_type?: string;
    trigger_event?: string | null;
    after_step_key?: string | null;
    audience?: Record<string, unknown> | null;
  }
) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can edit campaigns." };

  const admin = adminClient();

  const { error: updateError } = await admin
    .from("email_campaign_steps")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", stepId);

  if (updateError) return { error: updateError.message };

  await logAction(supabase, user.id, "update_campaign_step", "campaign_step", stepId);
  return { success: true };
}

export async function deleteCampaignStep(stepId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can delete campaign steps." };

  const admin = adminClient();

  const { error: deleteError } = await admin
    .from("email_campaign_steps")
    .delete()
    .eq("id", stepId);

  if (deleteError) return { error: deleteError.message };

  await logAction(supabase, user.id, "delete_campaign_step", "campaign_step", stepId);
  return { success: true };
}

export async function sendTestCampaignEmail(stepId: string) {
  const { user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can send test emails." };

  const admin = adminClient();

  const { data: step } = await admin
    .from("email_campaign_steps")
    .select("subject, body_html")
    .eq("id", stepId)
    .single();

  if (!step) return { error: "Step not found." };

  const { data: authUser } = await admin.auth.admin.getUserById(user.id);
  const email = authUser?.user?.email;
  if (!email) return { error: "No email address found." };

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .single();

  const { replaceTemplateVars } = await import("@/lib/email/audience");
  const { emailLayout } = await import("@/lib/email/templates/layout");
  const { sendEmail } = await import("@/lib/email/send");

  const body = replaceTemplateVars(step.body_html, {
    username: profile?.full_name || profile?.username || "",
  });
  const result = await sendEmail(email, step.subject, emailLayout(body));

  if (!result.success) return { error: `Send failed: ${result.error}` };
  return { success: true, sentTo: email };
}

export async function sendStepToAllEligible(stepId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can send campaign emails." };

  const admin = adminClient();

  const { data: step } = await admin
    .from("email_campaign_steps")
    .select("campaign, step_key, subject, body_html, audience")
    .eq("id", stepId)
    .single();

  if (!step) return { error: "Step not found." };

  const { getAudienceUsers, replaceTemplateVars } = await import("@/lib/email/audience");
  const { emailLayout } = await import("@/lib/email/templates/layout");
  const { sendEmail } = await import("@/lib/email/send");

  const users = await getAudienceUsers(step.audience as Record<string, unknown> | null, step.campaign);

  const { data: alreadySent } = await admin
    .from("email_campaign_sends")
    .select("user_id")
    .eq("campaign", step.campaign)
    .eq("step_key", step.step_key);

  const sentIds = new Set((alreadySent ?? []).map((s) => s.user_id));
  const eligible = users.filter((u) => !sentIds.has(u.id));

  if (eligible.length === 0) return { sent: 0 };

  let sent = 0;
  let failed = 0;
  for (const u of eligible) {
    const body = replaceTemplateVars(step.body_html, { username: u.username });
    const result = await sendEmail(u.email, step.subject, emailLayout(body));

    if (result.success) {
      await admin.from("email_campaign_sends").insert({
        user_id: u.id,
        campaign: step.campaign,
        step_key: step.step_key,
      });
      sent++;
    } else {
      failed++;
    }
  }

  await logAction(supabase, user.id, "manual_send_step", "campaign_step", stepId, `Sent to ${sent} users, ${failed} failed`);
  return { sent, failed };
}

export async function sendBroadcast(
  subject: string,
  bodyHtml: string,
  audience: Record<string, unknown> | null
) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can send broadcasts." };

  if (!subject.trim() || !bodyHtml.trim()) return { error: "Subject and body are required." };

  const { getAudienceUsers, replaceTemplateVars } = await import("@/lib/email/audience");
  const { emailLayout } = await import("@/lib/email/templates/layout");
  const { sendEmail } = await import("@/lib/email/send");

  const users = await getAudienceUsers(audience, "broadcast");
  if (users.length === 0) return { error: "No users match the audience filter." };

  const stepKey = `broadcast_${Date.now()}`;

  let sent = 0;
  let failed = 0;
  const admin = adminClient();

  for (const u of users) {
    const body = replaceTemplateVars(bodyHtml, { username: u.username });
    const result = await sendEmail(u.email, subject, emailLayout(body));

    if (result.success) {
      await admin.from("email_campaign_sends").insert({
        user_id: u.id,
        campaign: "broadcast",
        step_key: stepKey,
      });
      sent++;
    } else {
      failed++;
    }
  }

  await logAction(supabase, user.id, "send_broadcast", "broadcast", stepKey, `Sent to ${sent} users, ${failed} failed`);
  return { sent, failed };
}

export async function getAudienceCount(audience: Record<string, unknown> | null) {
  const { error } = await requireModOrAdmin();
  if (error) return 0;

  const { countAudienceUsers } = await import("@/lib/email/audience");
  return countAudienceUsers(audience);
}

// ─── Email Lists ─────────────────────────────────────────────────────────────

export type SmartListFilter = {
  has_notes?: boolean;
  no_notes?: boolean;
  min_notes?: number;
  has_reviews?: boolean;
  no_reviews?: boolean;
  min_reviews?: number;
  roles?: string[];
  min_score?: number;
  joined_within_days?: number;
  joined_before_days?: number;
} | null;

export async function listEmailLists() {
  const { error } = await requireModOrAdmin();
  if (error) return [];

  const admin = adminClient();

  const { data: lists } = await admin
    .from("email_lists")
    .select("id, slug, name, description, type, filter, created_at")
    .order("created_at", { ascending: true });

  if (!lists || lists.length === 0) return [];

  // Get member counts for static lists in bulk
  const { data: memberCounts } = await admin
    .from("email_list_members")
    .select("list_id");

  const countMap: Record<string, number> = {};
  for (const m of memberCounts ?? []) {
    countMap[m.list_id] = (countMap[m.list_id] ?? 0) + 1;
  }

  return lists.map((l) => ({
    ...l,
    staticMemberCount: l.type === "static" ? (countMap[l.id] ?? 0) : null,
  }));
}

export async function createEmailList(
  name: string,
  type: "static" | "smart",
  filter?: SmartListFilter
) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can create lists." };

  const slug = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!slug || slug.length < 2) return { error: "List name must be at least 2 characters." };

  const admin = adminClient();

  const { data, error: insertError } = await admin
    .from("email_lists")
    .insert({
      slug,
      name: name.trim(),
      type,
      filter: type === "smart" ? (filter ?? null) : null,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (insertError) {
    if (insertError.code === "23505") return { error: "A list with this name already exists." };
    return { error: insertError.message };
  }

  await logAction(supabase, user.id, "create_email_list", "email_list", data.id, name);
  return { success: true, slug: data.slug, id: data.id };
}

export async function updateEmailList(
  id: string,
  updates: { name?: string; description?: string; filter?: SmartListFilter }
) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can edit lists." };

  const admin = adminClient();

  const { error: updateError } = await admin
    .from("email_lists")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  await logAction(supabase, user.id, "update_email_list", "email_list", id);
  return { success: true };
}

export async function deleteEmailList(id: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can delete lists." };

  const admin = adminClient();

  const { error: deleteError } = await admin.from("email_lists").delete().eq("id", id);
  if (deleteError) return { error: deleteError.message };

  await logAction(supabase, user.id, "delete_email_list", "email_list", id);
  return { success: true };
}

export async function getEmailList(slug: string) {
  const { error } = await requireModOrAdmin();
  if (error) return null;

  const admin = adminClient();

  const { data } = await admin
    .from("email_lists")
    .select("id, slug, name, description, type, filter, created_at, updated_at")
    .eq("slug", slug)
    .single();

  return data ?? null;
}

export async function getListCount(listId: string) {
  const { error } = await requireModOrAdmin();
  if (error) return 0;

  const admin = adminClient();

  const { data: list } = await admin
    .from("email_lists")
    .select("id, type, slug, filter")
    .eq("id", listId)
    .single();

  if (!list) return 0;

  const { countListUsers } = await import("@/lib/email/audience");
  return countListUsers({
    id: list.id,
    type: list.type as "static" | "smart",
    slug: list.slug,
    filter: list.filter as SmartListFilter,
  });
}

export async function getListCountBySlug(slug: string) {
  const { error } = await requireModOrAdmin();
  if (error) return 0;

  const admin = adminClient();

  const { data: list } = await admin
    .from("email_lists")
    .select("id, type, slug, filter")
    .eq("slug", slug)
    .single();

  if (!list) return 0;

  const { countListUsers } = await import("@/lib/email/audience");
  return countListUsers({
    id: list.id,
    type: list.type as "static" | "smart",
    slug: list.slug,
    filter: list.filter as SmartListFilter,
  });
}

export async function getListMembers(listId: string) {
  const { error } = await requireModOrAdmin();
  if (error) return [];

  const admin = adminClient();

  const { data: members } = await admin
    .from("email_list_members")
    .select("id, user_id, source, added_at")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });

  if (!members || members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username, installer_role, notes_count")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => ({
    id: m.id,
    userId: m.user_id,
    source: m.source,
    addedAt: m.added_at,
    profile: profileMap.get(m.user_id) ?? null,
  }));
}

export async function addListMember(listId: string, userId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can manage list members." };

  const admin = adminClient();

  const { error: insertError } = await admin
    .from("email_list_members")
    .insert({ list_id: listId, user_id: userId, source: "manual" });

  if (insertError) {
    if (insertError.code === "23505") return { error: "User is already in this list." };
    return { error: insertError.message };
  }

  await logAction(supabase, user.id, "add_list_member", "email_list", listId, userId);
  return { success: true };
}

export async function removeListMember(listId: string, memberId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can manage list members." };

  const admin = adminClient();

  const { error: deleteError } = await admin
    .from("email_list_members")
    .delete()
    .eq("id", memberId)
    .eq("list_id", listId);

  if (deleteError) return { error: deleteError.message };

  await logAction(supabase, user.id, "remove_list_member", "email_list", listId, memberId);
  return { success: true };
}

/**
 * Snapshot a smart list's current filter results into email_list_members.
 * Adds new members (source='auto'), does not remove existing manual members.
 */
export async function populateListFromFilter(listId: string) {
  const { supabase, user, role, error } = await requireModOrAdmin();
  if (error || !user || role !== "admin") return { error: "Only admins can populate lists." };

  const admin = adminClient();

  const { data: list } = await admin
    .from("email_lists")
    .select("id, type, slug, filter")
    .eq("id", listId)
    .single();

  if (!list) return { error: "List not found." };
  if (list.type !== "smart") return { error: "Only smart lists can be auto-populated." };

  const { getFilteredUserIds } = await import("@/lib/email/audience");
  const userIds = await getFilteredUserIds(list.filter as SmartListFilter);

  if (userIds.length === 0) return { added: 0 };

  // Upsert in batches of 500
  let added = 0;
  const BATCH = 500;
  for (let i = 0; i < userIds.length; i += BATCH) {
    const batch = userIds.slice(i, i + BATCH).map((uid) => ({
      list_id: listId,
      user_id: uid,
      source: "auto",
    }));
    const { error: upsertError } = await admin
      .from("email_list_members")
      .upsert(batch, { onConflict: "list_id,user_id", ignoreDuplicates: true });
    if (upsertError) return { error: upsertError.message };
    added += batch.length;
  }

  await logAction(supabase, user.id, "populate_list", "email_list", listId, `Added up to ${added} members from filter`);
  return { added: userIds.length };
}

export async function getEmailOverviewStats() {
  const { error } = await requireModOrAdmin();
  if (error) return null;

  const admin = adminClient();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [sentThisMonth, activeSequences, listsCount, recentSends] = await Promise.all([
    admin.from("email_campaign_sends").select("id", { count: "exact", head: true }).gte("sent_at", startOfMonth),
    admin.from("email_campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("email_lists").select("id", { count: "exact", head: true }),
    admin.from("email_campaign_sends").select("campaign, step_key, sent_at").order("sent_at", { ascending: false }).limit(5),
  ]);

  const broadcasts = (recentSends.data ?? [])
    .filter((s) => s.step_key?.startsWith("broadcast_"))
    .slice(0, 3)
    .map((s) => ({ sentAt: s.sent_at }));

  return {
    sentThisMonth: sentThisMonth.count ?? 0,
    activeSequences: activeSequences.count ?? 0,
    listsCount: listsCount.count ?? 0,
    recentBroadcasts: broadcasts,
  };
}

export async function getRecentEventSends(limit = 30) {
  const { error } = await requireModOrAdmin();
  if (error) return [];

  const admin = adminClient();

  // Get recent sends that came from on_event triggered steps
  const { data: eventStepKeys } = await admin
    .from("email_campaign_steps")
    .select("campaign, step_key, trigger_event")
    .eq("trigger_type", "on_event");

  if (!eventStepKeys || eventStepKeys.length === 0) return [];

  // Build a lookup: "campaign::step_key" → trigger_event
  const eventMap = new Map<string, string>();
  for (const s of eventStepKeys) {
    eventMap.set(`${s.campaign}::${s.step_key}`, s.trigger_event ?? "unknown");
  }

  // Get recent sends
  const { data: sends } = await admin
    .from("email_campaign_sends")
    .select("id, user_id, campaign, step_key, status, sent_at")
    .order("sent_at", { ascending: false })
    .limit(200);

  if (!sends) return [];

  // Filter to event-triggered sends only
  const eventSends = sends
    .filter((s) => eventMap.has(`${s.campaign}::${s.step_key}`))
    .slice(0, limit);

  if (eventSends.length === 0) return [];

  // Get user names for display
  const userIds = [...new Set(eventSends.map((s) => s.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username")
    .in("id", userIds);

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.full_name || p.username || "Unknown");
  }

  return eventSends.map((s) => ({
    id: s.id,
    event: eventMap.get(`${s.campaign}::${s.step_key}`) ?? "unknown",
    campaign: s.campaign,
    stepKey: s.step_key,
    userName: nameMap.get(s.user_id) ?? "Unknown",
    status: s.status,
    sentAt: s.sent_at,
  }));
}
