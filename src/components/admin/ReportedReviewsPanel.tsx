"use client";

import { useState } from "react";
import { dismissReviewReport, removeReview } from "@/actions/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ReportedReviewsPanel({ reviews: initial, onCountChange }: { reviews: any[]; onCountChange?: (n: number) => void }) {
  const [reviews, setReviews] = useState(initial);
  const [acting, setActing] = useState<string | null>(null);

  function removeReport(reportId: string) {
    const updated = reviews.filter((r) => r.id !== reportId);
    setReviews(updated);
    onCountChange?.(updated.length);
  }

  async function handleDismiss(reportId: string) {
    setActing(reportId);
    const result = await dismissReviewReport(reportId);
    if (result && !("error" in result)) {
      removeReport(reportId);
    }
    setActing(null);
  }

  async function handleRemoveReview(reportId: string, ratingId: string) {
    setActing(reportId);
    const result = await removeReview(ratingId);
    if (result && !("error" in result)) {
      removeReport(reportId);
    }
    setActing(null);
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-muted">No reported reviews.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((report) => {
        const rating = Array.isArray(report.installer_note_ratings)
          ? report.installer_note_ratings[0]
          : report.installer_note_ratings;
        const reviewerProfile = rating?.profiles
          ? (Array.isArray(rating.profiles) ? rating.profiles[0] : rating.profiles)
          : null;
        const reporterProfile = Array.isArray(report.profiles) ? report.profiles[0] : report.profiles;

        return (
          <div key={report.id} className="bg-surface border border-border rounded-xl p-5">
            {/* Reported review */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-yellow-400">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= (rating?.stars ?? 0) ? "text-yellow-400" : "text-text-dim/40"}>★</span>
                  ))}
                </span>
                <span className="text-sm font-medium text-text-bright">
                  {reviewerProfile?.full_name ?? "Unknown"}
                </span>
              </div>
              <p className="text-sm text-text-muted whitespace-pre-wrap">{rating?.review}</p>
            </div>

            {/* Report details */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-3">
              <p className="text-xs font-semibold text-red-400 mb-1">
                Reported by {reporterProfile?.full_name ?? "Unknown"}
              </p>
              <p className="text-xs text-text-muted">
                <strong className="text-text-dim">Reason:</strong> {report.reason}
              </p>
              {report.reason_detail && (
                <p className="text-xs text-text-dim mt-1">{report.reason_detail}</p>
              )}
              <p className="text-xs text-text-dim mt-1">
                {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleDismiss(report.id)}
                disabled={acting === report.id}
                className="text-sm font-semibold bg-surface-hover text-text-muted px-4 py-1.5 rounded-lg hover:text-text disabled:opacity-50 transition-colors"
              >
                Dismiss Report
              </button>
              <button
                onClick={() => handleRemoveReview(report.id, rating?.id)}
                disabled={acting === report.id}
                className="text-sm font-semibold bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Remove Review
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
