"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/safe-next";

type EmailOtpType = "signup" | "invite" | "recovery" | "magiclink" | "email";

/**
 * Gated verification (ported from SnapTip). The emailed link carries
 * token_hash + type; loading this page verifies NOTHING — email security
 * scanners pre-fetch links and would burn the one-time token. It's spent only
 * when the human clicks, which fires verifyOtp() in the browser, establishes
 * the session, and forwards to `next` (same-origin path only).
 */
export function ConfirmClient() {
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const nextUrl = safeNext(params.get("next"), "/reset-password");

  const error =
    verifyError ??
    (!tokenHash || !type ? "This link is missing its verification code. Open the button link from your email directly." : null);

  async function handleConfirm() {
    if (!tokenHash || !type) return;
    setVerifyError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
      if (otpError) {
        setVerifyError("This link has expired or was already used. Request a new one from the sign-in page.");
        setLoading(false);
        return;
      }
    } catch {
      setVerifyError("Something went wrong verifying this link. Try once more; if it says expired, request a fresh one.");
      setLoading(false);
      return;
    }
    // Full load so the proxy and server components see the new session cookies.
    window.location.assign(nextUrl);
  }

  return (
    <div className="space-y-5 text-center">
      <div>
        <h1 className="text-text-bright text-2xl font-bold">One more step</h1>
        <p className="text-text-muted text-sm mt-2">Click below to verify it&rsquo;s really you and continue.</p>
      </div>
      {error ? (
        <>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 text-left">{error}</div>
          <Link href="/forgot-password" className="block text-sm text-text-dim hover:text-primary transition-colors">
            Request a new reset link
          </Link>
        </>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Continue to reset password"}
        </button>
      )}
    </div>
  );
}
