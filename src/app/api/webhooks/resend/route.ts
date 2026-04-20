import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/resend
 *
 * Resend sends webhook events for email delivery status changes.
 * We update the corresponding email_campaign_sends record.
 *
 * Resend event types we handle:
 *   email.delivered  → status = 'delivered'
 *   email.bounced    → status = 'bounced'
 *   email.complained → status = 'complained'
 *
 * Setup: In the Resend dashboard, add a webhook pointing to:
 *   https://installernotes.com/api/webhooks/resend
 *   Subscribe to: email.delivered, email.bounced, email.complained
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, data } = body;

  if (!type || !data) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
  };

  const newStatus = statusMap[type];
  if (!newStatus) {
    return NextResponse.json({ ok: true, ignored: type });
  }

  // Resend provides to as an array of emails
  const recipientEmail: string | undefined = Array.isArray(data.to)
    ? data.to[0]
    : data.to;

  if (!recipientEmail) {
    return NextResponse.json({ ok: true });
  }

  const admin = adminClient();

  // Find the user by email via auth admin API
  // listUsers doesn't support email filter, so we paginate and search
  let userId: string | null = null;
  let page = 1;
  while (!userId) {
    const { data: result, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !result?.users?.length) break;
    const match = result.users.find((u) => u.email === recipientEmail);
    if (match) {
      userId = match.id;
      break;
    }
    if (result.users.length < 1000) break;
    page++;
  }

  if (!userId) {
    return NextResponse.json({ ok: true, note: "User not found for email." });
  }

  // Update the most recent "sent" record for this user to the new status
  // We use sent_at desc to get the most recent send
  const { data: recentSend } = await admin
    .from("email_campaign_sends")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (recentSend) {
    await admin
      .from("email_campaign_sends")
      .update({ status: newStatus })
      .eq("id", recentSend.id);
  }

  return NextResponse.json({ ok: true, status: newStatus, userId });
}
