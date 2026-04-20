"use client";

import { useState } from "react";
import { SendHistoryPanel } from "@/components/admin/campaign/SendHistoryPanel";
import { EventLogPanel } from "@/components/admin/campaign/EventLogPanel";

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"history" | "events">("history");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-bright">Analytics</h2>
        <p className="text-sm text-text-dim mt-0.5">Send history and event-triggered email log.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["history", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg relative ${
              tab === t
                ? "text-primary bg-primary/5"
                : "text-text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            {t === "history" ? "Send History" : "Event Log"}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div>
        {tab === "history" ? <SendHistoryPanel /> : <EventLogPanel />}
      </div>
    </div>
  );
}
