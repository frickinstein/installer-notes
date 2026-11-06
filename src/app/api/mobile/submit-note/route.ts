import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { fireCampaignEvent } from "@/lib/email/campaign-events";
import { moderateNote } from "@/lib/moderate";

/**
 * The phone app's one server door for a note. The app has already written the
 * note (status pending), its difficulty row and its photos itself under RLS;
 * this does only what a phone can't: the AI check, the service-role approval
 * (an author can't approve their own note — SnapTip migration 195, S-40) and
 * the campaign emails.
 *
 * Auth: `Authorization: Bearer <user access token>`. The note must belong to
 * that user. Body: `{ noteId }`. Returns `{ status }`.
 */
export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let noteId: unknown;
  try {
    ({ noteId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof noteId !== "string" || !noteId) {
    return NextResponse.json({ error: "noteId is required." }, { status: 400 });
  }

  // A user-scoped client: RLS decides what this token may read.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const userId = userData.user.id;

  const { data: note } = await supabase
    .from("installer_notes")
    .select("id, user_id, status, general_tips, tools_needed, common_problems")
    .eq("id", noteId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!note) return NextResponse.json({ error: "Note not found." }, { status: 404 });

  const moderation = await moderateNote(note);
  let status: "approved" | "flagged" | "pending" = note.status === "approved" ? "approved" : "pending";

  if (moderation.result === "approved") {
    const { data: updated, error } = await adminClient()
      .from("installer_notes")
      .update({ status: "approved" })
      .eq("id", note.id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error || !updated) {
      console.error("[mobile/submit-note] approval not applied:", note.id, error?.message);
      status = "pending";
    } else {
      status = "approved";
    }
  } else {
    const { error } = await supabase.from("installer_notes").update({ status: "flagged" }).eq("id", note.id);
    status = error ? "pending" : "flagged";
  }

  // Same campaign events the website fires on submit (fire-and-forget).
  void fireCampaignEvent(userId, "note_submitted");
  const { count } = await supabase
    .from("installer_notes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const n = count ?? 0;
  if (n === 1) void fireCampaignEvent(userId, "first_note");
  else if (n === 5) void fireCampaignEvent(userId, "milestone_notes_5");
  else if (n === 10) void fireCampaignEvent(userId, "milestone_notes_10");

  return NextResponse.json({ status, reason: moderation.reason });
}
