"use client";

import type { SmartListFilter } from "@/actions/admin";

const CHECKBOX =
  "appearance-none h-4 w-4 shrink-0 rounded border border-border bg-surface-hover checked:bg-primary checked:border-primary cursor-pointer bg-no-repeat bg-center bg-[length:100%_100%] checked:bg-[url('data:image/svg+xml,%3csvg%20viewBox=%270%200%2016%2016%27%20fill=%27white%27%20xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath%20d=%27M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%27/%3e%3c/svg%3e')]";

const INPUT =
  "w-24 bg-surface-hover border border-border rounded-lg px-2.5 py-1.5 text-sm text-text focus:border-primary/40 focus:outline-none transition-colors";

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">{label}</p>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-text-muted cursor-pointer hover:text-text transition-colors">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={CHECKBOX} />
      {label}
    </label>
  );
}

export function SmartListFilterEditor({
  filter,
  onChange,
}: {
  filter: SmartListFilter;
  onChange: (f: SmartListFilter) => void;
}) {
  const f = filter ?? {};

  function set(changes: Partial<NonNullable<SmartListFilter>>) {
    const next = { ...f, ...changes };
    // Remove undefined/null/false/empty values
    for (const key of Object.keys(next) as (keyof NonNullable<SmartListFilter>)[]) {
      const v = next[key];
      if (v === undefined || v === null || v === false) delete next[key];
      if (Array.isArray(v) && v.length === 0) delete next[key];
    }
    onChange(Object.keys(next).length > 0 ? next : null);
  }

  function toggleRole(role: string) {
    const roles: string[] = f.roles ?? [];
    const next = roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role];
    set({ roles: next.length > 0 ? next : undefined });
  }

  const activeCount = Object.keys(f).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-dim uppercase tracking-wider">Smart Filters</p>
        {activeCount > 0 && (
          <button onClick={() => onChange(null)} className="text-xs text-text-dim hover:text-red-400 transition-colors">
            Clear all
          </button>
        )}
      </div>

      <Section label="Notes Activity">
        <CheckRow
          checked={!!f.has_notes}
          onChange={(v) => set(v ? { has_notes: true, no_notes: undefined } : { has_notes: undefined })}
          label="Has submitted notes"
        />
        <CheckRow
          checked={!!f.no_notes}
          onChange={(v) => set(v ? { no_notes: true, has_notes: undefined } : { no_notes: undefined })}
          label="Has NOT submitted notes"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Min notes:</span>
          <input
            type="number"
            min={0}
            value={f.min_notes ?? ""}
            onChange={(e) => set({ min_notes: e.target.value ? parseInt(e.target.value) : undefined })}
            className={INPUT}
            placeholder="—"
          />
        </div>
      </Section>

      <Section label="Review Activity">
        <CheckRow
          checked={!!f.has_reviews}
          onChange={(v) => set(v ? { has_reviews: true, no_reviews: undefined } : { has_reviews: undefined })}
          label="Has left reviews"
        />
        <CheckRow
          checked={!!f.no_reviews}
          onChange={(v) => set(v ? { no_reviews: true, has_reviews: undefined } : { no_reviews: undefined })}
          label="Has NOT left reviews"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Min reviews:</span>
          <input
            type="number"
            min={0}
            value={f.min_reviews ?? ""}
            onChange={(e) => set({ min_reviews: e.target.value ? parseInt(e.target.value) : undefined })}
            className={INPUT}
            placeholder="—"
          />
        </div>
      </Section>

      <Section label="Join Date">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Joined within last</span>
          <input
            type="number"
            min={1}
            value={f.joined_within_days ?? ""}
            onChange={(e) => set({ joined_within_days: e.target.value ? parseInt(e.target.value) : undefined })}
            className={INPUT}
            placeholder="—"
          />
          <span className="text-sm text-text-muted">days</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Joined more than</span>
          <input
            type="number"
            min={1}
            value={f.joined_before_days ?? ""}
            onChange={(e) => set({ joined_before_days: e.target.value ? parseInt(e.target.value) : undefined })}
            className={INPUT}
            placeholder="—"
          />
          <span className="text-sm text-text-muted">days ago</span>
        </div>
      </Section>

      <Section label="Contributor Score">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">Score ≥</span>
          <input
            type="number"
            min={0}
            value={f.min_score ?? ""}
            onChange={(e) => set({ min_score: e.target.value ? parseFloat(e.target.value) : undefined })}
            className={INPUT}
            placeholder="—"
          />
        </div>
      </Section>

      <Section label="Role">
        <div className="flex gap-1.5">
          {(["user", "mod", "admin"] as const).map((role) => (
            <button
              key={role}
              onClick={() => toggleRole(role)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                (f.roles ?? []).includes(role)
                  ? "bg-primary text-white"
                  : "bg-surface-hover text-text-muted hover:text-text"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </Section>

      <p className="text-xs text-text-dim">
        {activeCount === 0
          ? "No filters — matches all users"
          : `${activeCount} filter${activeCount !== 1 ? "s" : ""} active — AND-combined`}
      </p>
    </div>
  );
}
