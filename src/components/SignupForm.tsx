"use client";

import { useActionState, useEffect } from "react";
import { signUp, type AuthState } from "@/actions/auth";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, null);

  useEffect(() => {
    trackEvent("signup_started");
  }, []);

  useEffect(() => {
    if (state && !("error" in state)) {
      trackEvent("signup_completed");
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-text-muted mb-1">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-muted mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          placeholder="At least 8 characters"
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="accepted_terms"
          value="true"
          required
          className="mt-0.5 rounded border-border bg-bg text-primary focus:ring-primary/50"
        />
        <span className="text-xs text-text-dim leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" target="_blank" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          , and confirm that I am using my real, full name.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create Free Account"}
      </button>

      <p className="text-sm text-text-dim text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
