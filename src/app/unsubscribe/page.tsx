"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">(
    token ? "loading" : "invalid"
  );
  const [campaign, setCampaign] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setCampaign(data.campaign);
          setStatus("success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold text-text-bright mb-3">Unsubscribing...</h1>
            <p className="text-text-muted">Processing your request.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-text-bright mb-3">You&apos;ve been unsubscribed</h1>
            <p className="text-text-muted mb-6">
              {campaign
                ? `You will no longer receive emails from the "${campaign}" campaign.`
                : "You will no longer receive marketing emails from Installer Notes."}
            </p>
            <p className="text-sm text-text-dim">
              Changed your mind?{" "}
              <a href="/settings" className="text-primary hover:underline">
                Manage your email preferences
              </a>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-text-bright mb-3">Something went wrong</h1>
            <p className="text-text-muted mb-6">
              We couldn&apos;t process your unsubscribe request. The link may have expired.
            </p>
            <p className="text-sm text-text-dim">
              Need help?{" "}
              <a href="mailto:bfm@snaptip.app" className="text-primary hover:underline">
                Contact us
              </a>
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className="text-2xl font-bold text-text-bright mb-3">Invalid link</h1>
            <p className="text-text-muted">
              This unsubscribe link is missing or invalid.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-text-muted">Loading...</p>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
