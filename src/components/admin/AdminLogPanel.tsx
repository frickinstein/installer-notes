"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  approve_note: { label: "Approved Note", color: "text-green-400" },
  reject_note: { label: "Rejected Note", color: "text-red-400" },
  dismiss_report: { label: "Dismissed Report", color: "text-text-muted" },
  remove_review: { label: "Removed Review", color: "text-red-400" },
  dismiss_audit: { label: "Dismissed Audit", color: "text-text-muted" },
  change_role: { label: "Changed Role", color: "text-yellow-400" },
  suspend_user: { label: "Suspended User", color: "text-red-400" },
  unsuspend_user: { label: "Unsuspended User", color: "text-green-400" },
  run_audit: { label: "Ran AI Audit", color: "text-primary" },
};

export function AdminLogPanel({ log }: { log: any[] }) {
  if (log.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-muted">No admin actions logged yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide">When</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide">Who</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide">Action</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-dim uppercase tracking-wide hidden sm:table-cell">Details</th>
          </tr>
        </thead>
        <tbody>
          {log.map((entry) => {
            const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
            const actionInfo = ACTION_LABELS[entry.action] ?? { label: entry.action, color: "text-text-muted" };

            return (
              <tr key={entry.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-xs text-text-dim whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-sm text-text-bright">
                  {profile?.full_name ?? "Unknown"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${actionInfo.color}`}>
                    {actionInfo.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-text-dim hidden sm:table-cell max-w-[200px] truncate">
                  {entry.detail ?? `${entry.target_type}: ${entry.target_id.slice(0, 8)}...`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
