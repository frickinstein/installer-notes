import { headers } from "next/headers";

// The three hosts this one deploy answers on. An auth email's link is built
// on the host the request arrived on so the person stays on their product —
// but only an allowlisted host, never the raw header (host-header injection
// would otherwise point a reset link at an attacker's domain).
const HOSTS = ["tintnotes.com", "ppfnotes.com", "installernotes.com"] as const;

const FALLBACK = process.env.NEXT_PUBLIC_SITE_URL ?? "https://installernotes.com";

/** `https://<allowlisted host>` for this request, else the configured site URL. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const raw = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].split(":")[0].trim().toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(raw)) return FALLBACK;
  const hit = HOSTS.find((d) => raw === d || raw === `www.${d}`);
  return hit ? `https://${raw}` : FALLBACK;
}
