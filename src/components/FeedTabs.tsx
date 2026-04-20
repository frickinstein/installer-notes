"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";

export function FeedTabs({
  notes,
  defaultTab,
  showTypeBadge,
}: {
  notes: any[];
  defaultTab: "tint" | "ppf";
  showTypeBadge: boolean;
}) {
  const tintNotes = notes.filter((n) => (n.note_type ?? "tint") === "tint");
  const ppfNotes  = notes.filter((n) => n.note_type === "ppf");

  const [activeTab, setActiveTab] = useState<"tint" | "ppf">(defaultTab);
  const activeNotes = activeTab === "tint" ? tintNotes : ppfNotes;

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
          {tintNotes.length > 0 && (
            <span className={`ml-1.5 text-xs font-normal ${activeTab === "tint" ? "opacity-80" : "opacity-60"}`}>
              ({tintNotes.length})
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
          {ppfNotes.length > 0 && (
            <span className={`ml-1.5 text-xs font-normal ${activeTab === "ppf" ? "opacity-80" : "opacity-60"}`}>
              ({ppfNotes.length})
            </span>
          )}
        </button>
      </div>

      {activeNotes.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <p className="text-text-muted">
            No {activeTab === "tint" ? "window tint" : "PPF"} notes yet. Be the first to submit one!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeNotes.map((note: any) => {
            const avgStars =
              note.installer_note_ratings?.length > 0
                ? (
                    note.installer_note_ratings.reduce((s: number, r: any) => s + r.stars, 0) /
                    note.installer_note_ratings.length
                  ).toFixed(1)
                : null;
            const overall  = note.installer_note_difficulty?.[0]?.overall;
            const profile  = note.profiles;
            const isPpf    = note.note_type === "ppf";

            return (
              <div
                key={note.id}
                className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover transition-colors"
              >
                {/* Author row */}
                <div className="flex items-center gap-3 mb-2">
                  <Link href={`/profile/${profile?.id ?? note.user_id}`} className="flex items-center gap-2.5 hover:opacity-80">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                        {(profile?.full_name ?? "?")[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-base font-bold text-text-bright">
                      {profile?.full_name ?? "Anonymous"}
                    </span>
                  </Link>
                  <span className="text-xs text-text-dim">
                    {new Date(note.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {showTypeBadge && (
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-md border ${
                      isPpf
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}>
                      {isPpf ? "PPF" : "Tint"}
                    </span>
                  )}
                </div>

                {/* Vehicle label + tip preview */}
                <Link href={`/vehicle/${note.group_id}`}>
                  {note.vehicleLabel && (
                    <p className="text-sm font-bold text-primary mb-1">{note.vehicleLabel}</p>
                  )}
                  <p className="text-sm text-text-bright line-clamp-2 mb-2">
                    {note.general_tips}
                  </p>
                </Link>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-text-dim">
                  {avgStars && <span className="text-yellow-400">{avgStars} ★</span>}
                  {overall != null && <span>Difficulty: {overall}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
