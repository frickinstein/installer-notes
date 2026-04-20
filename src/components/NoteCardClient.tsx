"use client";

import { useState, useActionState } from "react";
import { submitRating, reportRating, type RatingState, type ReportState } from "@/actions/ratings";
import { trackEvent } from "@/lib/analytics";

/* eslint-disable @typescript-eslint/no-explicit-any */

const REPORT_REASONS = [
  "Inaccurate or incorrect information",
  "Spam or promotional",
  "Inappropriate or offensive",
  "Unfair or retaliatory",
  "Other",
];

function StarDisplay({ avg, count, size = "sm" }: { avg: number; count: number; size?: "sm" | "base" }) {
  const textSize = size === "base" ? "text-base" : "text-sm";
  return (
    <span className={`inline-flex items-center gap-1 ${textSize}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(avg) ? "text-yellow-400" : "text-text-dim/40"}>
          ★
        </span>
      ))}
      {count > 0 && (
        <span className="text-text-muted ml-0.5">
          {avg.toFixed(1)} <span className="text-text-dim">({count})</span>
        </span>
      )}
      {count === 0 && (
        <span className="text-text-dim ml-0.5">(0)</span>
      )}
    </span>
  );
}

function InteractiveStars({
  avg,
  count,
  onClickStar,
}: {
  avg: number;
  count: number;
  onClickStar: (stars: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = hovered > 0 ? n <= hovered : n <= Math.round(avg);
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onClickStar(n)}
            className={`transition-colors cursor-pointer ${
              filled ? "text-yellow-400" : "text-text-dim/40 hover:text-yellow-400/60"
            }`}
          >
            ★
          </button>
        );
      })}
      {count > 0 && (
        <span className="text-text-muted ml-1">
          {avg.toFixed(1)} <span className="text-text-dim">({count})</span>
        </span>
      )}
      {count === 0 && (
        <span className="text-text-dim ml-1">(0)</span>
      )}
    </span>
  );
}

export function NoteCardClient({
  noteId,
  initialAvg,
  initialCount,
  initialRatings,
  currentUserId,
  isOwnNote,
  hasRated: initialHasRated,
}: {
  noteId: string;
  initialAvg: number;
  initialCount: number;
  initialRatings: any[];
  currentUserId: string | null;
  isOwnNote: boolean;
  hasRated: boolean;
}) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [ratings, setRatings] = useState(initialRatings);
  const [hasRated, setHasRated] = useState(initialHasRated);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [preselectedStars, setPreselectedStars] = useState(0);
  const [showReviews, setShowReviews] = useState(false);

  function handleStarClick(stars: number) {
    setPreselectedStars(stars);
    setReviewFormOpen(true);
  }

  function handleRatingSubmitted(newRating: { id: string; stars: number; review: string }) {
    const newRatings = [...ratings, { ...newRating, user_id: currentUserId, created_at: new Date().toISOString() }];
    const newAvg = newRatings.reduce((s, r) => s + r.stars, 0) / newRatings.length;
    setRatings(newRatings);
    setAvg(newAvg);
    setCount(newRatings.length);
    setHasRated(true);
    setReviewFormOpen(false);
    trackEvent("note_rated", { stars: newRating.stars });
  }

  const canRate = currentUserId && !isOwnNote && !hasRated;

  return (
    <div>
      {/* Star display + leave a review link */}
      <div className="flex items-center gap-3 mb-0">
        {canRate ? (
          <>
            <InteractiveStars avg={avg} count={count} onClickStar={handleStarClick} />
            {!reviewFormOpen && (
              <button
                type="button"
                onClick={() => { setPreselectedStars(0); setReviewFormOpen(true); }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Leave a review
              </button>
            )}
          </>
        ) : (
          <StarDisplay avg={avg} count={count} />
        )}
      </div>

      {/* Review form */}
      {reviewFormOpen && (
        <ReviewForm
          noteId={noteId}
          preselectedStars={preselectedStars}
          onCancel={() => setReviewFormOpen(false)}
          onSuccess={handleRatingSubmitted}
        />
      )}

      {/* Reviews list toggle */}
      {count > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowReviews(!showReviews)}
            className="text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            {showReviews ? "Hide reviews" : `Show ${count} review${count !== 1 ? "s" : ""}`}
          </button>

          {showReviews && (
            <div className="mt-2 space-y-2">
              {ratings
                .filter((r: any) => r.review && r.review.length > 0)
                .map((r: any) => (
                  <ReviewItem
                    key={r.id}
                    rating={r}
                    currentUserId={currentUserId}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  noteId,
  preselectedStars,
  onCancel,
  onSuccess,
}: {
  noteId: string;
  preselectedStars: number;
  onCancel: () => void;
  onSuccess: (rating: { id: string; stars: number; review: string }) => void;
}) {
  const [stars, setStars] = useState(preselectedStars);
  const [review, setReview] = useState("");
  const [state, formAction, pending] = useActionState<RatingState, FormData>(
    async (_prev, fd) => {
      const result = await submitRating(_prev, fd);
      if (result && "success" in result) {
        onSuccess(result.rating);
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="mt-3 p-4 bg-bg border border-border rounded-lg">
      <input type="hidden" name="note_id" value={noteId} />
      <input type="hidden" name="stars" value={stars} />

      {state && "error" in state && (
        <p className="text-xs text-red-400 mb-2">{state.error}</p>
      )}

      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-text-dim mr-2">Your rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStars(n)}
            className={`text-lg transition-colors ${
              n <= stars ? "text-yellow-400" : "text-text-dim/40 hover:text-yellow-400/60"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <div className="mb-3">
        <textarea
          name="review"
          required
          rows={3}
          maxLength={1000}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Write your review..."
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
        <p className="text-xs text-text-dim text-right mt-1">
          {review.length}/1000
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={stars === 0 || review.length < 1 || pending}
          className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {pending ? "Submitting..." : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-text-dim hover:text-text-muted transition-colors px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReviewItem({ rating, currentUserId }: { rating: any; currentUserId: string | null }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const isOwnRating = currentUserId === rating.user_id;

  return (
    <div className="bg-bg border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {rating.profiles?.avatar_url ? (
            <img
              src={rating.profiles.avatar_url}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-surface-hover flex items-center justify-center">
              <span className="text-xs text-text-dim font-medium">
                {(rating.profiles?.full_name ?? "?")[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-text font-medium">
            {rating.profiles?.full_name ?? "Anonymous"}
          </span>
          <span className="text-xs text-yellow-400">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= rating.stars ? "text-yellow-400" : "text-text-dim/40"}>★</span>
            ))}
          </span>
        </div>
        {currentUserId && !isOwnRating && !reported && (
          <button
            type="button"
            onClick={() => setReportOpen(!reportOpen)}
            className="text-xs text-text-dim hover:text-red-400 transition-colors"
          >
            Report
          </button>
        )}
        {reported && (
          <span className="text-xs text-text-dim">Reported</span>
        )}
      </div>
      <p className="text-sm text-text-muted whitespace-pre-wrap">{rating.review}</p>
      <p className="text-xs text-text-dim mt-1">
        {new Date(rating.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {reportOpen && (
        <ReportForm
          ratingId={rating.id}
          onCancel={() => setReportOpen(false)}
          onSuccess={() => {
            setReported(true);
            setReportOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ReportForm({
  ratingId,
  onCancel,
  onSuccess,
}: {
  ratingId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [state, formAction, pending] = useActionState<ReportState, FormData>(
    async (_prev, fd) => {
      const result = await reportRating(_prev, fd);
      if (result && "success" in result) {
        onSuccess();
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="mt-2 p-3 bg-surface border border-border rounded-lg">
      <input type="hidden" name="rating_id" value={ratingId} />

      {state && "error" in state && (
        <p className="text-xs text-red-400 mb-2">{state.error}</p>
      )}

      <div className="mb-3">
        <label className="block text-xs font-medium text-text-muted mb-1">Reason</label>
        <select
          name="reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-bright focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
        >
          <option value="">Select a reason...</option>
          {REPORT_REASONS.map((r) => (
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
          placeholder="Any additional context..."
          className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-bright placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
        />
        <p className="text-xs text-text-dim text-right mt-0.5">{detail.length}/500</p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reason || pending}
          className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          {pending ? "..." : "Submit Report"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-text-dim hover:text-text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
