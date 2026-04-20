"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEmailList } from "@/actions/admin";
import { SmartListFilterEditor } from "./SmartListFilterEditor";
import type { SmartListFilter } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
        type === "smart"
          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
          : "bg-text-dim/10 text-text-dim border-border"
      }`}
    >
      {type}
    </span>
  );
}

function filterSummary(filter: SmartListFilter): string {
  if (!filter) return "No filters";
  const parts: string[] = [];
  if (filter.has_notes) parts.push("has notes");
  if (filter.no_notes) parts.push("no notes");
  if (filter.min_notes) parts.push(`≥${filter.min_notes} notes`);
  if (filter.has_reviews) parts.push("has reviews");
  if (filter.no_reviews) parts.push("no reviews");
  if (filter.min_reviews) parts.push(`≥${filter.min_reviews} reviews`);
  if (filter.joined_within_days) parts.push(`joined <${filter.joined_within_days}d`);
  if (filter.joined_before_days) parts.push(`joined >${filter.joined_before_days}d`);
  if (filter.min_score) parts.push(`score ≥${filter.min_score}`);
  if (filter.roles?.length) parts.push(filter.roles.join(", "));
  return parts.length ? parts.join(" · ") : "All users";
}

export function ListsClient({ initialLists }: { initialLists: any[] }) {
  const router = useRouter();
  const [lists, setLists] = useState(initialLists);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"static" | "smart">("static");
  const [newFilter, setNewFilter] = useState<SmartListFilter>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    const result = await createEmailList(newName, newType, newType === "smart" ? newFilter : undefined);
    setCreating(false);
    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("slug" in result) {
      router.push(`/admin/email/lists/${result.slug}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* List grid */}
      {lists.length === 0 && !showCreate ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <p className="text-text-muted text-sm">No lists yet.</p>
          <p className="text-text-dim text-xs mt-1">Create your first list to start targeting campaigns.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.map((l: any) => (
            <button
              key={l.id}
              onClick={() => router.push(`/admin/email/lists/${l.slug}`)}
              className="bg-surface border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-bright group-hover:text-primary transition-colors truncate">
                      {l.name}
                    </span>
                    <TypeBadge type={l.type} />
                  </div>
                  {l.description && (
                    <p className="text-xs text-text-dim truncate mb-1">{l.description}</p>
                  )}
                  {l.type === "smart" && (
                    <p className="text-xs text-text-dim truncate">{filterSummary(l.filter)}</p>
                  )}
                </div>
                <span className="text-text-muted group-hover:text-text transition-colors text-lg flex-shrink-0">
                  &rsaquo;
                </span>
              </div>
              {l.type === "static" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-lg font-bold text-text-bright">{l.staticMemberCount ?? 0}</p>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">Members</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate ? (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-dim">New List</p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <label className="text-xs text-text-dim">List Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Newsletter, Power Contributors..."
              className="w-full mt-1 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-text-dim block mb-2">List Type</label>
            <div className="flex gap-2">
              {(["static", "smart"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    newType === t
                      ? "bg-primary text-white"
                      : "bg-surface-hover text-text-muted hover:text-text"
                  }`}
                >
                  {t === "static" ? "Static (manual)" : "Smart (filtered)"}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-dim mt-1.5">
              {newType === "static"
                ? "You manually add/remove members."
                : "Members are determined by filter rules at send time."}
            </p>
          </div>

          {newType === "smart" && (
            <div className="border border-border rounded-xl p-4">
              <SmartListFilterEditor filter={newFilter} onChange={setNewFilter} />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {creating ? "Creating..." : "Create List"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setError(""); setNewName(""); setNewFilter(null); }}
              className="px-4 py-2.5 text-text-muted hover:text-text text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 border border-dashed border-border rounded-xl text-sm text-text-muted hover:text-text hover:border-primary/30 transition-colors"
        >
          + New List
        </button>
      )}
    </div>
  );
}
