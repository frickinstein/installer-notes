"use client";

import { useState } from "react";
import { updateNotificationPreference } from "@/actions/settings";

interface NotificationType {
  key: string;
  label: string;
  description: string;
}

interface Preference {
  type: string;
  in_app: boolean;
  email: boolean;
}

export function NotificationSettings({
  types,
  initial,
}: {
  types: NotificationType[];
  initial: Preference[];
}) {
  const [prefs, setPrefs] = useState<Record<string, { in_app: boolean; email: boolean }>>(
    () => {
      const map: Record<string, { in_app: boolean; email: boolean }> = {};
      for (const p of initial) {
        map[p.type] = { in_app: p.in_app, email: p.email };
      }
      return map;
    }
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(type: string, channel: "in_app" | "email") {
    const current = prefs[type] ?? { in_app: true, email: true };
    const newValue = !current[channel];

    // Optimistic update
    setPrefs((prev) => ({
      ...prev,
      [type]: { ...current, [channel]: newValue },
    }));

    setSaving(`${type}_${channel}`);
    const result = await updateNotificationPreference(type, channel, newValue);
    setSaving(null);

    if (result.error) {
      // Revert on error
      setPrefs((prev) => ({
        ...prev,
        [type]: { ...current, [channel]: !newValue },
      }));
    }
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="flex-1" />
        <div className="w-16 text-center">
          <span className="text-xs font-medium text-text-dim">In-App</span>
        </div>
        <div className="w-16 text-center">
          <span className="text-xs font-medium text-text-dim">Email</span>
        </div>
      </div>

      {types.map((t) => {
        const pref = prefs[t.key] ?? { in_app: true, email: true };
        return (
          <div key={t.key} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-bright">{t.label}</p>
              <p className="text-xs text-text-dim">{t.description}</p>
            </div>
            <div className="w-16 flex justify-center">
              <Toggle
                checked={pref.in_app}
                loading={saving === `${t.key}_in_app`}
                onToggle={() => handleToggle(t.key, "in_app")}
              />
            </div>
            <div className="w-16 flex justify-center">
              <Toggle
                checked={pref.email}
                loading={saving === `${t.key}_email`}
                onToggle={() => handleToggle(t.key, "email")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  loading,
  onToggle,
}: {
  checked: boolean;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-border"
      } ${loading ? "opacity-50" : ""}`}
      style={{ height: "22px" }}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0"
        }`}
        style={{ width: "18px", height: "18px" }}
      />
    </button>
  );
}
