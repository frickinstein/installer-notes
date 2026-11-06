import { supabase } from "../supabase";

export const RATING_REPORT_REASONS = [
  "Inaccurate or incorrect information",
  "Spam or promotional",
  "Inappropriate or offensive",
  "Unfair or retaliatory",
  "Other",
] as const;

/**
 * Rate a note. The author's in-app + email notification fires from the
 * Database Webhook on installer_note_ratings INSERT (site: /api/hooks/rating-created),
 * so the phone only writes the row — same as the website.
 */
export async function submitRating(noteId: string, stars: number, review: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to rate a note.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_until")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profile?.suspended_until && new Date(profile.suspended_until) > new Date()) {
    const until = new Date(profile.suspended_until).toLocaleDateString();
    throw new Error(`Your account is suspended until ${until}. You cannot leave reviews.`);
  }

  const text = review.trim();
  if (!stars || stars < 1 || stars > 5) throw new Error("Rating must be 1-5 stars.");
  if (text.length < 1) throw new Error("A review is required.");
  if (text.length > 1000) throw new Error("Review must be 1000 characters or less.");

  const { data: note } = await supabase.from("installer_notes").select("user_id").eq("id", noteId).maybeSingle();
  if (note?.user_id === auth.user.id) throw new Error("You can't rate your own note.");

  const { error } = await supabase
    .from("installer_note_ratings")
    .insert({ note_id: noteId, user_id: auth.user.id, stars, review: text });
  if (error) {
    if (error.code === "23505") throw new Error("You've already rated this note.");
    throw new Error(error.message);
  }
}

export async function reportRating(ratingId: string, reason: string, detail: string | null) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You must be signed in to report a review.");
  if (!(RATING_REPORT_REASONS as readonly string[]).includes(reason)) throw new Error("Invalid reason.");
  if (detail && detail.length > 500) throw new Error("Details must be 500 characters or less.");
  const { error } = await supabase
    .from("installer_rating_reports")
    .insert({ rating_id: ratingId, reported_by: auth.user.id, reason, reason_detail: detail });
  if (error) {
    if (error.code === "23505") throw new Error("You've already reported this review.");
    throw new Error(error.message);
  }
}
