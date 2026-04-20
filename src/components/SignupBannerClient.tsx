"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export function SignupBannerClient() {
  return (
    <Link
      href="/signup"
      onClick={() => trackEvent("signup_banner_clicked")}
      className="text-xs font-bold bg-white text-primary px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
    >
      Sign Up Free
    </Link>
  );
}
