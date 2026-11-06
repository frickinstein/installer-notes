"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { newPasswordError } from "@/lib/password";

export type AuthState = { error: string } | null;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

/** The Turnstile widget's token, for Supabase CAPTCHA. Absent while it's off. */
function captchaToken(formData: FormData): string | undefined {
  const token = formData.get("cf-turnstile-response");
  return typeof token === "string" && token ? token : undefined;
}

export async function signIn(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken: captchaToken(formData) },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const acceptedTerms = formData.get("accepted_terms") === "true";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const passwordError = newPasswordError(password);
  if (passwordError) {
    return { error: passwordError };
  }

  if (!acceptedTerms) {
    return { error: "You must agree to the Terms of Service and Privacy Policy." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || "",
        accepted_terms_at: new Date().toISOString(),
      },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
      captchaToken: captchaToken(formData),
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/signup/check-email");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Password reset ──────────────────────────────────────────────────────────
//
// Same pattern as SnapTip (its card `platform/auth-emails`): we mint the
// recovery token ourselves with admin.generateLink() and send it through
// Resend, branded as the site the request came in on. The link lands on OUR
// gated /auth/confirm page — inert until the person clicks, so inbox link
// scanners can't burn the one-time token — then /reset-password. Nothing here
// calls a Supabase API that sends email, so the shared project's email
// templates and redirect allowlist never come into play.

export type ForgotPasswordState = { error: string } | { success: true } | null;

export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  // Unknown emails error out of generateLink — swallowed on purpose: the
  // response is the same generic success either way (no account enumeration).
  try {
    const [{ adminClient }, { requestOrigin }, { getSiteType, getSiteName }, { sendEmail }, { passwordResetEmail }] =
      await Promise.all([
        import("@/lib/supabase/admin"),
        import("@/lib/site-host"),
        import("@/lib/site"),
        import("@/lib/email/send"),
        import("@/lib/email/templates/passwordReset"),
      ]);
    const siteName = getSiteName(await getSiteType());
    const origin = await requestOrigin();

    const { data, error } = await adminClient().auth.admin.generateLink({ type: "recovery", email });
    const tokenHash = data?.properties?.hashed_token;
    const type = data?.properties?.verification_type;
    if (!error && tokenHash && type) {
      const params = new URLSearchParams({ token_hash: tokenHash, type, next: "/reset-password" });
      const confirmUrl = `${origin}/auth/confirm?${params.toString()}`;
      const fullName = (data.user?.user_metadata as { full_name?: string } | null)?.full_name ?? null;
      await sendEmail(
        email,
        `Reset your ${siteName} password`,
        passwordResetEmail({ firstName: fullName?.split(" ")[0] ?? null, confirmUrl, siteName })
      );
    }
  } catch (err) {
    console.error("[auth] password reset email failed:", err);
  }

  return { success: true };
}

export type ResetPasswordState = { error: string } | null;

/** After /auth/confirm verified the recovery token (a session now exists). */
export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const password = (formData.get("password") as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";
  const passwordError = newPasswordError(password);
  if (passwordError) return { error: passwordError };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This link has expired. Request a fresh one with “Forgot password?” on the sign-in page." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // A new password ends every OTHER session: if the reset is because someone
  // else had the account, their session dies here too.
  await supabase.auth.signOut({ scope: "others" });

  redirect("/search");
}
