"use client";

import { useState, useEffect } from "react";
import { getRecentEventSends } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

const EVENT_LABELS: Record<string, string> = {
  signup: "Signup",
  note_submitted: "Note submitted",
  note_approved: "Note approved",
  note_rejected: "Note rejected",
  rating_received: "Rating received",
  first_note: "First note",
  milestone_notes_5: "5 notes milestone",
  milestone_notes_10: "10 notes milestone",
};

const STATUS_COLORS: Record<string, string> = {
  sent: "text-blue-400",
  delivered: "text-green-400",
  bounced: "text-red-400",
  failed: "text-red-400",
  complained: "text-yellow-400",
};

export function EventLogPanel() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentEventSends(30).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-bold text-text-bright">Event Log</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-base font-bold text-text-bright">Event Log</h3>
        <p className="text-sm text-text-muted">
          No event-triggered emails have been sent yet. Create a campaign step with trigger type
          &quot;On event&quot; and events will appear here as they fire.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-text-bright">Event Log</h3>
      <p className="text-xs text-text-dim">Recent emails triggered by user events</p>
      <div className="space-y-1">
        {events.map((e: any) => (
          <div
            key={e.id}
            className="flex items-center gap-3 px-3 py-2 bg-surface border border-border rounded-lg text-sm"
          >
            <span className="flex-shrink-0 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
              {EVENT_LABELS[e.event] || e.event}
            </span>
            <span className="text-text-bright truncate flex-1">{e.userName}</span>
            <span className="text-xs text-text-dim truncate">{e.campaign}/{e.stepKey}</span>
            <span className={`text-xs font-medium ${STATUS_COLORS[e.status] || "text-text-dim"}`}>
              {e.status}
            </span>
            <span className="text-xs text-text-dim flex-shrink-0">
              {new Date(e.sentAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
