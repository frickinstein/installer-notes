"use client";

import { useActionState, startTransition, type FormEvent } from "react";
import Link from "next/link";
import { resetPassword, type ResetPasswordState } from "@/actions/auth";
import { PASSWORD_MIN } from "@/lib/password";

export function ResetPasswordForm({ email }: { email: string | null }) {
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(resetPassword, null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  if (!email) {
    return (
      <div className="text-center space-y-3">
        <p className="text-text-muted text-sm">
          This link has expired or was already used.
        </p>
        <Link href="/forgot-password" className="block text-sm text-primary hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        Choosing a new password for <span className="text-text-bright font-medium">{email}</span>.
      </p>
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-1">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN}
          autoComplete="new-password"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          placeholder={`At least ${PASSWORD_MIN} characters`}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-text-muted mb-1">
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? "Saving..." : "Set new password"}
      </button>
    </form>
  );
}
