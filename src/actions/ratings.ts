"use server";

import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { newRatingEmail } from "@/lib/email/templates/newRating";

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

  // Notify the note author (fire-and-forget)
  if (note?.user_id) {
    void notifyNoteAuthor(note.user_id, note.group_id, user.id, stars, review);

    // Fire campaign event for the note author receiving a rating
    const { fireCampaignEvent } = await import("@/lib/email/campaign-events");
    void fireCampaignEvent(note.user_id, "rating_received");
  }

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

// ─── Notification helper ─────────────────────────────────────────────────────

async function notifyNoteAuthor(
  authorId: string,
  groupId: string,
  reviewerId: string,
  stars: number,
  review: string
) {
  try {
    const admin = adminClient();

    // Get author's notification preferences
    const { data: prefs } = await admin
      .from("installer_notification_preferences")
      .select("in_app, email")
      .eq("user_id", authorId)
      .eq("type", "new_rating")
      .single();

    // Default to both on if no preference row exists
    const wantsInApp = prefs?.in_app ?? true;
    const wantsEmail = prefs?.email ?? true;

    if (!wantsInApp && !wantsEmail) return;

    // Get reviewer's display name
    const { data: reviewerProfile } = await admin
      .from("profiles")
      .select("full_name, username")
      .eq("id", reviewerId)
      .single();

    const reviewerName = reviewerProfile?.full_name || reviewerProfile?.username || "An installer";

    // Get vehicle info for the message
    const { data: vehicle } = await admin
      .from("vehicle_catalog")
      .select("year, make, model")
      .eq("group_id", groupId)
      .order("year", { ascending: false })
      .limit(1)
      .single();

    const vehicleLabel = vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : "a vehicle";

    const starText = "\u2605".repeat(stars);

    // In-app notification
    if (wantsInApp) {
      await admin.from("installer_notifications").insert({
        user_id: authorId,
        type: "new_rating",
        message: `${reviewerName} rated your note for the ${vehicleLabel} ${starText}`,
      });
    }

    // Email notification
    if (wantsEmail) {
      const { data: authUser } = await admin.auth.admin.getUserById(authorId);
      const email = authUser?.user?.email;

      const { data: authorProfile } = await admin
        .from("profiles")
        .select("username")
        .eq("id", authorId)
        .single();

      if (email) {
        const html = newRatingEmail({
          username: authorProfile?.username ?? "",
          reviewerName,
          stars,
          review,
          vehicleLabel,
          noteGroupId: groupId,
        });
        await sendEmail(email, `${reviewerName} rated your note ${starText}`, html);
      }
    }
  } catch (err) {
    console.error("[ratings] Failed to notify note author:", err);
  }
}
