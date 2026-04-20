import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

/**
 * POST /api/unsubscribe
 * Body: { token: string }
 * Verifies the signed token and inserts an unsubscribe record.
 */
export async function POST(request: NextRequest) {
  const { token } = await request.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const parsed = verifyUnsubscribeToken(token);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }

  const admin = adminClient();

  // Upsert — if they're already unsubscribed, just confirm
  const { error } = await admin.from("email_unsubscribes").upsert(
    {
      user_id: parsed.userId,
      campaign: parsed.campaign,
    },
    { onConflict: "user_id,campaign" }
  );

  if (error) {
    return NextResponse.json({ error: "Failed to unsubscribe." }, { status: 500 });
  }

  return NextResponse.json({ success: true, campaign: parsed.campaign });
}
