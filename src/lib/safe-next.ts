// The one check for post-verify `next=` targets (ported from SnapTip, S-12).
// Browsers read `/\evil.com` as `//evil.com` and strip tabs and newlines, so
// prefix tests aren't enough: parse against a fixed base and only keep a
// same-origin path. Pure — safe in client and server code.

const BASE = "https://same-origin.invalid";

export function safeNext(raw: unknown, fallback = "/search"): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 2048) return fallback;
  if (/[\\\u0000-\u001F\u007F]/.test(raw)) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  let u: URL;
  try {
    u = new URL(raw, BASE);
  } catch {
    return fallback;
  }
  if (u.origin !== BASE) return fallback;
  if (u.pathname.startsWith("//")) return fallback;
  return u.pathname + u.search + u.hash;
}
