import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { getSiteType, getSiteName } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
};

/**
 * Reached after /auth/confirm verified the recovery token (a session exists),
 * or by a signed-in user who asked for a reset (the proxy sends them here).
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const siteName = getSiteName(await getSiteType());

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-white text-2xl font-black">{siteName}</span>
          <p className="text-text-muted text-sm mt-2">Set a new password</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <ResetPasswordForm email={user?.email ?? null} />
        </div>
      </div>
    </div>
  );
}
