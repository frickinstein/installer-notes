import { searchProfiles } from "@/actions/profiles";
import Link from "next/link";
import type { Metadata } from "next";
import { CommunitySearch } from "./CommunitySearch";

export const metadata: Metadata = {
  title: "Community",
  description: "Browse and search Installer Notes contributors. Find installers, see their profiles, and read the vehicle install notes they've shared.",
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const profiles = await searchProfiles(q ?? "", 30);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-text-bright mb-2">Community</h1>
      <p className="text-text-muted mb-6">
        Find installers and check out their notes.
      </p>

      <CommunitySearch defaultValue={q ?? ""} />

      {profiles.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center mt-6">
          <p className="text-text-muted">
            {q ? `No contributors found for "${q}".` : "No contributors yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-6">
          {profiles.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3 hover:bg-surface-hover transition-colors"
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                  {(user.full_name ?? "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-bright truncate">
                  {user.full_name ?? "Anonymous"}
                </p>
                <p className="text-xs text-text-dim">
                  {user.notes_count} note{user.notes_count !== 1 ? "s" : ""}
                  {user.avg_rating > 0 && (
                    <span className="text-yellow-400 ml-2">{user.avg_rating.toFixed(1)} ★</span>
                  )}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-primary">{user.contributor_score.toFixed(1)}</p>
                <p className="text-[10px] text-text-dim">score</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
