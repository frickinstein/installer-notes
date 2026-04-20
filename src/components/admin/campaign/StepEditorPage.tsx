"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateCampaignStep,
  deleteCampaignStep,
  sendTestCampaignEmail,
  getAudienceCount,
} from "@/actions/admin";
import { AudienceEditor } from "./AudienceEditor";
import { EmailBodyEditor } from "./EmailBodyEditor";
import { SendConfirmModal } from "./SendConfirmModal";

/* eslint-disable @typescript-eslint/no-explicit-any */

const TRIGGER_TYPES = [
  { value: "delay_after_signup", label: "Days after signup" },
  { value: "delay_after_step", label: "Days after previous step" },
  { value: "on_event", label: "On event" },
] as const;

const EVENTS = [
  { value: "signup", label: "Signup" },
  { value: "note_submitted", label: "Note submitted" },
  { value: "note_approved", label: "Note approved" },
  { value: "note_rejected", label: "Note rejected" },
  { value: "rating_received", label: "Rating received" },
  { value: "first_note", label: "First note" },
  { value: "milestone_notes_5", label: "5 notes milestone" },
  { value: "milestone_notes_10", label: "10 notes milestone" },
];

const CHECKBOX_CLASS =
  "appearance-none h-4 w-4 shrink-0 rounded border border-border bg-surface-hover checked:bg-primary checked:border-primary cursor-pointer bg-no-repeat bg-center bg-[length:100%_100%] checked:bg-[url('data:image/svg+xml,%3csvg%20viewBox=%270%200%2016%2016%27%20fill=%27white%27%20xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath%20d=%27M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%27/%3e%3c/svg%3e')]";

