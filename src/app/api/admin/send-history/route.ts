import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const PER_PAGE = 50;

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ sends: [], total: 0 }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("installer_role")
    .eq("id", user.id)
    .single();

  if (!profile || !["mod", "admin"].includes(profile.installer_role)) {
    return NextResponse.json({ sends: [], total: 0 }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const campaign = searchParams.get("campaign") ?? "";
  const status = searchParams.get("status") ?? "";

  const admin = adminClient();
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = admin
    .from("email_campaign_sends")
    .select("id, user_id, campaign, step_key, status, sent_at", { count: "exact" });

  if (campaign) query = query.ilike("campaign", `%${campaign}%`);
  if (status) query = query.eq("status", status);

  query = query.order("sent_at", { ascending: false }).range(from, to);

  const { data: sends, count } = await query;
  if (!sends) return NextResponse.json({ sends: [], total: 0 });

  // Get user names
  const userIds = [...new Set(sends.map((s) => s.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, username")
    .in("id", userIds);

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.full_name || p.username || "Unknown");
  }

  return NextResponse.json({
    sends: sends.map((s) => ({
      id: s.id,
      userName: nameMap.get(s.user_id) ?? "Unknown",
      campaign: s.campaign,
      stepKey: s.step_key,
      status: s.status,
      sentAt: s.sent_at,
    })),
    total: count ?? 0,
  });
}
