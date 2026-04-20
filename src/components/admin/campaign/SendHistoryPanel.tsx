"use client";

import { useState, useEffect } from "react";
import { adminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

// We'll call a server action for this — define it inline since it's specific to this panel
async function fetchSendHistory(filters: {
  campaign?: string;
  status?: string;
  page: number;
}): Promise<{ sends: any[]; total: number }> {
  const res = await fetch("/api/admin/send-history?" + new URLSearchParams({
    page: String(filters.page),
    ...(filters.campaign ? { campaign: filters.campaign } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }));
  if (!res.ok) return { sends: [], total: 0 };
  return res.json();
}

const STATUS_COLORS: Record<string, string> = {
  sent: "text-blue-400",
  delivered: "text-green-400",
  bounced: "text-red-400",
  failed: "text-red-400",
  complained: "text-yellow-400",
};

export function SendHistoryPanel() {
  const [sends, setSends] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchSendHistory({
      campaign: filterCampaign || undefined,
      status: filterStatus || undefined,
      page,
    }).then((data) => {
      setSends(data.sends);
      setTotal(data.total);
      setLoading(false);
    });
  }, [page, filterCampaign, filterStatus]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-text-bright">Send History</h3>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={filterCampaign}
          onChange={(e) => { setFilterCampaign(e.target.value); setPage(1); }}
          placeholder="Filter by campaign..."
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text w-48"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text"
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="bounced">Bounced</option>
          <option value="failed">Failed</option>
          <option value="complained">Complained</option>
        </select>
        <span className="text-xs text-text-dim self-center">{total} total</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-surface border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : sends.length === 0 ? (
        <p className="text-sm text-text-muted">No sends match this filter.</p>
      ) : (
        <div className="space-y-1">
          {sends.map((s: any) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3 py-2 bg-surface border border-border rounded-lg text-sm"
            >
              <span className="text-text-bright truncate w-32">{s.userName}</span>
              <span className="text-xs text-text-dim truncate flex-1">{s.campaign} / {s.stepKey}</span>
              <span className={`text-xs font-medium w-16 ${STATUS_COLORS[s.status] || "text-text-dim"}`}>
                {s.status}
              </span>
              <span className="text-xs text-text-dim flex-shrink-0 w-28 text-right">
                {new Date(s.sentAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-xs text-text-muted hover:text-text disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-xs text-text-dim">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-xs text-text-muted hover:text-text disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
