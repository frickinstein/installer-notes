import { adminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { emailLayout } from "@/lib/email/templates/layout";
import { replaceTemplateVars } from "@/lib/email/audience";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

/**
 * Fire a campaign event for a user. Looks up all active on_event steps
 * matching this event, checks audience filters and prior sends, then
 * sends the email immediately.
 *
 * This is fire-and-forget — errors are logged but don't propagate.
 *
 * Supported events:
 *   signup, note_submitted, note_approved, note_rejected,
 *   rating_received, first_note, milestone_notes_5, milestone_notes_10
 */
export async function fireCampaignEvent(
  userId: string,
  event: string
): Promise<void> {
  try {
    const admin = adminClient();

    // 1. Find all active on_event steps matching this event
    //    that belong to active campaigns
    const { data: activeCampaigns } = await admin
      .from("email_campaigns")
      .select("slug")
      .eq("status", "active");

    const activeSlugs = new Set((activeCampaigns ?? []).map((c) => c.slug));

    const { data: steps } = await admin
      .from("email_campaign_steps")
      .select("id, campaign, step_key, subject, body_html, preview_text, audience")
      .eq("is_active", true)
      .eq("trigger_type", "on_event")
      .eq("trigger_event", event);

    if (!steps || steps.length === 0) return;

    // Filter to active campaigns only
    const activeSteps = steps.filter((s) => activeSlugs.has(s.campaign));
    if (activeSteps.length === 0) return;

    // 2. Check if user is unsubscribed (globally or from any relevant campaign)
    const { data: unsubs } = await admin
      .from("email_unsubscribes")
      .select("campaign")
      .eq("user_id", userId);

    const globalUnsub = (unsubs ?? []).some((u) => !u.campaign);
    if (globalUnsub) return;

    const unsubCampaigns = new Set((unsubs ?? []).map((u) => u.campaign).filter(Boolean));

    // 3. Check which steps this user has already received
    const { data: priorSends } = await admin
      .from("email_campaign_sends")
      .select("campaign, step_key")
      .eq("user_id", userId);

    const sentKeys = new Set(
      (priorSends ?? []).map((s) => `${s.campaign}::${s.step_key}`)
    );

    // 4. Get user profile for audience checks and template vars
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, username, notes_count, installer_role")
      .eq("id", userId)
      .single();

    if (!profile) return;

    // 5. Get user email
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (!email) return;

    const displayName = profile.full_name || profile.username || "";

    // 6. Process each matching step
    for (const step of activeSteps) {
      // Skip if campaign-unsubscribed
      if (unsubCampaigns.has(step.campaign)) continue;

      // Skip if already sent
      if (sentKeys.has(`${step.campaign}::${step.step_key}`)) continue;

      // Check audience filter
      if (step.audience) {
        const aud = step.audience as Record<string, unknown>;
        if (aud.has_notes === true && (profile.notes_count ?? 0) === 0) continue;
        if (aud.no_notes === true && (profile.notes_count ?? 0) > 0) continue;
        if (typeof aud.min_notes === "number" && (profile.notes_count ?? 0) < aud.min_notes) continue;
        if (Array.isArray(aud.roles) && aud.roles.length > 0) {
          if (!aud.roles.includes(profile.installer_role)) continue;
        }
        if (aud.has_tint_notes === true) {
          const { count } = await admin.from("installer_notes").select("id", { count: "exact", head: true })
            .eq("user_id", userId).eq("note_type", "tint").eq("status", "approved");
          if (!count || count === 0) continue;
        }
        if (aud.has_ppf_notes === true) {
          const { count } = await admin.from("installer_notes").select("id", { count: "exact", head: true })
            .eq("user_id", userId).eq("note_type", "ppf").eq("status", "approved");
          if (!count || count === 0) continue;
        }
      }

      // Send the email
      const body = replaceTemplateVars(step.body_html, { username: displayName });
      const result = await sendEmail(
        email,
        step.subject,
        emailLayout(body, {
          unsubscribeUrl: unsubscribeUrl(userId, step.campaign),
          preheaderText: step.preview_text ?? undefined,
        })
      );

      // Record the send
      await admin.from("email_campaign_sends").insert({
        user_id: userId,
        campaign: step.campaign,
        step_key: step.step_key,
        status: result.success ? "sent" : "failed",
      });
    }
  } catch (err) {
    console.error("[campaign-events] Error firing event:", event, "for user:", userId, err);
  }
}
