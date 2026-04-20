"use client";

import { useState } from "react";
import { requestVehicleInfo } from "@/actions/requests";
import type { VehicleRequestInfo } from "@/actions/requests";

export function RequestInfoButton({
  groupId,
  vehicleLabel,
  requestInfo,
  isLoggedIn,
}: {
  groupId: string;
  vehicleLabel: string;
  requestInfo: VehicleRequestInfo;
  isLoggedIn: boolean;
}) {
  const [state, setState] = useState<
    "idle" | "confirming" | "sending" | "success" | "error"
  >("idle");
  const [sentTo, setSentTo] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [totalRequests, setTotalRequests] = useState(requestInfo.totalRequests);

  const { recentRequest } = requestInfo;
  const onCooldown = !!recentRequest;

  if (!isLoggedIn) return null;

  async function handleConfirm() {
    setState("sending");
    const result = await requestVehicleInfo(groupId, vehicleLabel);
    if ("error" in result) {
      setErrorMsg(result.error);
      setState("error");
    } else {
      setSentTo(result.sentTo);
      setTotalRequests((n) => n + 1);
      setState("success");
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {/* Social proof — always show if any requests exist */}
      {totalRequests > 0 && state !== "success" && (
        <p className="text-xs text-text-dim">
          <span className="font-semibold text-text-muted">{totalRequests}</span>{" "}
          {totalRequests === 1 ? "person has" : "people have"} asked about this vehicle
        </p>
      )}

      {state === "idle" && (
        onCooldown ? (
          <div className="flex flex-col gap-1">
            <button
              disabled
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-dim bg-surface cursor-not-allowed opacity-60"
            >
              Info Requested
            </button>
            <p className="text-[11px] text-text-dim">
              {recentRequest!.daysAgo === 0
                ? "Requested today — check back in 3 days"
                : `Requested ${recentRequest!.daysAgo}d ago — available again soon`}
            </p>
          </div>
        ) : (
          <button
            onClick={() => setState("confirming")}
            className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted bg-surface hover:border-primary/40 hover:text-text transition-colors"
          >
            Request info from community
          </button>
        )
      )}

      {state === "confirming" && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3 max-w-sm">
          <p className="text-sm text-text-muted">
            This will email active contributors asking if they know anything about the{" "}
            <span className="text-text-bright font-medium">{vehicleLabel}</span>.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Send Request
            </button>
            <button
              onClick={() => setState("idle")}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state === "sending" && (
        <p className="text-xs text-text-muted animate-pulse">Sending request...</p>
      )}

      {state === "success" && (
        <div className="space-y-1">
          <p className="text-xs text-green-400 font-medium">
            {sentTo > 0
              ? `Request sent to ${sentTo} contributor${sentTo !== 1 ? "s" : ""}.`
              : "Request recorded — we'll notify contributors when available."}
          </p>
          {totalRequests > 0 && (
            <p className="text-xs text-text-dim">
              <span className="font-semibold text-text-muted">{totalRequests}</span>{" "}
              {totalRequests === 1 ? "person has" : "people have"} asked about this vehicle
            </p>
          )}
        </div>
      )}

      {state === "error" && (
        <div className="space-y-1">
          <p className="text-xs text-red-400">{errorMsg}</p>
          <button
            onClick={() => setState("idle")}
            className="text-xs text-text-dim hover:text-text underline"
          >
            Go back
          </button>
        </div>
      )}
    </div>
  );
}
