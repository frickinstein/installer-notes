import { getLeaderboard, getNoteTypeUserIds } from "@/actions/profiles";
import { getSiteType } from "@/lib/site";
import { LeaderboardTabs } from "@/components/LeaderboardTabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top window tint and PPF installers ranked by quality and volume of install notes.",
};

export default async function LeaderboardPage() {
  const [leaders, { tintUserIds, ppfUserIds }, siteType] = await Promise.all([
    getLeaderboard(50),
    getNoteTypeUserIds(),
    getSiteType(),
  ]);

  const defaultTab = siteType === "ppf" ? "ppf" : "tint";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-text-bright mb-2">Leaderboard</h1>
      <p className="text-text-muted mb-8">
        Top contributors ranked by quality and volume of install notes.
      </p>
      <LeaderboardTabs
        leaders={leaders}
        tintUserIds={tintUserIds}
        ppfUserIds={ppfUserIds}
        defaultTab={defaultTab}
      />
    </div>
  );
}
