"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listCampaigns,
  createCampaign,
  updateCampaignStatus,
  getCampaignSteps,
  getCampaignStats,
  createCampaignStep,
  updateCampaignStep,
  deleteCampaignStep,
} from "@/actions/admin";
import { StepEditor } from "./campaign/StepEditor";
import { BroadcastPanel } from "./campaign/BroadcastPanel";
import { EventLogPanel } from "./campaign/EventLogPanel";
import { SendHistoryPanel } from "./campaign/SendHistoryPanel";

/* eslint-disable @typescript-eslint/no-explicit-any */

type View = "list" | "detail" | "broadcast" | "events" | "history";

// ─── Skeleton Loaders ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return <div className="h-16 bg-surface border border-border rounded-xl animate-pulse" />;
}

function SkeletonTimeline() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-surface border border-border rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ─── Campaign Stats Bar ───────────────────────────────────────────────────────

function CampaignStatsBar({ stats, steps }: { stats: any; steps: any[] }) {
  if (!stats) return null;

  const totalSteps = steps.length;
  const activeSteps = steps.filter((s: any) => s.is_active).length;
  const totalSendCount = steps.reduce((sum: number, s: any) => sum + (s.send_count ?? 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Audience", value: stats.totalUsers },
        { label: "Total Sends", value: totalSendCount },
        { label: "Active Steps", value: `${activeSteps}/${totalSteps}` },
        { label: "Tracked Sends", value: stats.totalSends },
      ].map((s) => (
        <div key={s.label} className="bg-surface border border-border rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-text-bright">{s.value}</p>
          <p className="text-[10px] text-text-dim uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "active" ? "bg-green-500/10 text-green-400" :
    status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
    status === "draft" ? "bg-text-dim/10 text-text-dim" :
    "bg-text-dim/10 text-text-dim";

  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${colors}`}>
      {status || "active"}
    </span>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function EmailCampaignPanel() {
  const [view, setView] = useState<View>("list");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [steps, setSteps] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const data = await listCampaigns();
    setCampaigns(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  async function openCampaign(name: string) {
    setSelectedCampaign(name);
    setView("detail");
    setEditingStep(null);
    setDetailLoading(true);
    const [s, st] = await Promise.all([getCampaignSteps(name), getCampaignStats(name)]);
    setSteps(s);
    setStats(st);
    setDetailLoading(false);
  }

  const refreshCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    const [s, st] = await Promise.all([getCampaignSteps(selectedCampaign), getCampaignStats(selectedCampaign)]);
    setSteps(s);
    setStats(st);
  }, [selectedCampaign]);

  async function handleCreateCampaign() {
    if (!newCampaignName.trim()) return;
    setCreating(true);
    const result = await createCampaign(newCampaignName);
    setCreating(false);
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      setNewCampaignName("");
      showMsg("success", `Campaign "${result.campaign}" created`);
      await fetchCampaigns();
      openCampaign(result.campaign!);
    }
  }

  async function handleSaveStep(updates: any) {
    if (!editingStep) return;

    if (editingStep.id) {
      const result = await updateCampaignStep(editingStep.id, updates);
      if ("error" in result) return result;
      const refreshed = await getCampaignSteps(selectedCampaign);
      setSteps(refreshed);
      return result;
    } else {
      if (!updates.subject?.trim()) return { error: "Subject is required." };
      const stepKey = updates.subject
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 40);

      const result = await createCampaignStep({
        campaign: selectedCampaign,
        step_key: stepKey,
        delay_days: updates.delay_days ?? 0,
        subject: updates.subject,
        preview_text: updates.preview_text,
        body_html: updates.body_html ?? "",
        sort_order: updates.sort_order ?? (steps.length + 1),
        trigger_type: updates.trigger_type,
        trigger_event: updates.trigger_event,
        after_step_key: updates.after_step_key,
        audience: updates.audience,
      });
      if ("error" in result) return result;
      const refreshed = await getCampaignSteps(selectedCampaign);
      setSteps(refreshed);
      setEditingStep(refreshed.find((s: any) => s.id === result.id) ?? null);
      return result;
    }
  }

  async function handleDeleteStep() {
    if (!editingStep?.id) return;
    const result = await deleteCampaignStep(editingStep.id);
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      setEditingStep(null);
      const refreshed = await getCampaignSteps(selectedCampaign);
      setSteps(refreshed);
    }
  }

  function triggerBadge(type: string) {
    switch (type) {
      case "delay_after_signup": return "D";
      case "delay_after_step": return "S";
      case "on_event": return "E";
      default: return "?";
    }
  }

  return (
    <div>
      {message && (
        <p className={`text-sm mb-4 ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
          {message.text}
        </p>
      )}

      {/* Sub-nav */}
      <div className="flex gap-2 mb-6">
        {([
          { key: "list" as View, label: "Campaigns", active: view === "list" || view === "detail" },
          { key: "broadcast" as View, label: "Broadcast", active: view === "broadcast" },
          { key: "events" as View, label: "Event Log", active: view === "events" },
          { key: "history" as View, label: "Send History", active: view === "history" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); if (tab.key === "list") setEditingStep(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab.active ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Broadcast */}
      {view === "broadcast" && <BroadcastPanel />}

      {/* Event Log */}
      {view === "events" && <EventLogPanel />}

      {/* Send History */}
      {view === "history" && <SendHistoryPanel />}

      {/* Campaign List */}
      {view === "list" && (
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
              {campaigns.length === 0 && (
                <p className="text-sm text-text-muted">No campaigns yet.</p>
              )}
              {campaigns.map((c: any) => (
                <button
                  key={c.name}
                  onClick={() => openCampaign(c.name)}
                  className="w-full bg-surface border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-bright">{c.displayName || c.name}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <span className="text-xs text-text-dim">{c.stepCount} steps &middot; {c.sendCount} sent</span>
                  </div>
                  {c.description && (
                    <p className="text-xs text-text-dim mt-1 truncate">{c.description}</p>
                  )}
                </button>
              ))}

              {/* New campaign */}
              <div className="flex gap-2">
                <input
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  placeholder="New campaign name..."
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCampaign()}
                />
                <button
                  onClick={handleCreateCampaign}
                  disabled={creating || !newCampaignName.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {creating ? "..." : "Create"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Campaign Detail */}
      {view === "detail" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView("list"); setEditingStep(null); fetchCampaigns(); }}
              className="text-sm text-text-muted hover:text-text"
            >
              &larr; Back
            </button>
            <h3 className="text-lg font-bold text-text-bright">
              {campaigns.find((c: any) => c.name === selectedCampaign)?.displayName || selectedCampaign}
            </h3>
            <select
              value={campaigns.find((c: any) => c.name === selectedCampaign)?.status || "active"}
              onChange={async (e) => {
                const result = await updateCampaignStatus(selectedCampaign, e.target.value);
                if ("error" in result) showMsg("error", result.error!);
                else {
                  showMsg("success", `Status updated to ${e.target.value}`);
                  fetchCampaigns();
                }
              }}
              className="bg-surface border border-border rounded px-2 py-1 text-xs text-text"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {detailLoading ? (
            <>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-surface border border-border rounded-lg animate-pulse" />
                ))}
              </div>
              <SkeletonTimeline />
            </>
          ) : (
            <>
              {/* Stats dashboard */}
              <CampaignStatsBar stats={stats} steps={steps} />

              {/* Step funnel — per-step breakdown */}
              <div className="space-y-2">
                {steps.map((step: any) => (
                  <button
                    key={step.id}
                    onClick={() => setEditingStep(step)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      editingStep?.id === step.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-surface hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded bg-surface-hover text-text-dim text-xs font-bold flex items-center justify-center" title={step.trigger_type}>
                        {triggerBadge(step.trigger_type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-bright font-medium truncate">{step.subject}</p>
                        <p className="text-xs text-text-dim">
                          {step.step_key}
                          {step.trigger_type === "delay_after_signup" && ` · ${step.delay_days}d after signup`}
                          {step.trigger_type === "delay_after_step" && ` · ${step.delay_days}d after ${step.after_step_key}`}
                          {step.trigger_type === "on_event" && ` · on ${step.trigger_event}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-text-dim">{step.send_count} sent</span>
                        <span className={`w-2 h-2 rounded-full ${step.is_active ? "bg-green-400" : "bg-text-dim"}`} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Add step button */}
              {!editingStep && (
                <button
                  onClick={() => setEditingStep({
                    campaign: selectedCampaign,
                    step_key: "",
                    subject: "",
                    body_html: "",
                    delay_days: 0,
                    sort_order: steps.length + 1,
                    trigger_type: "delay_after_signup",
                    trigger_event: null,
                    after_step_key: null,
                    audience: null,
                    is_active: true,
                  })}
                  className="w-full p-3 rounded-lg border border-dashed border-border text-text-muted text-sm hover:border-primary/30 hover:text-text transition-colors"
                >
                  + Add Step
                </button>
              )}

              {/* Step editor */}
              {editingStep && (
                <StepEditor
                  step={editingStep}
                  allStepKeys={steps.map((s: any) => s.step_key).filter(Boolean)}
                  campaignName={selectedCampaign}
                  onSave={handleSaveStep}
                  onDelete={handleDeleteStep}
                  onClose={() => setEditingStep(null)}
                  onRefresh={refreshCampaign}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
