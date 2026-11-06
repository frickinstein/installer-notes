"use client";

import { useActionState, startTransition, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword, type ForgotPasswordState } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(forgotPassword, null);

  // Submit through onSubmit, not <form action>: React 19 resets an uncontrolled
  // form after every action call, which wipes what was typed on an error.
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  if (state && "success" in state) {
    return (
      <div className="text-center space-y-3">
        <h2 className="text-text-bright text-xl font-bold">Check your inbox</h2>
        <p className="text-text-muted text-sm">
          If that address has an account, a reset link is on its way. It works once and expires in an hour.
        </p>
        <Link href="/login" className="block text-sm text-text-dim hover:text-primary transition-colors">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {state && "error" in state && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
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
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-sm text-text-dim text-center">
        Remembered it?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
