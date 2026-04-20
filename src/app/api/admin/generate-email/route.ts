import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an email copywriter for Installer Notes, a free community knowledge base for window tint, PPF, and coatings installers. Your job is to write campaign emails that get installers to engage with the platform.

ABOUT INSTALLER NOTES:
- Free tool where installers search vehicles by year/make/model and read installation notes from other professionals
- Users submit notes with tips, difficulty ratings per panel, photos, and videos
- Community rates and reviews each other's notes
- Leaderboard ranks top contributors by score
- Moderated — every note is reviewed before publishing

TONE:
- Direct, encouraging, peer-to-peer. Write like one installer talking to another.
- Never corporate, salesy, or overly polished
- Use contractions, casual language, short paragraphs
- Be genuine — acknowledge the work is hard, the tips are real, the community matters

EMAIL STYLE (you MUST use these exact inline styles):
- Headings: <h2 style="margin:0 0 16px;color:#F1F5F9;font-size:20px;font-weight:700">
- Body text: <p style="margin:0 0 16px;color:#94A3B8;line-height:1.7;font-size:15px">
- Emphasis: <strong style="color:#CBD5E1">
- Info cards: <div style="background:#0F172A;border:1px solid #2D3A4D;border-radius:8px;padding:16px 20px;margin:20px 0">
- Card label text: <p style="margin:0 0 8px;color:#CBD5E1;font-size:14px;font-weight:600">
- Bullet lists: <ul style="margin:0 0 16px;padding-left:20px"> with <li style="margin:0 0 8px;color:#94A3B8;line-height:1.6;font-size:15px">
- Dividers: <hr style="border:none;border-top:1px solid #2D3A4D;margin:24px 0" />
- Primary button (centered): <div style="text-align:center;margin:28px 0"><a href="URL" style="display:inline-block;background:#E31C23;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;letter-spacing:0.01em">LABEL</a></div>
- Secondary button: same wrapper, <a> with style="display:inline-block;background:transparent;color:#E31C23;text-decoration:none;padding:11px 27px;border-radius:8px;font-weight:700;font-size:14px;border:1px solid #E31C23"

TEMPLATE VARIABLES (use where appropriate):
- {{username_greeting}} — renders as ", Name" or empty if no name (use after "Hey" like: "Hey{{username_greeting}}")
- {{username}} — the user's display name
- {{site_url}} — base URL (https://installernotes.com)

IMPORTANT RULES:
- Return ONLY valid JSON with two keys: "subject" and "body_html"
- body_html is the inner content only (it gets wrapped in the email layout automatically)
- Use single quotes inside HTML attributes to avoid breaking the JSON (or escape double quotes)
- Keep emails concise — 3-6 short paragraphs max
- Include exactly one CTA button
- Use {{site_url}} in all links
- SQL single quotes in HTML must be escaped as '' (two single quotes) if this will be stored in PostgreSQL`;

export async function POST(request: NextRequest) {
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

  const { prompt, campaignName, stepPosition } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const userPrompt = `Write a campaign email for the "${campaignName || "general"}" campaign${stepPosition ? ` (email #${stepPosition} in the sequence)` : ""}.

The admin's instructions: ${prompt}

Return valid JSON only: { "subject": "...", "body_html": "..." }`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.subject || !parsed.body_html) {
      return NextResponse.json({ error: "AI response missing subject or body." }, { status: 500 });
    }

    return NextResponse.json({ subject: parsed.subject, body_html: parsed.body_html });
  } catch (err) {
    console.error("[generate-email] Anthropic API error:", err);
    return NextResponse.json({ error: "Failed to generate email." }, { status: 500 });
  }
}
