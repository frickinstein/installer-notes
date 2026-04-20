import { getRecentNotes } from "@/actions/notes";
import { getSiteType } from "@/lib/site";
import { FeedTabs } from "@/components/FeedTabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed",
  description: "See the latest window tint and PPF install notes shared by the Installer Notes community.",
};

export default async function FeedPage() {
  const [notes, siteType] = await Promise.all([
    getRecentNotes(60),
    getSiteType(),
  ]);

  const defaultTab = siteType === "ppf" ? "ppf" : "tint";
  const showTypeBadge = siteType === null; // only on installernotes.com

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-text-bright mb-2">Recent Notes</h1>
      <p className="text-text-muted mb-8">
        The latest install notes shared by the community.
      </p>
      <FeedTabs notes={notes} defaultTab={defaultTab} showTypeBadge={showTypeBadge} />
    </div>
  );
}
