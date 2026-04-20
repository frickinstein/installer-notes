"use client";

import { useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function AudienceEditor({
  audience,
  onChange,
}: {
  audience: any;
  onChange: (a: any) => void;
}) {
  const aud = audience ?? {};

  function update(changes: Record<string, unknown>) {
    const next = { ...aud, ...changes };
    if (!next.has_notes) delete next.has_notes;
    if (!next.no_notes) delete next.no_notes;
    if (!next.min_notes && next.min_notes !== 0) delete next.min_notes;
    if (!next.roles || next.roles.length === 0) delete next.roles;
    if (!next.has_tint_notes) delete next.has_tint_notes;
    if (!next.has_ppf_notes) delete next.has_ppf_notes;
    onChange(Object.keys(next).length > 0 ? next : null);
  }

  function toggleRole(role: string) {
    const roles: string[] = aud.roles ?? [];
    const next = roles.includes(role)
      ? roles.filter((r: string) => r !== role)
      : [...roles, role];
    update({ roles: next.length > 0 ? next : undefined });
  }

  const checkboxClass =
    "appearance-none h-4 w-4 shrink-0 rounded border border-border bg-surface-hover checked:bg-primary checked:border-primary cursor-pointer bg-no-repeat bg-center bg-[length:100%_100%] checked:bg-[url('data:image/svg+xml,%3csvg%20viewBox=%270%200%2016%2016%27%20fill=%27white%27%20xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath%20d=%27M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%27/%3e%3c/svg%3e')]";

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-dim font-medium uppercase tracking-wider">Audience</p>

      {/* Note activity */}
      <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={!!aud.has_notes}
          onChange={(e) => update(e.target.checked ? { has_notes: true, no_notes: undefined } : { has_notes: undefined })}
          className={checkboxClass}
        />
        Has submitted notes
      </label>
      <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={!!aud.no_notes}
          onChange={(e) => update(e.target.checked ? { no_notes: true, has_notes: undefined } : { no_notes: undefined })}
          className={checkboxClass}
        />
        Has NOT submitted notes
      </label>
      <div className="flex items-center gap-2">
        <label className="text-sm text-text-muted">Min notes:</label>
        <input
          type="number"
          min={0}
          value={aud.min_notes ?? ""}
          onChange={(e) => update({ min_notes: e.target.value ? parseInt(e.target.value) : undefined })}
          className="w-20 bg-surface border border-border rounded px-2 py-1 text-sm text-text"
          placeholder="—"
        />
      </div>

      {/* Note type */}
      <div>
        <p className="text-sm text-text-muted mb-1">Note type:</p>
        <div className="flex gap-2">
          {[
            { key: "has_tint_notes", label: "Tint user" },
            { key: "has_ppf_notes",  label: "PPF user" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => update({ [key]: aud[key] ? undefined : true })}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                aud[key]
                  ? "bg-primary text-white"
                  : "bg-surface-hover text-text-muted hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-dim mt-1">Filters to users who have submitted at least one approved note of that type.</p>
      </div>

      {/* Role */}
      <div>
        <p className="text-sm text-text-muted mb-1">Roles:</p>
        <div className="flex gap-2">
          {["user", "mod", "admin"].map((role) => (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                (aud.roles ?? []).includes(role)
                  ? "bg-primary text-white"
                  : "bg-surface-hover text-text-muted hover:text-text"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-dim">
        {!audience ? "All users (no filter)" : "Filters are AND-combined"}
      </p>
    </div>
  );
}
