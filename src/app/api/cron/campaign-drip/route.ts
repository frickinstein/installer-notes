import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailLayout } from "@/lib/email/templates/layout";
import { replaceTemplateVars } from "@/lib/email/audience";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

/**
 * Daily cron — sends pending drip campaign emails.
 *
 * Trigger types handled:
 *   delay_after_signup — send X days after user signed up
 *   delay_after_step   — send X days after a previous step was sent
 *   on_event           — NOT handled here (fired from app code)
 *
 * Max 1 email per user per campaign per run. Batch limit: 100.
 * Vercel Cron: daily at 12pm Mountain (7pm UTC).
 *
 * Optimized: fetches all sends + emails in bulk (no N+1 queries).
 */

const BATCH_LIMIT = 100;

type PendingSend = {
  userId: string;
  email: string;
  displayName: string;
  campaign: string;
  step: {
    step_key: string;
    subject: string;
    body_html: string;
  };
};

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = adminClient();

  // ── 1. Load active drip steps (exclude on_event) ────────────────────────

  // Only process campaigns with status = 'active'
  const { data: activeCampaigns } = await supabase
    .from("email_campaigns")
    .select("slug")
    .eq("status", "active");

  const activeSlugs = new Set((activeCampaigns ?? []).map((c) => c.slug));

  const { data: allSteps, error: stepsError } = await supabase
    .from("email_campaign_steps")
    .select("campaign, step_key, delay_days, subject, body_html, trigger_type, after_step_key, audience")
    .eq("is_active", true)
    .in("trigger_type", ["delay_after_signup", "delay_after_step"])
    .order("sort_order", { ascending: true });

  if (stepsError || !allSteps || allSteps.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "No active drip steps" });
  }

  // Group steps by campaign, only include active campaigns
  const campaigns: Record<string, typeof allSteps> = {};
  for (const step of allSteps) {
    if (!activeSlugs.has(step.campaign)) continue;
    if (!campaigns[step.campaign]) campaigns[step.campaign] = [];
    campaigns[step.campaign].push(step);
  }

  if (Object.keys(campaigns).length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "No active campaigns" });
  }

  // ── 2. Bulk fetch: all users, all sends, all emails ─────────────────────
  const [usersResult, sendsResult, unsubResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, created_at, notes_count")
      .not("username", "is", null),
    supabase
      .from("email_campaign_sends")
      .select("user_id, campaign, step_key, sent_at"),
    supabase
      .from("email_unsubscribes")
      .select("user_id, campaign"),
  ]);

  if (usersResult.error || !usersResult.data) {
    return NextResponse.json(
      { error: "Failed to fetch users", details: usersResult.error?.message },
      { status: 500 }
    );
  }

  const users = usersResult.data;
  const allSends = sendsResult.data ?? [];

  // Build unsubscribe sets: global unsubscribes + per-campaign
  const globalUnsubs = new Set<string>();
  const campaignUnsubs = new Map<string, Set<string>>();
  for (const u of unsubResult.data ?? []) {
    if (!u.campaign) {
      globalUnsubs.add(u.user_id);
    } else {
      if (!campaignUnsubs.has(u.campaign)) campaignUnsubs.set(u.campaign, new Set());
      campaignUnsubs.get(u.campaign)!.add(u.user_id);
    }
  }

  // Build per-user send map: userId → Map<"campaign::step_key", sent_at>
  const userSendMap = new Map<string, Map<string, string>>();
  for (const s of allSends) {
    if (!userSendMap.has(s.user_id)) userSendMap.set(s.user_id, new Map());
    userSendMap.get(s.user_id)!.set(`${s.campaign}::${s.step_key}`, s.sent_at);
  }

  // Bulk fetch all auth emails via paginated listUsers
  const emailMap = new Map<string, string>();
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) emailMap.set(u.id, u.email);
    }
    if (data.users.length < 1000) break;
    page++;
  }

  // ── 3. Determine which emails to send ───────────────────────────────────
  const pending: PendingSend[] = [];

  for (const user of users) {
    if (pending.length >= BATCH_LIMIT) break;

    const email = emailMap.get(user.id);
    if (!email) continue;

    // Skip globally unsubscribed users
    if (globalUnsubs.has(user.id)) continue;

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const sentMap = userSendMap.get(user.id) ?? new Map<string, string>();

    for (const [campaignName, steps] of Object.entries(campaigns)) {
      if (pending.length >= BATCH_LIMIT) break;

      // Skip campaign-specific unsubscribes
      if (campaignUnsubs.get(campaignName)?.has(user.id)) continue;

      for (const step of steps) {
        if (sentMap.has(`${campaignName}::${step.step_key}`)) continue;

        // Check audience filter
        if (step.audience) {
          const aud = step.audience as Record<string, unknown>;
          if (aud.has_notes === true && (user.notes_count ?? 0) === 0) continue;
          if (aud.no_notes === true && (user.notes_count ?? 0) > 0) continue;
          if (typeof aud.min_notes === "number" && (user.notes_count ?? 0) < aud.min_notes) continue;
        }

        let eligible = false;

        if (step.trigger_type === "delay_after_signup") {
          eligible = daysSinceSignup >= step.delay_days;
        } else if (step.trigger_type === "delay_after_step") {
          const prevSentAt = step.after_step_key
            ? sentMap.get(`${campaignName}::${step.after_step_key}`)
            : null;

          if (prevSentAt) {
            const daysSincePrev = Math.floor(
              (Date.now() - new Date(prevSentAt).getTime()) / (1000 * 60 * 60 * 24)
            );
            eligible = daysSincePrev >= step.delay_days;
          }
        }

        if (eligible) {
          pending.push({
            userId: user.id,
            email,
            displayName: user.full_name || user.username || "",
            campaign: campaignName,
            step: {
              step_key: step.step_key,
              subject: step.subject,
              body_html: step.body_html,
            },
          });
          break; // Max 1 email per user per campaign per run
        }
      }
    }
  }

  // ── 4. Send emails ─────────────────────────────────────────────────────
  let totalSent = 0;

  for (const p of pending) {
    const body = replaceTemplateVars(p.step.body_html, { username: p.displayName });
    const sendResult = await sendEmail(
      p.email,
      p.step.subject,
      emailLayout(body, { unsubscribeUrl: unsubscribeUrl(p.userId, p.campaign) })
    );

    if (sendResult.success) {
      await supabase.from("email_campaign_sends").insert({
        user_id: p.userId,
        campaign: p.campaign,
        step_key: p.step.step_key,
      });
      totalSent++;
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, evaluated: users.length });
}
