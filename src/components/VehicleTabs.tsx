"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";
import { NoteCard } from "./NoteCard";
import { DifficultyPanel } from "./DifficultyPanel";

export function VehicleTabs({
  notes,
  currentUserId,
  supabaseUrl,
  groupId,
  defaultTab,
}: {
  notes: any[];
  currentUserId: string | null;
  supabaseUrl: string;
  groupId: string;
  defaultTab?: "tint" | "ppf";
}) {
  const tintNotes = notes.filter((n) => (n.note_type ?? "tint") === "tint");
  const ppfNotes  = notes.filter((n) => n.note_type === "ppf");

  // Honor domain default first, then fall back to whichever tab has notes
  const [activeTab, setActiveTab] = useState<"tint" | "ppf">(
    defaultTab ?? (ppfNotes.length > 0 && tintNotes.length === 0 ? "ppf" : "tint")
  );

  const activeNotes = activeTab === "tint" ? tintNotes : ppfNotes;
  const addHref = `/submit/${groupId}?type=${activeTab}`;

  return (
    <div>
      {/* Tint / PPF tab toggle */}
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

      {/* Difficulty summary for active tab */}
      <DifficultyPanel notes={activeNotes} noteType={activeTab} />

      {/* Notes feed */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-bright">
            {activeTab === "tint" ? "Tint" : "PPF"} Notes ({activeNotes.length})
          </h2>
          <Link
            href={addHref}
            className="text-sm font-semibold bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add New Note
          </Link>
        </div>

        {activeNotes.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <p className="text-text-muted mb-4">
              No {activeTab === "tint" ? "window tint" : "PPF"} notes for this vehicle yet.
            </p>
            <Link
              href={addHref}
              className="inline-block bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Be the first to add a note
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                currentUserId={currentUserId}
                supabaseUrl={supabaseUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
