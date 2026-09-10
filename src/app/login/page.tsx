import { LoginForm } from "@/components/LoginForm";
import { getSiteType, getSiteName } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Installer Notes",
};

export default async function LoginPage() {
  const siteType = await getSiteType();
  const siteName = getSiteName(siteType);

  const crossDomainNote =
    siteType === "tint" ? (
      <>
        Looking for PPF notes too?{" "}
        <a href="https://installernotes.com/login" className="underline hover:text-text-muted transition-colors">
          installernotes.com
        </a>{" "}
        shows both window tint and PPF in one place, or head to{" "}
        <a href="https://ppfnotes.com/login" className="underline hover:text-text-muted transition-colors">
          ppfnotes.com
        </a>{" "}
        to stay focused on PPF.
      </>
    ) : siteType === "ppf" ? (
      <>
        Looking for tint notes too?{" "}
        <a href="https://installernotes.com/login" className="underline hover:text-text-muted transition-colors">
          installernotes.com
        </a>{" "}
        shows both window tint and PPF in one place, or head to{" "}
        <a href="https://tintnotes.com/login" className="underline hover:text-text-muted transition-colors">
          tintnotes.com
        </a>{" "}
        to stay focused on tint.
      </>
    ) : (
      <>
        Prefer a focused experience?{" "}
        <a href="https://tintnotes.com/login" className="underline hover:text-text-muted transition-colors">
          tintnotes.com
        </a>{" "}
        defaults to window tint notes and{" "}
        <a href="https://ppfnotes.com/login" className="underline hover:text-text-muted transition-colors">
          ppfnotes.com
        </a>{" "}
        defaults to PPF — same account, same notes, just a different home base.
      </>
    );

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/snaptip-logo.png" alt={siteName} className="size-10 rounded-lg mx-auto mb-2" />
          <span className="text-white text-2xl font-black">{siteName}</span>
          <p className="text-text-muted text-sm mt-2">Sign in to your account</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-text-dim mt-4">
          One login works everywhere — {siteName}, SnapTip, and all three installer note sites share the same account.
        </p>
        <p className="text-center text-xs text-text-dim mt-2">
          {crossDomainNote}
        </p>
      </div>
    </div>
  );
}
