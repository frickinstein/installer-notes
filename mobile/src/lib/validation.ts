// Same rules as the website (src/actions/notes.ts, src/lib/password.ts).
export const MAX_PHOTOS = 5;
export const MIN_TIPS = 20;
export const PASSWORD_MIN = 12;

export function newPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (new TextEncoder().encode(password).length > 72) return "Password is too long (72 bytes at most).";
  return null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isValidYoutubeUrl(url: string) {
  const h = hostOf(url);
  return h === "www.youtube.com" || h === "youtube.com" || h === "youtu.be" || h === "www.youtu.be";
}

export function isValidFacebookUrl(url: string) {
  const h = hostOf(url);
  return h === "www.facebook.com" || h === "facebook.com" || h === "fb.watch" || h === "www.fb.watch";
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function yearRange(years: number[]) {
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? `${min}` : `${min}–${max}`;
}
