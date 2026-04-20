import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteType, getSiteName } from "@/lib/site";
import { UserMenu } from "./UserMenu";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null; installer_role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, installer_role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const siteType = await getSiteType();
  const siteName = getSiteName(siteType);

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/snaptip-logo.png" alt={siteName} className="size-7 rounded" />
            <span className="text-white text-xl font-black tracking-tight">
              {siteName}
            </span>
          </Link>
          {user && (
            <Link
              href="/search"
              className="text-sm font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </Link>
          )}
          <Link
            href="/feed"
            className="text-sm text-text-muted hover:text-text transition-colors hidden sm:block"
          >
            Feed
          </Link>
          <Link
            href="/community"
            className="text-sm text-text-muted hover:text-text transition-colors hidden sm:block"
          >
            Community
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm text-text-muted hover:text-text transition-colors hidden sm:block"
          >
            Leaderboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu
              userId={user.id}
              fullName={profile?.full_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
              role={profile?.installer_role ?? "user"}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
