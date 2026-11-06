import { NextRequest, NextResponse } from "next/server";
import { handleRatingCreated, type RatingRow } from "@/lib/ratings/notify";

/**
 * Supabase Database Webhook target: `installer_note_ratings` INSERT.
 *
 * Dashboard → Database → Webhooks → new: table installer_note_ratings, event
 * Insert, HTTP POST to <site>/api/hooks/rating-created, header
 * `Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>`. One hook serves the
 * website and the phone app, because both write the rating row directly.
 *
 * Returns 200 even when the notification work fails — Supabase retries are
 * not idempotent here (a second in-app row would duplicate), and the failure
 * is logged by handleRatingCreated.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  const bearer = req.headers.get("authorization");
  if (!secret || bearer !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: { type?: string; table?: string; record?: Partial<RatingRow> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "installer_note_ratings") {
    return NextResponse.json({ ignored: true });
  }
  const r = payload.record;
  if (!r?.id || !r.note_id || !r.user_id || typeof r.stars !== "number") {
    return NextResponse.json({ error: "Malformed record." }, { status: 400 });
  }

  await handleRatingCreated({ id: r.id, note_id: r.note_id, user_id: r.user_id, stars: r.stars, review: r.review ?? "" });
  return NextResponse.json({ ok: true });
}
