"use client";

import { useState } from "react";

const TINT_PANELS = [
  { key: "rollups",       label: "Rollups" },
  { key: "back_glass",    label: "Back Glass" },
  { key: "windshield",    label: "Windshield" },
  { key: "sunroof",       label: "Sunroof" },
  { key: "quarter_glass", label: "Quarter Glass" },
] as const;

const PPF_PANELS = [
  { key: "hood",           label: "Hood" },
  { key: "front_bumper",   label: "Front Bumper" },
  { key: "fender",         label: "Fender" },
  { key: "roof",           label: "Roof" },
  { key: "doors",          label: "Doors" },
  { key: "quarter_panels", label: "Quarter Panels / Bedside" },
  { key: "trunk_lid",      label: "Trunk Lid / Tailgate" },
  { key: "rear_bumper",    label: "Rear Bumper" },
] as const;

export function DifficultyPicker({
  noteType,
  defaults,
}: {
  noteType: "tint" | "ppf";
  defaults?: Record<string, number | null>;
}) {
  const panels = noteType === "ppf" ? PPF_PANELS : TINT_PANELS;

  const [ratings, setRatings] = useState<Record<string, number | null>>(() => {
    const init: Record<string, number | null> = {};
    panels.forEach((p) => (init[p.key] = defaults?.[p.key] ?? null));
    return init;
  });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-muted">
        Difficulty by Panel <span className="text-text-dim">(optional, 1=easy 5=hard)</span>
      </label>
      {panels.map((panel) => (
        <div key={panel.key} className="flex items-center gap-3">
          <span className="text-sm text-text-muted w-32">{panel.label}</span>
          <input type="hidden" name={panel.key} value={ratings[panel.key] ?? ""} />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() =>
                  setRatings((prev) => ({
                    ...prev,
                    [panel.key]: prev[panel.key] === n ? null : n,
                  }))
                }
                className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                  ratings[panel.key] === n
                    ? "bg-primary text-white"
                    : "bg-bg border border-border text-text-dim hover:border-text-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
