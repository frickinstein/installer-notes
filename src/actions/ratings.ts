"use server";

import { createClient } from "@/lib/supabase/server";

export type RatingState =
  | { error: string }
  | { success: true; rating: { id: string; stars: number; review: string } }
  | null;

export type ReportState = { error: string } | { success: true } | null;

export async function submitRating(
  _prevState: RatingState,
  formData: FormData
): Promise<RatingState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to rate a note." };

  // Check suspension
  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_until")
    .eq("id", user.id)
    .single();

  if (profile?.suspended_until && new Date(profile.suspended_until) > new Date()) {
    const until = new Date(profile.suspended_until).toLocaleDateString();
    return { error: `Your account is suspended until ${until}. You cannot leave reviews.` };
  }

  const noteId = formData.get("note_id") as string;
  const stars = parseInt(formData.get("stars") as string, 10);
  const review = (formData.get("review") as string)?.trim() ?? "";

  if (!noteId) return { error: "Note ID is required." };
  if (!stars || stars < 1 || stars > 5) return { error: "Rating must be 1-5 stars." };
  if (review.length < 1) return { error: "A review is required." };
  if (review.length > 1000) return { error: "Review must be 1000 characters or less." };

  const { data: note } = await supabase
    .from("installer_notes")
    .select("user_id, group_id")
    .eq("id", noteId)
    .single();

  if (note?.user_id === user.id) {
    return { error: "You can't rate your own note." };
  }

  const { data: inserted, error } = await supabase
    .from("installer_note_ratings")
    .insert({
      note_id: noteId,
      user_id: user.id,
      stars,
      review,
    })
    .select("id, stars, review")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already rated this note." };
    }
    return { error: error.message };
  }

  // The author's notification + email + campaign event fire from the
  // Database Webhook on installer_note_ratings INSERT
  // (/api/hooks/rating-created, lib/ratings/notify.ts) — the same path the
  // phone app's ratings take, so this action writes the row and nothing else.

  return { success: true, rating: inserted };
}

export async function reportRating(
  _prevState: ReportState,
  formData: FormData
): Promise<ReportState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to report a review." };

  const ratingId = formData.get("rating_id") as string;
  const reason = formData.get("reason") as string;
  const reasonDetail = (formData.get("reason_detail") as string)?.trim() || null;

  if (!ratingId) return { error: "Rating ID is required." };
  if (!reason) return { error: "A reason is required." };

  const validReasons = [
    "Inaccurate or incorrect information",
    "Spam or promotional",
    "Inappropriate or offensive",
    "Unfair or retaliatory",
    "Other",
  ];
  if (!validReasons.includes(reason)) return { error: "Invalid reason." };

  if (reasonDetail && reasonDetail.length > 500) {
    return { error: "Details must be 500 characters or less." };
  }

  const { error } = await supabase
    .from("installer_rating_reports")
    .insert({
      rating_id: ratingId,
      reported_by: user.id,
      reason,
      reason_detail: reasonDetail,
    });

  if (error) {
    if (error.code === "23505") {
      return { error: "You've already reported this review." };
    }
    return { error: error.message };
  }

  return { success: true };
}
