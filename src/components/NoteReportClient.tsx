"use client";

import { useActionState, useState } from "react";
import { reportNote, type NoteReportState } from "@/actions/notifications";
import { NOTE_REPORT_REASONS } from "@/lib/noteReportReasons";

/** "Report" on a note card (not your own). Mirrors the review report form. */
export function NoteReportClient({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [state, formAction, pending] = useActionState<NoteReportState, FormData>(
    async (_prev, fd) => {
      const result = await reportNote(_prev, fd);
      if (result && "success" in result) {
        setReported(true);
        setOpen(false);
      }
      return result;
    },
    null
  );

  if (reported) return <span className="text-xs text-text-dim">Reported — a moderator will review it</span>;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-text-dim hover:text-red-400 transition-colors"
      >
        {open ? "Cancel report" : "Report"}
      </button>

      {open && (
        <form action={formAction} className="mt-2 p-3 bg-bg border border-border rounded-lg">
          <input type="hidden" name="note_id" value={noteId} />
          {state && "error" in state && <p className="text-xs text-red-400 mb-2">{state.error}</p>}

          <div className="mb-3">
            <label className="block text-xs font-medium text-text-muted mb-1">Reason</label>
            <select
              name="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-bright focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
            >
              <option value="">Select a reason...</option>
              {NOTE_REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-text-muted mb-1">
              Details <span className="text-text-dim">(optional)</span>
            </label>
            <textarea
              name="reason_detail"
              rows={2}
              maxLength={500}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="What's wrong with this note?"
              className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-text-dim text-right mt-0.5">{detail.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={!reason || pending}
            className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {pending ? "..." : "Submit report"}
          </button>
        </form>
      )}
    </div>
  );
}
