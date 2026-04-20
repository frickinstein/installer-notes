import { getLeaderboard } from "@/actions/profiles";
import { getSiteType } from "@/lib/site";
import Link from "next/link";

export default async function Home() {
  const [leaders, siteType] = await Promise.all([
    getLeaderboard(5),
    getSiteType(),
  ]);

  const hero =
    siteType === "tint"
      ? {
          heading: (
            <>
              Vehicle installer notes,{" "}
              <span className="text-primary">by tinters</span>
            </>
          ),
          body: "A free community tool built for window tint installers. Look up any vehicle, learn from real-world install experiences, and share your own tips so the next person on the same car doesn't have to figure it out alone.",
        }
      : siteType === "ppf"
      ? {
          heading: (
            <>
              Vehicle PPF notes,{" "}
              <span className="text-primary">by installers</span>
            </>
          ),
          body: "A free community tool built for PPF installers. Look up any vehicle, learn from real-world installation experiences, and share your own tips so the next person wrapping the same car doesn't have to start from scratch.",
        }
      : {
          heading: (
            <>
              Install notes for{" "}
              <span className="text-primary">tinters and PPF installers</span>
            </>
          ),
          body: "A free community tool built for window tint and PPF installers. Look up any vehicle, find real-world tips from both sides of the shop, and share your own knowledge so the whole trade gets better together.",
        };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-text-bright tracking-tight mb-4">
            {hero.heading}
          </h1>
          <p className="text-lg text-text-muted mb-10 max-w-xl mx-auto">
            {hero.body}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-primary text-white font-bold px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors text-center"
            >
              Sign Up Free
            </Link>
            <Link
              href="/login"
              className="text-text-muted hover:text-text font-medium px-8 py-3 transition-colors"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-text-bright text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold text-text-bright mb-2">Create a free account</h3>
              <p className="text-sm text-text-muted">
                Sign up in seconds. No credit card, no trial — free forever.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold text-text-bright mb-2">Search any vehicle</h3>
              <p className="text-sm text-text-muted">
                Find tips, difficulty ratings, photos, and videos from real installers.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold text-text-bright mb-2">Share your knowledge</h3>
              <p className="text-sm text-text-muted">
                Add your own notes and help the community grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard preview */}
      {leaders.length > 0 && (
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-text-bright">Top Contributors</h2>
              <Link href="/leaderboard" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {leaders.map((user, i) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-3 bg-surface border border-border rounded-lg p-3 hover:bg-surface-hover transition-colors"
                >
                  <span className={`text-sm font-bold w-6 text-center ${i < 3 ? "text-primary" : "text-text-dim"}`}>
                    {i + 1}
                  </span>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {(user.full_name ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-text-bright flex-1 truncate">
                    {user.full_name ?? "Anonymous"}
                  </span>
                  <span className="text-sm font-bold text-text-muted">
                    {user.contributor_score.toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SnapTip promo */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm text-text-dim mb-2">Part of the SnapTip platform</p>
          <p className="text-text-muted text-sm">
            Installer Notes is free forever. SnapTip is an all-in-one business
            management app for tint, PPF, and coatings shops.{" "}
            <a
              href="https://snaptip.app"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
