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
        : status === "draft"
          ? "bg-text-dim/10 text-text-dim border-border"
          : "bg-text-dim/10 text-text-dim border-border";

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${colors}`}
    >
      {status || "active"}
    </span>
  );
}

export function CampaignListClient({
  initialCampaigns,
}: {
  initialCampaigns: any[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    const result = await createCampaign(newName);
    setCreating(false);
    if ("error" in result) {
      setError(result.error!);
    } else {
      setNewName("");
      router.push(`/admin/email/${result.campaign}`);
    }
  }

  async function refresh() {
    const data = await listCampaigns();
    setCampaigns(data);
  }

  return (
    <div className="space-y-6">
      {/* Campaign grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-xl">
          <p className="text-text-muted text-sm">No campaigns yet.</p>
          <p className="text-text-dim text-xs mt-1">
            Create your first campaign below.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((c: any) => (
            <button
              key={c.name}
              onClick={() => router.push(`/admin/email/${c.name}`)}
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
                  {c.description && (
                    <p className="text-xs text-text-dim truncate">
                      {c.description}
                    </p>
                  )}
                </div>
                <span className="text-text-muted group-hover:text-text transition-colors text-lg">
                  &rsaquo;
                </span>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-border">
                <div>
                  <p className="text-lg font-bold text-text-bright">
                    {c.stepCount}
                  </p>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    Steps
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-text-bright">
                    {c.sendCount}
                  </p>
                  <p className="text-[10px] text-text-dim uppercase tracking-wider">
                    Sent
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create new campaign */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <p className="text-xs text-text-dim font-medium uppercase tracking-wider mb-3">
          New Campaign
        </p>
        {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Campaign name..."
            className="flex-1 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
