import Anthropic from "@anthropic-ai/sdk";

export type ModerationResult = { result: "approved" | "flagged"; reason: string };

const UNAVAILABLE: ModerationResult = {
  result: "flagged",
  reason: "Moderation service unavailable — queued for manual review.",
};

/**
 * AI check on a note's text. Flags on any doubt; a flagged note waits for a
 * mod. Shared by the website's /api/moderate-note and the phone app's
 * /api/mobile/submit-note.
 */
export async function moderateNote(input: {
  general_tips: string | null | undefined;
  tools_needed?: string | null;
  common_problems?: string | null;
}): Promise<ModerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) return UNAVAILABLE;
  if (!input.general_tips) return { result: "flagged", reason: "No content provided." };

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
General tips: ${input.general_tips}
Tools needed: ${input.tools_needed ?? "not provided"}
Common problems: ${input.common_problems ?? "not provided"}

Respond with JSON only, no other text:
{ "result": "approved" | "flagged", "reason": "brief reason if flagged, empty string if approved" }`,
        },
      ],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const parsed = JSON.parse(text) as Partial<ModerationResult>;
    return parsed.result === "approved"
      ? { result: "approved", reason: "" }
      : { result: "flagged", reason: parsed.reason ?? "" };
  } catch {
    return UNAVAILABLE;
  }
}
