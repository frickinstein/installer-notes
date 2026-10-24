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
