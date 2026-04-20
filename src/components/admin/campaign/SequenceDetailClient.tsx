"use client";

import { useState, useCallback } from "react";
import {
  updateCampaignStatus,
  getCampaignSteps,
  getCampaignStats,
  createCampaignStep,
  updateCampaignStep,
  deleteCampaignStep,
} from "@/actions/admin";
import { StepEditor } from "./StepEditor";

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

function TriggerBadge({ type }: { type: string }) {
  const config =
    type === "delay_after_signup"
      ? { label: "Delay", color: "bg-blue-500/10 text-blue-400" }
      : type === "delay_after_step"
        ? { label: "Sequence", color: "bg-purple-500/10 text-purple-400" }
        : type === "on_event"
          ? { label: "Event", color: "bg-amber-500/10 text-amber-400" }
          : { label: "?", color: "bg-text-dim/10 text-text-dim" };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${config.color}`}>
      {config.label}
    </span>
  );
}

function triggerLabel(step: any): string {
  if (step.trigger_type === "delay_after_signup") return `${step.delay_days}d after signup`;
  if (step.trigger_type === "delay_after_step") return `${step.delay_days}d after ${step.after_step_key}`;
  if (step.trigger_type === "on_event") return `on ${step.trigger_event}`;
  return step.trigger_type;
}

export function SequenceDetailClient({
  campaign,
  initialSteps,
  initialStats,
}: {
  campaign: any;
  initialSteps: any[];
  initialStats: any;
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState(campaign.status || "draft");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialSteps.length > 0 ? initialSteps[0].id : null
  );
  const [creatingStep, setCreatingStep] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  const refresh = useCallback(async () => {
    const [s, st] = await Promise.all([
      getCampaignSteps(campaign.name),
      getCampaignStats(campaign.name),
    ]);
    setSteps(s);
    setStats(st);
  }, [campaign.name]);

  async function handleStatusChange(newStatus: string) {
    const result = await updateCampaignStatus(campaign.name, newStatus);
    if ("error" in result) showMsg("error", result.error!);
    else { setStatus(newStatus); showMsg("success", `Status updated to ${newStatus}`); }
  }

  async function handleAddStep() {
    setCreatingStep(true);
    const result = await createCampaignStep({
      campaign: campaign.name,
      step_key: `step_${Date.now()}`,
      delay_days: 0,
      subject: "New Email",
      preview_text: null,
      body_html: "",
      sort_order: steps.length + 1,
      trigger_type: "delay_after_signup",
      trigger_event: null,
      after_step_key: null,
      audience: null,
    });
    setCreatingStep(false);
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      await refresh();
      setSelectedStepId(result.id ?? null);
    }
  }

  async function handleDeleteStep(stepId: string) {
    const result = await deleteCampaignStep(stepId);
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      if (selectedStepId === stepId) setSelectedStepId(null);
      await refresh();
    }
  }

  async function handleSaveStep(stepId: string, updates: any) {
    const result = await updateCampaignStep(stepId, updates);
    if (!("error" in result)) await refresh();
    return result;
  }

  const selectedStep = steps.find((s: any) => s.id === selectedStepId);
  const allStepKeys = steps.map((s: any) => s.step_key);
  const totalSendCount = steps.reduce((sum: number, s: any) => sum + (s.send_count ?? 0), 0);

  return (
    <div className="space-y-5">
      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
          {message.text}
        </p>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <a href="/admin/email/sequences" className="text-sm text-text-dim hover:text-text transition-colors">
              Sequences
            </a>
            <span className="text-text-dim">/</span>
            <h2 className="text-lg font-bold text-text-bright">
              {campaign.displayName || campaign.name}
            </h2>
            <StatusBadge status={status} />
          </div>
          {campaign.listName && (
            <p className="text-xs text-text-dim">
              Targeting list:{" "}
              <a href={`/admin/email/lists/${campaign.listSlug}`} className="text-primary hover:underline">
                {campaign.listName}
              </a>
            </p>
          )}
        </div>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Audience", value: stats?.totalUsers ?? 0 },
          { label: "Steps", value: steps.length },
          { label: "Active Steps", value: steps.filter((s: any) => s.is_active).length },
          { label: "Total Sent", value: totalSendCount },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-text-bright">{s.value}</p>
            <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[500px]">
        {/* Step list — left 2 cols */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Steps</p>
            <button
              onClick={handleAddStep}
              disabled={creatingStep}
              className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
            >
              {creatingStep ? "Adding..." : "+ Add Step"}
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <p className="text-text-muted text-sm">No steps yet.</p>
                <p className="text-text-dim text-xs mt-1">Add your first email step.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {steps.map((step: any, i: number) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all group ${
                    selectedStepId === step.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-transparent hover:border-border hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded bg-surface-hover text-text-dim text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-medium text-text-bright truncate">
                          {step.subject}
                        </p>
                        <TriggerBadge type={step.trigger_type} />
                      </div>
                      <p className="text-[10px] text-text-dim">{triggerLabel(step)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${step.is_active ? "bg-green-400" : "bg-text-dim"}`}
                        title={step.is_active ? "Active" : "Inactive"}
                      />
                      <span className="text-[10px] text-text-dim">{step.send_count ?? 0}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step editor — right 3 cols */}
        <div className="lg:col-span-3">
          {selectedStep ? (
            <StepEditor
              step={selectedStep}
              allStepKeys={allStepKeys}
              campaignName={campaign.name}
              onSave={(updates) => handleSaveStep(selectedStep.id, updates)}
              onDelete={() => handleDeleteStep(selectedStep.id)}
              onClose={() => setSelectedStepId(null)}
              onRefresh={refresh}
            />
          ) : (
            <div className="h-full bg-surface border border-border rounded-xl flex items-center justify-center text-center p-10">
              <div>
                <p className="text-text-muted text-sm">Select a step to edit</p>
                <p className="text-text-dim text-xs mt-1">or add a new step to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
