import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, SITE_URL } from "./supabase";

type AuthValue = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthValue>({ session: null, loading: true });

export function useSession() {
  return useContext(AuthContext);
}

export function useUserId(): string | null {
  return useSession().session?.user.id ?? null;
}

/**
 * Where Supabase sends the email-confirmation link. The site's /auth/mobile page
 * bounces the ?code back into the app (custom scheme in a real build, exp:// in
 * Expo Go) — mail clients don't reliably linkify custom schemes, a web page does.
 */
export function emailRedirectTo(): string {
  const app = Linking.createURL("auth/callback");
  return `${SITE_URL}/auth/mobile?app=${encodeURIComponent(app)}`;
}

function codeFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = Linking.parse(url);
    const code = parsed.queryParams?.code;
    return typeof code === "string" ? code : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const url = Linking.useLinkingURL();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  // PKCE: the confirmation link lands here with ?code=; the verifier is on this device.
  useEffect(() => {
    const code = codeFromUrl(url);
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error || !data.user) return;
      const createdAt = data.user.created_at ? new Date(data.user.created_at).getTime() : 0;
      if (Date.now() - createdAt < 5 * 60 * 1000) {
        await supabase.from("profiles").update({ signup_domain: "tintnotes" }).eq("id", data.user.id);
        // The site's /auth/callback fires the drip's `signup` event; this is the app's equivalent.
        const token = data.session?.access_token;
        if (token) {
          fetch(`${SITE_URL}/api/mobile/signed-up`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        }
      }
    });
  }, [url]);

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}
