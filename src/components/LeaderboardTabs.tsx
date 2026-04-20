"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";

export function LeaderboardTabs({
  leaders,
  tintUserIds,
  ppfUserIds,
  defaultTab,
}: {
  leaders: any[];
  tintUserIds: string[];
  ppfUserIds: string[];
  defaultTab: "tint" | "ppf";
}) {
  const [activeTab, setActiveTab] = useState<"tint" | "ppf">(defaultTab);

  const tintSet = new Set(tintUserIds);
  const ppfSet  = new Set(ppfUserIds);

  const tintLeaders = leaders.filter((u) => tintSet.has(u.id));
  const ppfLeaders  = leaders.filter((u) => ppfSet.has(u.id));
  const activeLeaders = activeTab === "tint" ? tintLeaders : ppfLeaders;

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex rounded-xl overflow-hidden border border-border mb-6">
        <button
          onClick={() => setActiveTab("tint")}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
            activeTab === "tint"
              ? "bg-primary text-white"
              : "bg-surface text-text-muted hover:text-text-bright"
          }`}
        >
          Window Tint
          {tintLeaders.length > 0 && (
            <span className={`ml-1.5 text-xs font-normal ${activeTab === "tint" ? "opacity-80" : "opacity-60"}`}>
              ({tintLeaders.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("ppf")}
          className={`flex-1 py-2.5 text-sm font-bold transition-colors border-l border-border ${
            activeTab === "ppf"
              ? "bg-primary text-white"
              : "bg-surface text-text-muted hover:text-text-bright"
          }`}
        >
          PPF
          {ppfLeaders.length > 0 && (
            <span className={`ml-1.5 text-xs font-normal ${activeTab === "ppf" ? "opacity-80" : "opacity-60"}`}>
              ({ppfLeaders.length})
            </span>
          )}
        </button>
      </div>

      {activeLeaders.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-muted">
            No {activeTab === "tint" ? "window tint" : "PPF"} contributors yet. Be the first to submit a note!
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide">Contributor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide hidden sm:table-cell">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide hidden sm:table-cell">Avg Rating</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide">Score</th>
              </tr>
            </thead>
            <tbody>
              {activeLeaders.map((user, i) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${i < 3 ? "text-primary" : "text-text-dim"}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2 hover:opacity-80">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {(user.full_name ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-text-bright truncate">
                        {user.full_name ?? "Anonymous"}
                      </span>
                    </Link>
                  </td>
                  <td className="text-right px-4 py-3 text-sm text-text-muted hidden sm:table-cell">
                    {user.notes_count}
                  </td>
                  <td className="text-right px-4 py-3 text-sm text-yellow-400 hidden sm:table-cell">
                    {user.avg_rating > 0 ? `${user.avg_rating.toFixed(1)} ★` : "—"}
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="text-sm font-bold text-text-bright">
                      {user.contributor_score.toFixed(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
