"use client";

import { useState, useEffect } from "react";
import { getListCountBySlug } from "@/actions/admin";
import { EmailBodyEditor } from "./EmailBodyEditor";
import { SendConfirmModal } from "./SendConfirmModal";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function BroadcastPanel({ lists = [] }: { lists?: any[] }) {
  const [listSlug, setListSlug] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!listSlug) {
      setRecipientCount(null);
      return;
    }
    setRecipientCount(null);
    getListCountBySlug(listSlug).then(setRecipientCount);
  }, [listSlug]);

  function showMsg(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  }

  function openConfirm() {
    if (!listSlug) { showMsg("error", "Select a list first."); return; }
    if (!subject.trim()) { showMsg("error", "Subject is required."); return; }
    if (!bodyHtml.trim()) { showMsg("error", "Email body is required."); return; }
    setShowConfirm(true);
  }

  async function send() {
    setShowConfirm(false);
    setSending(true);
    try {
      const res = await fetch("/api/admin/campaign-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "broadcast",
          listSlug,
          subject,
          preview_text: previewText || null,
          body_html: bodyHtml,
        }),
      });
      const result = await res.json();
      if (result.error) {
        showMsg("error", result.error);
      } else {
        const msg = result.failed
          ? `Sent to ${result.sent} users (${result.failed} failed)`
          : `Broadcast sent to ${result.sent} users`;
        showMsg("success", msg);
        setSubject("");
        setPreviewText("");
        setBodyHtml("");
        setListSlug("");
      }
    } catch {
      showMsg("error", "Request failed — check the console.");
    } finally {
      setSending(false);
    }
  }

  const selectedList = lists.find((l) => l.slug === listSlug);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-text-bright">Send Broadcast</h3>
        <p className="text-sm text-text-muted mt-0.5">Write a one-off email and send it to a list.</p>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Subject + preview */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-text-dim">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1.5 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
                placeholder="Email subject line..."
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-text-dim">Preview Text</label>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full mt-1.5 bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
                placeholder="Inbox preview snippet (optional)..."
                maxLength={150}
              />
              <p className="text-[10px] text-text-dim mt-1">Shows as preview in email clients. Keep under 150 characters.</p>
            </div>
          </div>

          {/* Body editor */}
          <div className="bg-surface border border-border rounded-xl p-5">
            <label className="text-xs font-medium uppercase tracking-wider text-text-dim mb-3 block">
              Email Body
            </label>
            <EmailBodyEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              campaignName="broadcast"
              onSubjectGenerated={(s) => { if (!subject) setSubject(s); }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* List picker */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-text-dim">Send To</p>
            {lists.length === 0 ? (
              <p className="text-sm text-text-muted">
                No lists yet.{" "}
                <a href="/admin/email/lists" className="text-primary hover:underline">
                  Create a list
                </a>{" "}
                first.
              </p>
            ) : (
              <>
                <select
                  value={listSlug}
                  onChange={(e) => setListSlug(e.target.value)}
                  className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors"
                >
                  <option value="">Select a list...</option>
                  {lists.map((l: any) => (
                    <option key={l.slug} value={l.slug}>
                      {l.name} ({l.type})
                    </option>
                  ))}
                </select>
                {listSlug && (
                  <div className="pt-1">
                    <p className="text-sm text-text-muted">
                      Recipients:{" "}
                      <span className="text-text-bright font-semibold">
                        {recipientCount !== null ? recipientCount.toLocaleString() : "..."}
                      </span>
                    </p>
                    {selectedList?.type === "smart" && (
                      <p className="text-xs text-text-dim mt-1">
                        Smart list — count is approximate and excludes unsubscribes at send time.
                      </p>
                    )}
                  </div>
                )}
                <a
                  href="/admin/email/lists"
                  className="text-xs text-text-dim hover:text-primary transition-colors"
                >
                  Manage lists →
                </a>
              </>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={openConfirm}
            disabled={sending || !listSlug || !subject.trim() || !bodyHtml.trim()}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {sending ? "Sending..." : "Send Broadcast"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <SendConfirmModal
          recipientCount={recipientCount ?? 0}
          subject={subject}
          bodyPreviewHtml={bodyHtml}
          onConfirm={send}
          onCancel={() => setShowConfirm(false)}
          sending={sending}
        />
      )}
    </div>
  );
}
