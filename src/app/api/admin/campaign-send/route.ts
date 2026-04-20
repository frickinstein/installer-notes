import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { getAudienceUsers, getListUsers, replaceTemplateVars } from "@/lib/email/audience";
import type { EmailList } from "@/lib/email/audience";
import { emailLayout } from "@/lib/email/templates/layout";
import { sendBatchEmails, type BatchEmail } from "@/lib/email/send";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

export const maxDuration = 60;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("installer_role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.installer_role !== "admin") {
    return { user: null, error: "Admin access required." };
  }

  return { user, error: null };
}

/**
 * Build personalized emails, send via batch API, and record in DB.
 */
async function sendAndRecord(
  users: { id: string; email: string; username: string }[],
  subjectTemplate: string,
  bodyHtmlTemplate: string,
  campaign: string,
  stepKey: string
): Promise<{ sent: number; failed: number }> {
  const emails: BatchEmail[] = users.map((u) => ({
    to: u.email,
    subject: subjectTemplate,
    html: emailLayout(replaceTemplateVars(bodyHtmlTemplate, { username: u.username }), {
      unsubscribeUrl: unsubscribeUrl(u.id, campaign),
    }),
  }));

  const result = await sendBatchEmails(emails);

  const failedSet = new Set(result.failedIndices);
  const admin = adminClient();
  const sendRecords = users.map((u, i) => ({
    user_id: u.id,
    campaign,
    step_key: stepKey,
    status: failedSet.has(i) ? "failed" : "sent",
  }));

  for (let i = 0; i < sendRecords.length; i += 500) {
    await admin.from("email_campaign_sends").insert(sendRecords.slice(i, i + 500));
  }

  return { sent: result.sent, failed: result.failed };
}

/**
 * POST /api/admin/campaign-send
 *
 * Modes:
 *   step:      { mode: "step", stepId }
 *   broadcast: { mode: "broadcast", listSlug, subject, preview_text?, body_html }
 *              Falls back to { audience } if no listSlug (legacy).
 */
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAdmin();
  if (authError || !user) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  const body = await request.json();
  const { mode } = body;

  if (mode === "step") return handleStepSend(body.stepId, user.id);
  if (mode === "broadcast") return handleBroadcastSend(body, user.id);

  return NextResponse.json({ error: "Invalid mode." }, { status: 400 });
}

async function handleStepSend(stepId: string, adminId: string) {
  if (!stepId) return NextResponse.json({ error: "stepId is required." }, { status: 400 });

  const admin = adminClient();

  const { data: step } = await admin
    .from("email_campaign_steps")
    .select("campaign, step_key, subject, body_html, audience")
    .eq("id", stepId)
    .single();

  if (!step) return NextResponse.json({ error: "Step not found." }, { status: 404 });

  const users = await getAudienceUsers(
    step.audience as Record<string, unknown> | null,
    step.campaign
  );

  const { data: alreadySent } = await admin
    .from("email_campaign_sends")
    .select("user_id")
    .eq("campaign", step.campaign)
    .eq("step_key", step.step_key);

  const sentIds = new Set((alreadySent ?? []).map((s) => s.user_id));
  const eligible = users.filter((u) => !sentIds.has(u.id));

  if (eligible.length === 0) return NextResponse.json({ sent: 0, failed: 0, total: 0 });

  const { sent, failed } = await sendAndRecord(
    eligible, step.subject, step.body_html, step.campaign, step.step_key
  );

  const supabase = await createClient();
  await supabase.from("installer_admin_log").insert({
    admin_id: adminId,
    action: "manual_send_step",
    target_type: "campaign_step",
    target_id: stepId,
    detail: `Sent to ${sent} users, ${failed} failed`,
  });

  return NextResponse.json({ sent, failed, total: eligible.length });
}

async function handleBroadcastSend(
  body: {
    listSlug?: string;
    subject: string;
    preview_text?: string | null;
    body_html: string;
    audience?: Record<string, unknown> | null;
  },
  adminId: string
) {
  const { listSlug, subject, body_html: bodyHtml, audience } = body;

  if (!subject?.trim() || !bodyHtml?.trim()) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  let users: { id: string; email: string; username: string }[];

  if (listSlug) {
    // List-based send
    const admin = adminClient();
    const { data: list } = await admin
      .from("email_lists")
      .select("id, type, slug, filter")
      .eq("slug", listSlug)
      .single();

    if (!list) {
      return NextResponse.json({ error: "List not found." }, { status: 404 });
    }

    users = await getListUsers(list as EmailList, "broadcast");
  } else {
    // Legacy audience-based send
    users = await getAudienceUsers(audience ?? null, "broadcast");
  }

  if (users.length === 0) {
    return NextResponse.json({ error: "No eligible recipients in this list." }, { status: 400 });
  }

  const stepKey = `broadcast_${Date.now()}`;
  const { sent, failed } = await sendAndRecord(users, subject, bodyHtml, "broadcast", stepKey);

  const supabase = await createClient();
  await supabase.from("installer_admin_log").insert({
    admin_id: adminId,
    action: "send_broadcast",
    target_type: "broadcast",
    target_id: stepKey,
    detail: `List: ${listSlug ?? "legacy-audience"} — Sent to ${sent}, ${failed} failed`,
  });

  return NextResponse.json({ sent, failed, total: users.length });
}
