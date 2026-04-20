import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function POST() {
  // Verify admin session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("installer_role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.installer_role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const admin = adminClient();

  // Find approved notes with 5+ ratings
  const { data: notesWithRatings } = await admin
    .from("installer_notes")
    .select(`
      id, general_tips, group_id,
      installer_note_ratings (id, user_id, stars, review)
    `)
    .eq("status", "approved");

  const eligibleNotes = (notesWithRatings ?? []).filter(
    (n: any) => n.installer_note_ratings && n.installer_note_ratings.length >= 5
  );

  let notesChecked = 0;
  let outliersFound = 0;
  let auditsInserted = 0;

  for (const note of eligibleNotes) {
    notesChecked++;
    const ratings = note.installer_note_ratings as any[];
    const avg = ratings.reduce((s: number, r: any) => s + r.stars, 0) / ratings.length;

    // Find outliers: deviation > 2 stars from average
    const outliers = ratings.filter((r: any) => Math.abs(r.stars - avg) > 2);
    if (outliers.length === 0) continue;

    for (const outlier of outliers) {
      outliersFound++;

      // Check if already audited
      const { data: existing } = await admin
        .from("installer_rating_audits")
        .select("id")
        .eq("rating_id", outlier.id)
        .maybeSingle();

      if (existing) continue;

      // Get reviewer's rating history
      const { data: reviewerRatings } = await admin
        .from("installer_note_ratings")
        .select("stars")
        .eq("user_id", outlier.user_id);

      const { data: reviewerProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", outlier.user_id)
        .single();

      const totalRatings = reviewerRatings?.length ?? 0;
      const reviewerAvg = totalRatings > 0
        ? (reviewerRatings!.reduce((s: number, r: any) => s + r.stars, 0) / totalRatings).toFixed(1)
        : "N/A";

      // Ask Claude to assess
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `You are auditing ratings on a window tint installer knowledge base.

A note has an average rating of ${avg.toFixed(1)} from ${ratings.length} reviews. One review is an outlier:

Note content: "${note.general_tips.slice(0, 500)}"

Outlier review:
- Stars: ${outlier.stars}/5
- Review text: "${outlier.review}"
- Reviewer: ${reviewerProfile?.full_name ?? "Unknown"}
- Reviewer stats: ${totalRatings} total ratings given, average ${reviewerAvg} stars across all their reviews

Does this look like a genuine disagreement (the reviewer sincerely found the note unhelpful or excellent) or a suspicious/retaliatory rating? Consider the review text quality, the reviewer's pattern, and how far the rating deviates.

Respond with a 1-2 sentence summary assessment. Start with "GENUINE:" or "SUSPICIOUS:" followed by your reasoning.`,
          }],
        });

        const aiSummary = message.content[0].type === "text"
          ? message.content[0].text
          : "Unable to assess.";

        await admin.from("installer_rating_audits").insert({
          rating_id: outlier.id,
          note_id: note.id,
          note_avg_at_audit: parseFloat(avg.toFixed(2)),
          outlier_stars: outlier.stars,
          ai_summary: aiSummary,
        });

        auditsInserted++;
      } catch {
        // Skip this outlier if Claude call fails
      }
    }
  }

  return NextResponse.json({
    notes_checked: notesChecked,
    outliers_found: outliersFound,
    audits_inserted: auditsInserted,
  });
}
