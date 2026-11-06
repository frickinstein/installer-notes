import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { getSiteType, getSiteName } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function ForgotPasswordPage() {
  const siteName = getSiteName(await getSiteType());
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-white text-2xl font-black">{siteName}</span>
          <p className="text-text-muted text-sm mt-2">Enter your email and we&apos;ll send you a reset link.</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <ForgotPasswordForm />
        </div>
        <p className="text-center text-xs text-text-dim mt-4">
          One login works everywhere — resetting here changes it for {siteName}, SnapTip, and all three installer note sites.
        </p>
      </div>
    </div>
  );
}
