import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Check Your Email — Installer Notes",
};

export default function CheckEmailPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <img src="/snaptip-logo.png" alt="Installer Notes" className="size-10 rounded-lg mx-auto mb-2" />
        <span className="text-white text-2xl font-black">Installer Notes</span>
        <div className="bg-surface border border-border rounded-xl p-8 mt-8">
          <h2 className="text-xl font-bold text-text-bright mb-3">Check your email</h2>
          <p className="text-text-muted text-sm mb-6">
            We sent a confirmation link to your email address. Click the link to
            activate your account.
          </p>
          <Link
            href="/login"
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
