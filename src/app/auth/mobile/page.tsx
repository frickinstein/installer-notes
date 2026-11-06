"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function MobileAuthBridgePage() {
  return (
    <Suspense fallback={null}>
      <MobileAuthBridge />
    </Suspense>
  );
}

/**
 * Email-confirmation bridge for the Tint Notes phone app.
 *
 * The app signs up with `emailRedirectTo` pointing here (with `?app=` = its
 * own callback URL — `tintnotes://auth/callback` in a real build, `exp://…`
 * in Expo Go). Supabase appends `?code=` after the user taps the email link.
 * Mail clients don't reliably make custom-scheme links tappable, so this page
 * hands the code to the app instead. The PKCE verifier lives on the phone;
 * only the app can finish the exchange.
 */
function MobileAuthBridge() {
  const params = useSearchParams();
  const code = params.get("code");
  const app = params.get("app");
  const error = params.get("error_description") ?? params.get("error");

  const appUrl = useMemo(() => {
    if (!code || !app) return null;
    try {
      const u = new URL(app);
      if (!/^(tintnotes|exp|exps):$/.test(u.protocol)) return null;
      u.searchParams.set("code", code);
      return u.toString();
    } catch {
      return null;
    }
  }, [code, app]);

  useEffect(() => {
    if (appUrl) window.location.href = appUrl;
  }, [appUrl]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-black text-text-bright">Tint Notes</h1>
      {error ? (
        <p className="text-text-muted">That link didn&apos;t work: {error}. Try signing up again in the app.</p>
      ) : appUrl ? (
        <>
          <p className="text-text-muted">Your email is confirmed. Opening the app…</p>
          <a href={appUrl} className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-lg">
            Open Tint Notes
          </a>
          <p className="text-sm text-text-dim">If nothing happens, tap the button above on the phone you signed up from.</p>
        </>
      ) : (
        <p className="text-text-muted">This link is missing its code. Open the confirmation email on the phone you signed up from.</p>
      )}
    </div>
  );
}
