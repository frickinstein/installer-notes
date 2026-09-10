import { SignupForm } from "@/components/SignupForm";
import { getSiteType, getSiteName } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up — Installer Notes",
};

export default async function SignupPage() {
  const siteType = await getSiteType();
  const siteName = getSiteName(siteType);

  const crossDomainNote =
    siteType === "tint" ? (
      <>
        Your account also works on{" "}
        <a href="https://ppfnotes.com" className="underline hover:text-text-muted transition-colors">
          ppfnotes.com
        </a>{" "}
        and{" "}
        <a href="https://installernotes.com" className="underline hover:text-text-muted transition-colors">
          installernotes.com
        </a>{" "}
        — one login, all three sites.
      </>
    ) : siteType === "ppf" ? (
      <>
        Your account also works on{" "}
        <a href="https://tintnotes.com" className="underline hover:text-text-muted transition-colors">
          tintnotes.com
        </a>{" "}
        and{" "}
        <a href="https://installernotes.com" className="underline hover:text-text-muted transition-colors">
          installernotes.com
        </a>{" "}
        — one login, all three sites.
      </>
    ) : (
      <>
        Your account works across all three sites —{" "}
        <a href="https://tintnotes.com" className="underline hover:text-text-muted transition-colors">
          tintnotes.com
        </a>{" "}
        for a tint-first experience and{" "}
        <a href="https://ppfnotes.com" className="underline hover:text-text-muted transition-colors">
          ppfnotes.com
        </a>{" "}
        if PPF is more your thing.
      </>
    );

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/snaptip-logo.png" alt={siteName} className="size-10 rounded-lg mx-auto mb-2" />
          <span className="text-white text-2xl font-black">{siteName}</span>
          <p className="text-text-muted text-sm mt-2">Create your free account</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <SignupForm />
        </div>
        <p className="text-center text-xs text-text-dim mt-4">
          {crossDomainNote}
        </p>
      </div>
    </div>
  );
}
