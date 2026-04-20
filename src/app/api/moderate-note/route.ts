import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const FLAGGED_RESPONSE = { result: "flagged", reason: "Moderation service unavailable — queued for manual review." };

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(FLAGGED_RESPONSE);
  }

  const { general_tips, tools_needed, common_problems } = await req.json();

  if (!general_tips) {
    return NextResponse.json({ result: "flagged", reason: "No content provided." });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are a content moderator for a window tint installer knowledge base called Installer Notes.
Review the following installer note and determine if it should be approved or flagged.

Flag the note if it contains any of:
- Spam or promotional content unrelated to window tint installation
- Offensive, abusive, or inappropriate language
- Content completely unrelated to vehicle window tint installation
- Dangerous or harmful advice

Approve the note if it contains genuine installation tips, techniques, tools, or vehicle-specific advice — even if brief or informal.

Note content:
General tips: ${general_tips}
Tools needed: ${tools_needed ?? "not provided"}
Common problems: ${common_problems ?? "not provided"}

Respond with JSON only, no other text:
{ "result": "approved" | "flagged", "reason": "brief reason if flagged, empty string if approved" }`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "{}";
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json(FLAGGED_RESPONSE);
  }
}
