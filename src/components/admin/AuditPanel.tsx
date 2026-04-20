"use client";

import { useState } from "react";
import { markAuditReviewed, removeReview, triggerAudit, canRunAudit } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function AuditPanel({ audits: initial, role, onCountChange }: { audits: any[]; role: string; onCountChange?: (n: number) => void }) {
  const [audits, setAudits] = useState(initial);
  const [acting, setActing] = useState<string | null>(null);
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  async function handleRunAudit() {
    setAuditRunning(true);
    setAuditResult(null);
    setAuditError(null);

    const check = await canRunAudit();
    if (!check.canRun) {
      setAuditError(check.waitMinutes
        ? `Cooldown active. Try again in ${check.waitMinutes} minute${check.waitMinutes !== 1 ? "s" : ""}.`
        : "Cannot run audit."
      );
      setAuditRunning(false);
      return;
    }

    const result = await triggerAudit();
    if (result.error) {
      setAuditError(result.error);
    } else {
      setAuditResult(
        `Checked ${result.notes_checked} notes. Found ${result.outliers_found} outliers. Inserted ${result.audits_inserted} new audits.`
      );
    }
    setAuditRunning(false);
  }

  function removeAudit(auditId: string) {
    const updated = audits.filter((a) => a.id !== auditId);
    setAudits(updated);
    onCountChange?.(updated.length);
  }

  async function handleDismiss(auditId: string) {
    setActing(auditId);
    const result = await markAuditReviewed(auditId);
    if (result && !("error" in result)) {
      removeAudit(auditId);
    }
    setActing(null);
  }

  async function handleRemove(auditId: string, ratingId: string) {
    setActing(auditId);
    const result = await removeReview(ratingId);
    if (result && !("error" in result)) {
      await markAuditReviewed(auditId);
      removeAudit(auditId);
    }
    setActing(null);
  }

  return (
    <div>
      {/* Audit trigger */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-bright">AI Rating Audit</h3>
            <p className="text-xs text-text-dim mt-1">
              Scans notes with 5+ ratings for suspicious outliers.
              {role === "mod" && " Moderators can run this once per hour."}
              {role === "admin" && " Admins have no cooldown."}
            </p>
          </div>
          <button
            onClick={handleRunAudit}
            disabled={auditRunning}
            className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {auditRunning ? "Running..." : "Run Audit"}
          </button>
        </div>
        {auditResult && (
          <p className="text-sm text-green-400 mt-3">{auditResult}</p>
        )}
        {auditError && (
          <p className="text-sm text-red-400 mt-3">{auditError}</p>
        )}
      </div>

      {/* Pending audits */}
      {audits.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-text-muted">No pending audit items.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {audits.map((audit) => {
            const rating = Array.isArray(audit.installer_note_ratings)
              ? audit.installer_note_ratings[0]
              : audit.installer_note_ratings;
            const reviewerProfile = rating?.profiles
              ? (Array.isArray(rating.profiles) ? rating.profiles[0] : rating.profiles)
              : null;
            const noteSnippet = Array.isArray(audit.installer_notes)
              ? audit.installer_notes[0]?.general_tips
              : audit.installer_notes?.general_tips;

            const isSuspicious = audit.ai_summary?.startsWith("SUSPICIOUS:");

            return (
              <div key={audit.id} className="bg-surface border border-border rounded-xl p-5">
                {/* Outlier info */}
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSuspicious
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-green-500/10 text-green-400 border border-green-500/20"
                  }`}>
                    {audit.outlier_stars}★ vs {audit.note_avg_at_audit.toFixed(1)} avg
                  </span>
                  <span className="text-sm text-text-bright">
                    {reviewerProfile?.full_name ?? "Unknown"}
                  </span>
                </div>

                {/* Review text */}
                <p className="text-sm text-text-muted mb-2 whitespace-pre-wrap">{rating?.review}</p>

                {/* Note snippet */}
                <p className="text-xs text-text-dim mb-3 line-clamp-2">
                  Note: {noteSnippet?.slice(0, 150)}...
                </p>

                {/* AI assessment */}
                <div className={`rounded-lg p-3 mb-3 ${
                  isSuspicious ? "bg-red-500/5 border border-red-500/10" : "bg-green-500/5 border border-green-500/10"
                }`}>
                  <p className="text-xs font-semibold text-text-dim mb-1">AI Assessment</p>
                  <p className="text-sm text-text-muted">{audit.ai_summary}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDismiss(audit.id)}
                    disabled={acting === audit.id}
                    className="text-sm font-semibold bg-surface-hover text-text-muted px-4 py-1.5 rounded-lg hover:text-text disabled:opacity-50 transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleRemove(audit.id, rating?.id)}
                    disabled={acting === audit.id}
                    className="text-sm font-semibold bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Remove Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
