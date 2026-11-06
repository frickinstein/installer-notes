import { Suspense } from "react";
import { getSiteType, getSiteName } from "@/lib/site";
import { ConfirmClient } from "./ConfirmClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirm",
};

/**
 * Where the password-reset email lands. Inert on load — the one-time token is
 * spent only when the person clicks (see ConfirmClient). Public: no session
 * exists yet.
 */
export default async function ConfirmPage() {
  const siteName = getSiteName(await getSiteType());
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-white text-2xl font-black">{siteName}</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <Suspense fallback={null}>
            <ConfirmClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
