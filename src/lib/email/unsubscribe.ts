import { createHmac } from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

/**
 * Generate a signed unsubscribe token.
 * Format: base64url(userId:campaign:timestamp:signature)
 * No external JWT library needed — just HMAC-SHA256.
 */
// UNSUBSCRIBE_SECRET is the signing secret. Until it is set, the legacy Supabase
// service-role key is used, which is what every link already mailed was signed
// with. Set UNSUBSCRIBE_SECRET to that same value before the legacy key is
// removed, or old unsubscribe links stop working. SnapTip's
// scripts/email-founding-push.mjs signs with the same secret.
function getSecret(): string {
  return (
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-secret"
  );
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function createUnsubscribeToken(
  userId: string,
  campaign: string | null
): string {
  const payload = `${userId}:${campaign ?? "all"}`;
  const sig = sign(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyUnsubscribeToken(
  token: string
): { userId: string; campaign: string | null } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");

    // Format: userId:campaign:signature
    if (parts.length !== 3) return null;

    const [userId, campaignRaw, sig] = parts;
    const payload = `${userId}:${campaignRaw}`;
    const expected = sign(payload);

    if (sig !== expected) return null;

    return {
      userId,
      campaign: campaignRaw === "all" ? null : campaignRaw,
    };
  } catch {
    return null;
  }
}

/**
 * Generate the unsubscribe URL for a given user/campaign.
 */
export function unsubscribeUrl(
  userId: string,
  campaign: string | null
): string {
  const token = createUnsubscribeToken(userId, campaign);
  return `${SITE_URL}/unsubscribe?token=${token}`;
}
