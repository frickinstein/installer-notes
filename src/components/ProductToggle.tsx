"use client";

import { useState } from "react";

type Product = "installer-notes" | "snaptip";

export function ProductToggle({
  defaultProduct = "installer-notes",
}: {
  defaultProduct?: Product;
}) {
  const [product, setProduct] = useState<Product>(defaultProduct);
  const [showNotice, setShowNotice] = useState(false);

  function handleToggle(selected: Product) {
    if (selected === "snaptip") {
      setShowNotice(true);
      return;
    }
    setProduct(selected);
    setShowNotice(false);
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-1 bg-bg border border-border rounded-full p-1 mb-4">
        <button
          onClick={() => handleToggle("installer-notes")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            product === "installer-notes" && !showNotice
              ? "bg-primary text-white"
              : "text-text-dim hover:text-text-muted"
          }`}
        >
          Installer Notes
        </button>
        <button
          onClick={() => handleToggle("snaptip")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            showNotice
              ? "bg-primary text-white"
              : "text-text-dim hover:text-text-muted"
          }`}
        >
          SnapTip
        </button>
      </div>

      {showNotice && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6 text-center">
          <p className="text-sm font-semibold text-text-bright mb-1">SnapTip is coming soon</p>
          <p className="text-xs text-text-muted mb-3">
            The all-in-one business management app for tint, PPF, and coatings
            shops. Your Installer Notes account will work with SnapTip when it
            launches — no need to sign up again.
          </p>
          <button
            onClick={() => { setShowNotice(false); setProduct("installer-notes"); }}
            className="text-xs text-primary hover:underline font-medium"
          >
            Continue with Installer Notes
          </button>
        </div>
      )}
    </div>
  );
}
