// The one rule for a NEW password — same as SnapTip's (shared auth project):
// every character allowed, at least 12, at most 72 bytes. Supabase hashes
// with bcrypt, which silently ignores everything past byte 72. Sign-in doesn't
// use this: passwords set under the old 8-character rule keep working.
export const PASSWORD_MIN = 12;

export function newPasswordError(password: string): string | null {
  if (password.length < PASSWORD_MIN) {
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  }
  if (new TextEncoder().encode(password).length > 72) {
    return "Password is too long (72 bytes at most).";
  }
  return null;
}
