import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignupBannerClient } from "./SignupBannerClient";

export async function SignupBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) return null;

  return (
    <div className="sticky top-14 z-40 bg-primary border-b border-primary/80">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-sm text-white font-medium">
          <span className="hidden sm:inline">Join thousands of installers sharing real-world tint tips. </span>
          <span className="sm:hidden">Join the community. </span>
          Create a free account to search vehicles and share notes.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="text-xs text-white/80 hover:text-white transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <SignupBannerClient />
        </div>
      </div>
    </div>
  );
}
