"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const DAILY_REQUEST_LIMIT = 3;

export type RequestInfoResult =
  | { success: true; sentTo: number }
  | { error: string; cooldown?: { daysAgo: number }; rateLimited?: boolean };

export type VehicleRequestInfo = {
  recentRequest: { createdAt: string; daysAgo: number } | null;
  totalRequests: number;
};

/**
 * Get request metadata for a vehicle — used to populate the request button state.
 */
export async function getVehicleRequestInfo(groupId: string): Promise<VehicleRequestInfo> {
  const admin = adminClient();
  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS).toISOString();

  const [recentResult, totalResult] = await Promise.all([
    admin
      .from("vehicle_info_requests")
      .select("created_at")
      .eq("group_id", groupId)
      .gte("created_at", threeDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("vehicle_info_requests")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);

  const recentRequest = recentResult.data
    ? {
        createdAt: recentResult.data.created_at,
        daysAgo: Math.floor((Date.now() - new Date(recentResult.data.created_at).getTime()) / ONE_DAY_MS),
      }
    : null;

  return {
    recentRequest,
    totalRequests: totalResult.count ?? 0,
  };
}

/**
 * Request install info on a vehicle from the community.
 * Emails opted-in contributors (notes_count > 0) who haven't opted out.
 * 3-day per-vehicle cooldown. 3 requests per user per day.
 */
export async function requestVehicleInfo(
  groupId: string,
  vehicleLabel: string
): Promise<RequestInfoResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to request community info." };

  const admin = adminClient();
  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS).toISOString();
  const oneDayAgo = new Date(Date.now() - ONE_DAY_MS).toISOString();

  // ── Cooldown: any request for this vehicle in last 3 days ─────────────────
  const { data: recentRequest } = await admin
    .from("vehicle_info_requests")
    .select("created_at")
    .eq("group_id", groupId)
    .gte("created_at", threeDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentRequest) {
    const daysAgo = Math.floor(
      (Date.now() - new Date(recentRequest.created_at).getTime()) / ONE_DAY_MS
    );
    return { error: "This vehicle was recently requested.", cooldown: { daysAgo } };
  }

  // ── Rate limit: user's requests in last 24 hours ──────────────────────────
  const { count: recentUserCount } = await admin
    .from("vehicle_info_requests")
    .select("id", { count: "exact", head: true })
    .eq("requested_by", user.id)
    .gte("created_at", oneDayAgo);

  if ((recentUserCount ?? 0) >= DAILY_REQUEST_LIMIT) {
    return { error: "You've reached the daily request limit (3 per day).", rateLimited: true };
  }

  // ── 15-minute cooldown between requests per user ──────────────────────────
  const fifteenMinAgo = new Date(Date.now() - FIFTEEN_MINUTES_MS).toISOString();
  const { data: veryRecentRequest } = await admin
    .from("vehicle_info_requests")
    .select("created_at")
    .eq("requested_by", user.id)
    .gte("created_at", fifteenMinAgo)
    .limit(1)
    .maybeSingle();

  if (veryRecentRequest) {
    return { error: "Please wait at least 15 minutes between requests.", rateLimited: true };
  }

  // ── Fetch opted-in contributors ───────────────────────────────────────────
  // Install request emails default to OFF — only include users who explicitly opted in
  const [profilesResult, optedInTintResult, optedInPpfResult] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, username")
      .gt("notes_count", 0)
      .neq("id", user.id)
      .not("full_name", "is", null),
    admin
      .from("installer_notification_preferences")
      .select("user_id")
      .eq("type", "vehicle_info_request_tint")
      .eq("email", true),
    admin
      .from("installer_notification_preferences")
      .select("user_id")
      .eq("type", "vehicle_info_request_ppf")
      .eq("email", true),
  ]);

  // A contributor is eligible if they opted in to either tint or ppf request emails
  const optedInIds = new Set([
    ...(optedInTintResult.data ?? []).map((r) => r.user_id),
    ...(optedInPpfResult.data ?? []).map((r) => r.user_id),
  ]);
  const eligible = (profilesResult.data ?? []).filter((p) => optedInIds.has(p.id));

  if (eligible.length === 0) {
    // Still record the request even if no emails go out
    await admin.from("vehicle_info_requests").insert({
      group_id: groupId,
      requested_by: user.id,
      vehicle_label: vehicleLabel,
      sent_count: 0,
    });
    return { success: true, sentTo: 0 };
  }

  // ── Bulk fetch emails ─────────────────────────────────────────────────────
  const emailMap = new Map<string, string>();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) emailMap.set(u.id, u.email);
    }
    if (data.users.length < 1000) break;
    page++;
  }

  // ── Build and send emails ─────────────────────────────────────────────────
  const vehicleUrl = `${SITE_URL}/vehicle/${groupId}`;
  const submitUrl = `${SITE_URL}/submit/${groupId}`;
  const settingsUrl = `${SITE_URL}/settings`;

  const { emailLayout } = await import("@/lib/email/templates/layout");
  const { sendBatchEmails } = await import("@/lib/email/send");

  const emails = eligible
    .map((p) => {
      const email = emailMap.get(p.id);
      if (!email) return null;
      const name = p.full_name || p.username || "";
      const greeting = name ? `, ${name}` : "";
      const bodyHtml = buildRequestEmailHtml({ greeting, vehicleLabel, vehicleUrl, submitUrl, settingsUrl });
      return {
        to: email,
        subject: `Someone needs your help with the ${vehicleLabel}`,
        html: emailLayout(bodyHtml),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const result = await sendBatchEmails(emails);

  // ── Record the request ────────────────────────────────────────────────────
  await admin.from("vehicle_info_requests").insert({
    group_id: groupId,
    requested_by: user.id,
    vehicle_label: vehicleLabel,
    sent_count: result.sent,
  });

  return { success: true, sentTo: result.sent };
}

/**
 * Notify all unnotified requesters for a vehicle that a new note has been posted.
 * Called from approveNote when a note is approved.
 */
export async function notifyRequestersOfNewNote(
  groupId: string,
  vehicleLabel: string
): Promise<void> {
  const admin = adminClient();

  // Find all requests for this vehicle that haven't been notified yet
  const { data: requests } = await admin
    .from("vehicle_info_requests")
    .select("id, requested_by")
    .eq("group_id", groupId)
    .is("notified_at", null);

  if (!requests || requests.length === 0) return;

  // Get unique requester IDs (a user could have multiple requests if cooldowns reset)
  const uniqueRequesterIds = [...new Set(requests.map((r) => r.requested_by))];

  // Check who hasn't opted out of vehicle_note_posted emails
  const { data: optedOut } = await admin
    .from("installer_notification_preferences")
    .select("user_id")
    .eq("type", "vehicle_note_posted")
    .eq("email", false);

  const optedOutIds = new Set((optedOut ?? []).map((r) => r.user_id));
  const eligibleIds = uniqueRequesterIds.filter((id) => !optedOutIds.has(id));

  if (eligibleIds.length === 0) {
    // Still mark as notified so we don't keep trying
    await admin
      .from("vehicle_info_requests")
      .update({ notified_at: new Date().toISOString() })
      .in("id", requests.map((r) => r.id));
    return;
  }

  // Fetch profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username")
    .in("id", eligibleIds);

  // Bulk fetch emails
  const emailMap = new Map<string, string>();
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) emailMap.set(u.id, u.email);
    }
    if (data.users.length < 1000) break;
    page++;
  }

  const vehicleUrl = `${SITE_URL}/vehicle/${groupId}`;
  const settingsUrl = `${SITE_URL}/settings`;

  const { emailLayout } = await import("@/lib/email/templates/layout");
  const { sendBatchEmails } = await import("@/lib/email/send");

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const emails = eligibleIds
    .map((id) => {
      const email = emailMap.get(id);
      if (!email) return null;
      const profile = profileMap.get(id);
      const name = profile?.full_name || profile?.username || "";
      const greeting = name ? `, ${name}` : "";
      const bodyHtml = buildNotePostedEmailHtml({ greeting, vehicleLabel, vehicleUrl, settingsUrl });
      return {
        to: email,
        subject: `New install note posted — ${vehicleLabel}`,
        html: emailLayout(bodyHtml),
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (emails.length > 0) {
    await sendBatchEmails(emails);
  }

  // Mark all requests as notified
  await admin
    .from("vehicle_info_requests")
    .update({ notified_at: new Date().toISOString() })
    .in("id", requests.map((r) => r.id));
}

// ─── Email HTML builders ──────────────────────────────────────────────────────

function buildRequestEmailHtml(opts: {
  greeting: string;
  vehicleLabel: string;
  vehicleUrl: string;
  submitUrl: string;
  settingsUrl: string;
}): string {
  return `
<p style="font-size:16px;color:#CBD5E1;margin:0 0 16px">Hey${opts.greeting},</p>
<p style="font-size:15px;color:#94A3B8;margin:0 0 16px">
  A fellow installer is looking for help with the
  <strong style="color:#E2E8F0">${opts.vehicleLabel}</strong> and could use your expertise.
</p>
<p style="font-size:15px;color:#94A3B8;margin:0 0 24px">
  If you've worked on this vehicle before, adding your notes takes just a few minutes —
  and it could save another installer a lot of time and frustration.
</p>
<div style="text-align:center;margin:28px 0">
  <a href="${opts.submitUrl}"
     style="display:inline-block;background:#E31C23;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.01em">
    Share What You Know
  </a>
</div>
<p style="font-size:13px;color:#64748B;margin:16px 0 0;text-align:center">
  <a href="${opts.vehicleUrl}" style="color:#94A3B8;text-decoration:underline">View the vehicle page</a>
  &nbsp;·&nbsp;
  <a href="${opts.settingsUrl}" style="color:#94A3B8;text-decoration:underline">Manage notification settings</a>
</p>
`.trim();
}

function buildNotePostedEmailHtml(opts: {
  greeting: string;
  vehicleLabel: string;
  vehicleUrl: string;
  settingsUrl: string;
}): string {
  return `
<p style="font-size:16px;color:#CBD5E1;margin:0 0 16px">Hey${opts.greeting},</p>
<p style="font-size:15px;color:#94A3B8;margin:0 0 16px">
  Good news — someone just posted a new install note for the
  <strong style="color:#E2E8F0">${opts.vehicleLabel}</strong>,
  the vehicle you asked the community about.
</p>
<p style="font-size:15px;color:#94A3B8;margin:0 0 24px">
  Head over and check it out. And if you have anything to add, feel free to share your own experience too.
</p>
<div style="text-align:center;margin:28px 0">
  <a href="${opts.vehicleUrl}"
     style="display:inline-block;background:#E31C23;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.01em">
    See the Note
  </a>
</div>
<p style="font-size:13px;color:#64748B;margin:16px 0 0;text-align:center">
  <a href="${opts.settingsUrl}" style="color:#94A3B8;text-decoration:underline">Manage notification settings</a>
</p>
`.trim();
}
