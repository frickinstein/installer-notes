"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  updateCampaignStatus,
  getCampaignSteps,
  getCampaignStats,
  createCampaignStep,
  deleteCampaignStep,
} from "@/actions/admin";

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

function triggerLabel(step: any): string {
  if (step.trigger_type === "delay_after_signup")
    return `${step.delay_days}d after signup`;
  if (step.trigger_type === "delay_after_step")
    return `${step.delay_days}d after ${step.after_step_key}`;
  if (step.trigger_type === "on_event") return `on ${step.trigger_event}`;
  return step.trigger_type;
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
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export function CampaignDetailClient({
  campaign,
  initialSteps,
  initialStats,
}: {
  campaign: any;
  initialSteps: any[];
  initialStats: any;
}) {
  const router = useRouter();
  const [steps, setSteps] = useState(initialSteps);
  const [stats, setStats] = useState(initialStats);
  const [status, setStatus] = useState(campaign.status || "active");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [creatingStep, setCreatingStep] = useState(false);

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
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      setStatus(newStatus);
      showMsg("success", `Status updated to ${newStatus}`);
    }
  }

  async function handleAddStep() {
    setCreatingStep(true);
    const result = await createCampaignStep({
      campaign: campaign.name,
      step_key: `new_step_${Date.now()}`,
      delay_days: 0,
      subject: "New Step",
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
      router.push(
        `/admin/email/${campaign.name}/step/${result.id}`
      );
    }
  }

  async function handleDeleteStep(stepId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this step?")) return;
    const result = await deleteCampaignStep(stepId);
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      await refresh();
    }
  }

  const totalSendCount = steps.reduce(
    (sum: number, s: any) => sum + (s.send_count ?? 0),
    0
  );
  const activeSteps = steps.filter((s: any) => s.is_active).length;

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`text-sm ${message.type === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {message.text}
        </p>
      )}

      {/* Campaign header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text-bright">
            {campaign.displayName || campaign.name}
          </h2>
          <StatusBadge status={status} />
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

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Audience", value: stats?.totalUsers ?? 0 },
          { label: "Total Sends", value: totalSendCount },
          {
            label: "Active Steps",
            value: `${activeSteps}/${steps.length}`,
          },
          { label: "Tracked Sends", value: stats?.totalSends ?? 0 },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-xl p-4 text-center"
          >
            <p className="text-xl font-bold text-text-bright">{s.value}</p>
            <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Steps list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-text-dim font-medium uppercase tracking-wider">
            Steps
          </p>
          <button
            onClick={handleAddStep}
            disabled={creatingStep}
            className="text-xs text-primary hover:text-primary/80 font-medium disabled:opacity-50"
          >
            {creatingStep ? "Creating..." : "+ Add Step"}
          </button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-10 bg-surface border border-border rounded-xl">
            <p className="text-text-muted text-sm">No steps yet.</p>
            <p className="text-text-dim text-xs mt-1">
              Add your first email step to this campaign.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step: any, i: number) => (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-6 top-full w-px h-2 bg-border z-0" />
                )}
                <button
                  onClick={() =>
                    router.push(
                      `/admin/email/${campaign.name}/step/${step.id}`
                    )
                  }
                  className="w-full text-left p-4 rounded-xl border border-border bg-surface hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group"
                >
                  <div className="flex items-center gap-3">
                    {/* Step number */}
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-hover text-text-dim text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm text-text-bright font-medium truncate group-hover:text-primary transition-colors">
                          {step.subject}
                        </p>
                        <TriggerBadge type={step.trigger_type} />
                      </div>
                      <p className="text-xs text-text-dim">
                        {triggerLabel(step)}
                      </p>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-bright">
                          {step.send_count ?? 0}
                        </p>
                        <p className="text-[10px] text-text-dim">sent</p>
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${step.is_active ? "bg-green-400" : "bg-text-dim"}`}
                        title={step.is_active ? "Active" : "Inactive"}
                      />
                      <button
                        onClick={(e) => handleDeleteStep(step.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-red-400 transition-all p-1"
                        title="Delete step"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