export function StepEditorPage({
  campaign,
  step,
  allStepKeys,
}: {
  campaign: any;
  step: any;
  allStepKeys: string[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(step.subject ?? "");
  const [previewText, setPreviewText] = useState(step.preview_text ?? "");
  const [bodyHtml, setBodyHtml] = useState(step.body_html ?? "");
  const [triggerType, setTriggerType] = useState(
    step.trigger_type ?? "delay_after_signup"
  );
  const [delayDays, setDelayDays] = useState(step.delay_days ?? 0);
  const [triggerEvent, setTriggerEvent] = useState(step.trigger_event ?? "");
  const [afterStepKey, setAfterStepKey] = useState(step.after_step_key ?? "");
  const [audience, setAudience] = useState<any>(step.audience ?? null);
  const [isActive, setIsActive] = useState(step.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(step.sort_order ?? 1);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendModalCount, setSendModalCount] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function save() {
    setSaving(true);
    const result = await updateCampaignStep(step.id, {
      subject,
      preview_text: previewText || null,
      body_html: bodyHtml,
      trigger_type: triggerType,
      delay_days: delayDays,
      trigger_event: triggerType === "on_event" ? triggerEvent : null,
      after_step_key: triggerType === "delay_after_step" ? afterStepKey : null,
      audience,
      is_active: isActive,
      sort_order: sortOrder,
    });
    setSaving(false);
    if (result?.error) showMsg("error", result.error);
    else showMsg("success", "Saved");
  }

  async function testSend() {
    setTesting(true);
    const result: any = await sendTestCampaignEmail(step.id);
    setTesting(false);
    if (result?.error) showMsg("error", result.error);
    else if (result?.sentTo) {
      showMsg("success", `Test sent to ${result.sentTo}`);
    }
  }

  async function openSendModal() {
    const count = await getAudienceCount(audience);
    setSendModalCount(count);
    setShowSendModal(true);
  }

  async function sendToAll() {
    setSending(true);
    setShowSendModal(false);
    try {
      const res = await fetch("/api/admin/campaign-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "step", stepId: step.id }),
      });
      const result = await res.json();
      if (result.error) {
        showMsg("error", result.error);
      } else {
        const msg = result.failed
          ? `Sent to ${result.sent} users (${result.failed} failed)`
          : `Sent to ${result.sent} users`;
        showMsg("success", msg);
      }
    } catch {
      showMsg("error", "Request failed — check the console.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this step? This cannot be undone.")) return;
    const result = await deleteCampaignStep(step.id);
    if ("error" in result) {
      showMsg("error", result.error!);
    } else {
      router.push(`/admin/email/${campaign.name}`);
    }
  }

  const otherKeys = allStepKeys.filter((k) => k !== step.step_key);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => router.push(`/admin/email/${campaign.name}`)}
          className="text-text-muted hover:text-text transition-colors"
        >
          {campaign.displayName || campaign.name}
        </button>
        <span className="text-text-dim">/</span>
        <span className="text-text-bright font-medium truncate">
          {step.step_key}
        </span>
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {message.text}
        </p>
      )}

      {/* Two-column layout: editor left, settings right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column — subject + body */}
        <div className="lg:col-span-2 space-y-5">
          {/* Subject */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs text-text-dim font-medium uppercase tracking-wider">
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text mt-1.5 focus:border-primary/40 focus:outline-none transition-colors"
                placeholder="Email subject line..."
              />
            </div>

            <div>
              <label className="text-xs text-text-dim font-medium uppercase tracking-wider">
                Preview Text
              </label>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text mt-1.5 focus:border-primary/40 focus:outline-none transition-colors"
                placeholder="Inbox preview snippet (optional)..."
                maxLength={150}
              />
              <p className="text-[10px] text-text-dim mt-1">
                Shows as preview in email clients. Keep under 150 characters.
              </p>
            </div>
          </div>

          {/* Body editor — full width */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <label className="text-xs text-text-dim font-medium uppercase tracking-wider mb-3 block">
              Email Body
            </label>
            <EmailBodyEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              campaignName={campaign.name}
              stepPosition={sortOrder}
            />
          </div>
        </div>

        {/* Sidebar — trigger, audience, settings */}
        <div className="space-y-5">
          {/* Trigger config */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <p className="text-xs text-text-dim font-medium uppercase tracking-wider">
              Trigger
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {TRIGGER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTriggerType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    triggerType === t.value
                      ? "bg-primary text-white"
                      : "bg-surface-hover text-text-muted hover:text-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {triggerType === "delay_after_signup" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={delayDays}
                  onChange={(e) =>
                    setDelayDays(parseInt(e.target.value) || 0)
                  }
                  className="w-20 bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none"
                />
                <span className="text-sm text-text-muted">days after signup</span>
              </div>
            )}

            {triggerType === "delay_after_step" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={delayDays}
                    onChange={(e) =>
                      setDelayDays(parseInt(e.target.value) || 0)
                    }
                    className="w-20 bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none"
                  />
                  <span className="text-sm text-text-muted">days after</span>
                </div>
                <select
                  value={afterStepKey}
                  onChange={(e) => setAfterStepKey(e.target.value)}
                  className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none"
                >
                  <option value="">Select step...</option>
                  {otherKeys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {triggerType === "on_event" && (
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none"
              >
                <option value="">Select event...</option>
                {EVENTS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Audience */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <AudienceEditor audience={audience} onChange={setAudience} />
          </div>

          {/* Settings */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <p className="text-xs text-text-dim font-medium uppercase tracking-wider">
              Settings
            </p>
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className={CHECKBOX_CLASS}
              />
              Active
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted">Sort order:</label>
              <input
                type="number"
                min={1}
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
                className="w-16 bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar — sticky at bottom */}
      <div className="sticky bottom-0 bg-bg/80 backdrop-blur-sm border-t border-border -mx-4 px-4 py-4 flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={testSend}
          disabled={testing}
          className="px-4 py-2.5 bg-surface border border-border text-text-muted rounded-lg text-sm font-medium hover:text-text hover:border-primary/30 disabled:opacity-50 transition-colors"
        >
          {testing ? "Sending..." : "Send Test"}
        </button>
        <button
          onClick={openSendModal}
          disabled={sending}
          className="px-4 py-2.5 bg-surface border border-border text-text-muted rounded-lg text-sm font-medium hover:text-text hover:border-primary/30 disabled:opacity-50 transition-colors"
        >
          {sending ? "Sending..." : "Send to Eligible"}
        </button>

        <div className="flex-1" />

        <button
          onClick={handleDelete}
          className="px-4 py-2.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          Delete Step
        </button>
      </div>

      {showSendModal && (
        <SendConfirmModal
          recipientCount={sendModalCount}
          subject={subject}
          bodyPreviewHtml={bodyHtml}
          onConfirm={sendToAll}
          onCancel={() => setShowSendModal(false)}
          sending={sending}
        />
      )}
    </div>
  );
}
