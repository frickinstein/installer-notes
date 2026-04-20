"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function SendConfirmModal({
  recipientCount,
  subject,
  bodyPreviewHtml,
  onConfirm,
  onCancel,
  sending,
}: {
  recipientCount: number;
  subject: string;
  bodyPreviewHtml?: string;
  onConfirm: () => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const sampleHtml = (bodyPreviewHtml ?? "")
    .replace(/\{\{username_greeting\}\}/g, ", Alex")
    .replace(/\{\{username\}\}/g, "Alex")
    .replace(/\{\{site_url\}\}/g, "https://installernotes.com");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h3 className="text-lg font-bold text-text-bright">Confirm Send</h3>

        <div className="bg-surface-hover rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Recipients</span>
            <span className="text-text-bright font-bold text-lg">{recipientCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Subject</span>
            <span className="text-text-bright font-medium truncate ml-4">{subject}</span>
          </div>
        </div>

        {sampleHtml && (
          <div>
            <p className="text-xs text-text-dim mb-2">Email Preview</p>
            <div
              className="bg-[#1E293B] border border-[#2D3A4D] rounded-xl p-4 max-h-60 overflow-y-auto text-sm"
              dangerouslySetInnerHTML={{ __html: sampleHtml }}
            />
          </div>
        )}

        <p className="text-xs text-text-dim">
          This will send the email immediately to all eligible users who haven&apos;t received it yet. This action cannot be undone.
        </p>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onCancel}
            disabled={sending}
            className="px-4 py-2 text-sm text-text-muted hover:text-text disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {sending ? "Sending..." : `Send to ${recipientCount} users`}
          </button>
        </div>
      </div>
    </div>
  );
}
