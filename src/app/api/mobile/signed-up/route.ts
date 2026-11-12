import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { fireCampaignEvent } from "@/lib/email/campaign-events";

/**
 * The phone app calls this once, right after it exchanges its email-confirm
 * code, so the drip campaign's `signup` event fires for app sign-ups the way
 * `/auth/callback` fires it for website sign-ups.
 *
 * Auth: `Authorization: Bearer <user access token>`. Only honored for an
 * account created in the last 10 minutes — an old session replaying this
 * can't re-trigger the welcome sequence.
 */
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const createdAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0;
  if (Date.now() - createdAt > 10 * 60 * 1000) return NextResponse.json({ ignored: true });

  void fireCampaignEvent(data.user.id, "signup");
  return NextResponse.json({ ok: true });
}
