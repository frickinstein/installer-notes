import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { newRatingEmail } from "@/lib/email/templates/newRating";
import { fireCampaignEvent } from "@/lib/email/campaign-events";

export type RatingRow = {
  id: string;
  note_id: string;
  user_id: string;
  stars: number;
  review: string;
};

/**
 * Everything that happens after a rating row exists: the author's in-app
 * notification, their email (both per their preferences) and the
 * `rating_received` campaign event.
 *
 * Called from the Supabase Database Webhook on `installer_note_ratings`
 * INSERT (`/api/hooks/rating-created`) — so a rating left on the website and
 * one left in the Tint Notes phone app notify the author the same way. The
 * website's submitRating action no longer does this itself.
 *
 * Service role throughout: it writes another user's notification row.
 * Errors are logged, never thrown — a lost notification must not fail a hook.
 */
export async function handleRatingCreated(rating: RatingRow): Promise<void> {
  try {
    const admin = adminClient();

    const { data: note } = await admin
      .from("installer_notes")
      .select("user_id, group_id")
      .eq("id", rating.note_id)
      .maybeSingle();
    if (!note?.user_id || note.user_id === rating.user_id) return;

    await notifyNoteAuthor(note.user_id, note.group_id, rating.user_id, rating.stars, rating.review);
    void fireCampaignEvent(note.user_id, "rating_received");
  } catch (err) {
    console.error("[ratings] handleRatingCreated failed:", err);
  }
}

async function notifyNoteAuthor(
  authorId: string,
  groupId: string,
  reviewerId: string,
  stars: number,
  review: string
) {
  const admin = adminClient();

  const { data: prefs } = await admin
    .from("installer_notification_preferences")
    .select("in_app, email")
    .eq("user_id", authorId)
    .eq("type", "new_rating")
    .maybeSingle();

  // Default to both on if no preference row exists
  const wantsInApp = prefs?.in_app ?? true;
  const wantsEmail = prefs?.email ?? true;
  if (!wantsInApp && !wantsEmail) return;

  const { data: reviewerProfile } = await admin
    .from("profiles")
    .select("full_name, username")
    .eq("id", reviewerId)
    .maybeSingle();
  const reviewerName = reviewerProfile?.full_name || reviewerProfile?.username || "An installer";

  const { data: vehicle } = await admin
    .from("vehicle_catalog")
    .select("year, make, model")
    .eq("group_id", groupId)
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();
  const vehicleLabel = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "a vehicle";
  const starText = "★".repeat(stars);

  if (wantsInApp) {
    await admin.from("installer_notifications").insert({
      user_id: authorId,
      type: "new_rating",
      message: `${reviewerName} rated your note for the ${vehicleLabel} ${starText}`,
    });
  }

  if (wantsEmail) {
    const { data: authUser } = await admin.auth.admin.getUserById(authorId);
    const email = authUser?.user?.email;
    const { data: authorProfile } = await admin
      .from("profiles")
      .select("username")
      .eq("id", authorId)
      .maybeSingle();
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
}
