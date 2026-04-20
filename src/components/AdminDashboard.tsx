"use client";

import { useState } from "react";
import { AdminClient } from "./AdminClient";
import { ReportedReviewsPanel } from "./admin/ReportedReviewsPanel";
import { AuditPanel } from "./admin/AuditPanel";
import { UserManagementPanel } from "./admin/UserManagementPanel";
import { AdminLogPanel } from "./admin/AdminLogPanel";
import { VehicleEditorPanel } from "./admin/VehicleEditorPanel";
/* eslint-disable @typescript-eslint/no-explicit-any */

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "notes", label: "Flagged Notes" },
  { key: "reviews", label: "Reported Reviews" },
  { key: "audits", label: "AI Audits" },
  { key: "users", label: "Users" },
  { key: "campaigns", label: "Email Campaigns" },
  { key: "vehicles", label: "Vehicles" },
  { key: "log", label: "Activity Log" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function AdminDashboard({
  role,
  stats,
  flaggedNotes,
  reportedReviews,
  pendingAudits,
  adminLog,
}: {
  role: string;
  stats: any;
  flaggedNotes: any[];
  reportedReviews: any[];
  pendingAudits: any[];
  adminLog: any[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [notesCount, setNotesCount] = useState(flaggedNotes.length);
  const [reviewsCount, setReviewsCount] = useState(reportedReviews.length);
  const [auditsCount, setAuditsCount] = useState(pendingAudits.length);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-text-bright">Admin Dashboard</h1>
        <span className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 font-medium capitalize">
          {role}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const badge =
            t.key === "notes" ? notesCount :
            t.key === "reviews" ? reviewsCount :
            t.key === "audits" ? auditsCount :
            null;

          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "text-text-muted hover:bg-surface-hover hover:text-text"
              }`}
            >
              {t.label}
              {badge != null && badge > 0 && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  tab === t.key ? "bg-white/20" : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Vehicles" value={stats.vehicles.toLocaleString()} />
          <StatCard label="Approved Notes" value={stats.approvedNotes} />
          <StatCard label="Users" value={stats.users} />
          <StatCard label="Pending Notes" value={stats.pendingNotes} highlight={stats.pendingNotes > 0} />
          <StatCard label="Reported Reviews" value={stats.reportedReviews} highlight={stats.reportedReviews > 0} />
          <StatCard label="Pending Audits" value={stats.pendingAudits} highlight={stats.pendingAudits > 0} />
        </div>
      )}

      {tab === "notes" && <AdminClient notes={flaggedNotes} onCountChange={setNotesCount} />}
      {tab === "reviews" && <ReportedReviewsPanel reviews={reportedReviews} onCountChange={setReviewsCount} />}
      {tab === "audits" && <AuditPanel audits={pendingAudits} role={role} onCountChange={setAuditsCount} />}
      {tab === "users" && <UserManagementPanel callerRole={role} />}
      {tab === "campaigns" && role === "admin" && (
        <div className="text-center py-16 space-y-4">
          <p className="text-text-muted text-sm">Email campaigns have moved to their own section.</p>
          <a
            href="/admin/email"
            className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Open Email Management &rarr;
          </a>
        </div>
      )}
      {tab === "campaigns" && role !== "admin" && (
        <p className="text-sm text-text-muted">Only admins can manage email campaigns.</p>
      )}
      {tab === "vehicles" && role === "admin" && <VehicleEditorPanel />}
      {tab === "vehicles" && role !== "admin" && (
        <p className="text-sm text-text-muted">Only admins can import vehicles.</p>
      )}
      {tab === "log" && <AdminLogPanel log={adminLog} />}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <p className={`text-2xl font-black ${highlight ? "text-yellow-400" : "text-text-bright"}`}>
        {value}
      </p>
      <p className="text-xs text-text-dim">{label}</p>
    </div>
  );
}
