"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, listCampaigns } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "active"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : status === "paused"
        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        : "bg-text-dim/10 text-text-dim border-border";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${colors}`}>
      {status || "draft"}
    </span>
  );
}

export function SequencesClient({
  initialCampaigns,
  lists,
}: {
  initialCampaigns: any[];
  lists: any[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [newName, setNewName] = useState("");
  const [newListId, setNewListId] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    const result = await createCampaign(newName, newListId || null);
    setCreating(false);
    if ("error" in result) {
      setError(result.error!);
    } else {
      setNewName("");
      setNewListId("");
      setShowCreate(false);
      router.push(`/admin/email/sequences/${result.campaign}`);
    }
  }

  async function refresh() {
    const data = await listCampaigns();
    setCampaigns(data);
  }

  void refresh;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-bright">Sequences</h2>
          <p className="text-sm text-text-dim mt-0.5">Automated email drip campaigns and event-triggered emails.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + New Sequence
        </button>
      </div>

      {showCreate && (
        <div className="bg-surface border border-primary/20 rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-text-bright">New Sequence</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-text-dim uppercase tracking-wider">Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Welcome Series, Re-engagement..."
                className="w-full mt-1.5 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-dim uppercase tracking-wider">Target List (optional)</label>
              <select
                value={newListId}
                onChange={(e) => setNewListId(e.target.value)}
                className="w-full mt-1.5 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
              >
                <option value="">No list — uses per-step audience filters</option>
                {lists.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {creating ? "Creating..." : "Create Sequence"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setError(""); setNewName(""); setNewListId(""); }}
              className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <p className="text-text-muted text-sm">No sequences yet.</p>
          <p className="text-text-dim text-xs mt-1">Create your first email sequence above.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((c: any) => (
            <button
              key={c.name}
              onClick={() => router.push(`/admin/email/sequences/${c.name}`)}
              className="bg-surface border border-border rounded-xl p-5 text-left hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-text-bright group-hover:text-primary transition-colors truncate">
                      {c.displayName || c.name}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.listName ? (
                    <p className="text-xs text-text-dim truncate">→ {c.listName}</p>
                  ) : c.description ? (
                    <p className="text-xs text-text-dim truncate">{c.description}</p>
                  ) : (
                    <p className="text-xs text-text-dim">No list — per-step filters</p>
                  )}
                </div>
                <span className="text-text-muted group-hover:text-text transition-colors text-lg flex-shrink-0">
                  &rsaquo;
                </span>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-lg font-bold text-text-bright">{c.stepCount}</p>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">Steps</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-bright">{c.sendCount}</p>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">Sent</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
