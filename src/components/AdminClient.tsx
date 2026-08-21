"use client";

import { useState } from "react";
import { approveNote, rejectNote } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function AdminClient({ notes: initialNotes, onCountChange }: { notes: any[]; onCountChange?: (n: number) => void }) {
  const [notes, setNotes] = useState(initialNotes);
  const [acting, setActing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function removeNote(noteId: string) {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    onCountChange?.(updated.length);
  }

  function setError(noteId: string, message: string) {
    setErrors((prev) => ({ ...prev, [noteId]: message }));
  }

  function clearError(noteId: string) {
    setErrors((prev) => {
      if (!(noteId in prev)) return prev;
      const next = { ...prev };
      delete next[noteId];
      return next;
    });
  }

  async function act(noteId: string, fn: (id: string) => Promise<{ success?: boolean; error?: string }>) {
    setActing(noteId);
    clearError(noteId);
    try {
      const result = await fn(noteId);
      if (result?.success) {
        removeNote(noteId);
      } else {
        setError(noteId, result?.error ?? "Something went wrong. The note was not updated.");
      }
    } catch {
      setError(noteId, "Something went wrong. The note was not updated.");
    } finally {
      setActing(null);
    }
  }

  const handleApprove = (noteId: string) => act(noteId, approveNote);
  const handleReject = (noteId: string) => act(noteId, rejectNote);

  if (notes.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-muted">No notes pending review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => {
        const profile = Array.isArray(note.profiles) ? note.profiles[0] : note.profiles;
        const displayName = profile?.full_name ?? "Anonymous";
        const reports = note.installer_note_reports ?? [];

        return (
          <div key={note.id} className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-bright">{displayName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  note.status === "flagged"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                }`}>
                  {note.status}
                </span>
                {reports.length > 0 && (
                  <span className="text-xs text-red-400">
                    {reports.length} report{reports.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <span className="text-xs text-text-dim">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-text whitespace-pre-wrap mb-3">{note.general_tips}</p>

            {note.tools_needed && (
              <p className="text-sm text-text-muted mb-2">
                <strong className="text-text-dim">Tools:</strong> {note.tools_needed}
              </p>
            )}
            {note.common_problems && (
              <p className="text-sm text-text-muted mb-2">
                <strong className="text-text-dim">Problems:</strong> {note.common_problems}
              </p>
            )}

            {reports.length > 0 && (
              <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                <p className="text-xs font-semibold text-red-400 mb-1">Reports:</p>
                {reports.map((r: any) => (
                  <p key={r.id} className="text-xs text-text-dim">
                    {r.reason || "No reason given"} — {new Date(r.created_at).toLocaleDateString()}
                  </p>
                ))}
              </div>
            )}

            {errors[note.id] && (
              <p className="mt-3 text-sm text-red-400">{errors[note.id]}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleApprove(note.id)}
                disabled={acting === note.id}
                className="text-sm font-semibold bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(note.id)}
                disabled={acting === note.id}
                className="text-sm font-semibold bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
