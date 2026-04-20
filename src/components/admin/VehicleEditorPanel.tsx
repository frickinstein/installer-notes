"use client";

import { useState, Fragment } from "react";
import { VehicleImportPanel } from "./VehicleImportPanel";
import { importVehicleCsv, searchVehicles, updateVehicle, bulkUpdateVehicleGeneration } from "@/actions/admin";
import type { VehicleSearchResult } from "@/actions/admin";

const BODY_TYPE_ALT_OPTIONS = [
  "Sedan", "Coupe", "Hatchback", "Convertible",
  "Small SUV", "Large SUV",
  "Pickup: 2-Door", "Pickup: Ext Cab", "Pickup: 4-Door",
  "Wagon", "Van",
] as const;

const BODY_TYPE_OPTIONS = [
  "Sedan", "Coupe", "Convertible",
  "Small SUV/Hatchback", "Large SUV/Van",
  "Pickup: 2-Door", "Pickup: 4-Door", "Pickup: Ext Cab",
] as const;

const BODY_TYPE_DERIVE: Record<string, string> = {
  "Sedan": "Sedan",
  "Coupe": "Coupe",
  "Hatchback": "Small SUV/Hatchback",
  "Convertible": "Convertible",
  "Small SUV": "Small SUV/Hatchback",
  "Large SUV": "Large SUV/Van",
  "Pickup: 2-Door": "Pickup: 2-Door",
  "Pickup: Ext Cab": "Pickup: Ext Cab",
  "Pickup: 4-Door": "Pickup: 4-Door",
  "Wagon": "Small SUV/Hatchback",
  "Van": "Large SUV/Van",
};

type SubTab = "add" | "search" | "csv";
type YearEntry = { key: string; year: string; generation: string };
type EditFields = {
  year?: number;
  make?: string;
  model?: string;
  body_type_alt?: string;
  body_type?: string;
  generation?: number;
};

// ─── Root Panel ───────────────────────────────────────────────────────────────

export function VehicleEditorPanel() {
  const [subTab, setSubTab] = useState<SubTab>("add");

  const tabs: { key: SubTab; label: string }[] = [
    { key: "add", label: "Add Vehicles" },
    { key: "search", label: "Search & Edit" },
    { key: "csv", label: "CSV Import" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              subTab === t.key
                ? "bg-primary text-white"
                : "text-text-muted hover:text-text hover:bg-surface-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "add" && <VehicleAddSection />}
      {subTab === "search" && <VehicleSearchSection />}
      {subTab === "csv" && <VehicleImportPanel />}
    </div>
  );
}

// ─── Add Section ──────────────────────────────────────────────────────────────

function VehicleAddSection() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [bodyTypeAlt, setBodyTypeAlt] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [yearRows, setYearRows] = useState<YearEntry[]>([
    { key: "0", year: String(new Date().getFullYear()), generation: "1" },
  ]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleBodyTypeAlt(val: string) {
    setBodyTypeAlt(val);
    const derived = BODY_TYPE_DERIVE[val];
    if (derived) setBodyType(derived);
  }

  function addYearRow() {
    const last = yearRows[yearRows.length - 1];
    const nextYear = last ? String((parseInt(last.year) || new Date().getFullYear()) + 1) : String(new Date().getFullYear());
    setYearRows((prev) => [
      ...prev,
      { key: String(Date.now()), year: nextYear, generation: last?.generation ?? "1" },
    ]);
  }

  function removeYearRow(key: string) {
    setYearRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateYearRow(key: string, field: "year" | "generation", value: string) {
    setYearRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit() {
    setError(null);
    setResult(null);

    if (!make.trim()) { setError("Make is required."); return; }
    if (!model.trim()) { setError("Model is required."); return; }
    if (!bodyTypeAlt) { setError("Body Type ALT is required."); return; }
    if (!bodyType) { setError("Body Type is required."); return; }
    if (!yearRows.length) { setError("Add at least one year."); return; }

    const rows = [];
    for (const r of yearRows) {
      const year = parseInt(r.year, 10);
      const generation = parseInt(r.generation, 10);
      if (isNaN(year) || year < 1900 || year > 2100) { setError(`Invalid year: "${r.year}"`); return; }
      if (isNaN(generation) || generation < 1) { setError(`Invalid generation: "${r.generation}"`); return; }
      rows.push({ year, make: make.trim(), model: model.trim(), body_type_alt: bodyTypeAlt, body_type: bodyType, generation });
    }

    const yearSet = new Set(rows.map((r) => r.year));
    if (yearSet.size !== rows.length) { setError("Duplicate years in the list."); return; }

    setSaving(true);
    try {
      const res = await importVehicleCsv(rows);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(`Done: ${res.inserted} added, ${res.updated} updated, ${res.skipped} already existed.`);
        setMake("");
        setModel("");
        setBodyTypeAlt("");
        setBodyType("");
        setYearRows([{ key: "0", year: String(new Date().getFullYear()), generation: "1" }]);
      }
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canPreview = make && model && bodyTypeAlt && bodyType && yearRows.length > 0;

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-text-bright mb-4">Vehicle Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Make</label>
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Kia"
              className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. K4"
              className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Body Type ALT</label>
            <select
              value={bodyTypeAlt}
              onChange={(e) => handleBodyTypeAlt(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
            >
              <option value="">Select...</option>
              {BODY_TYPE_ALT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Body Type</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
            >
              <option value="">Select...</option>
              {BODY_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-text-bright">Years &amp; Generations</h3>
          <button
            onClick={addYearRow}
            className="text-xs bg-surface-hover hover:bg-border text-text px-3 py-1.5 rounded-lg border border-border transition-colors"
          >
            + Add Year
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3 mb-1">
            <p className="text-xs text-text-dim font-medium pl-1">Year</p>
            <p className="text-xs text-text-dim font-medium pl-1">Generation</p>
          </div>
          {yearRows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                value={row.year}
                onChange={(e) => updateYearRow(row.key, "year", e.target.value)}
                placeholder="Year"
                className="flex-1 bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
              />
              <input
                value={row.generation}
                onChange={(e) => updateYearRow(row.key, "generation", e.target.value)}
                placeholder="Gen"
                className="flex-1 bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => removeYearRow(row.key)}
                disabled={yearRows.length === 1}
                className="text-text-dim hover:text-red-400 disabled:opacity-30 transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {canPreview && (
          <div className="mt-4 p-3 bg-surface-hover rounded-lg border border-border">
            <p className="text-xs text-text-dim mb-1.5 font-medium">Preview</p>
            <div className="space-y-0.5">
              {yearRows.map((r, i) => (
                <p key={i} className="text-xs text-text-muted">
                  {r.year} {make} {model} — {bodyTypeAlt} / {bodyType} — Gen {r.generation}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {result && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <p className="text-sm text-green-400">{result}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          {saving ? "Adding..." : `Add ${yearRows.length} Vehicle${yearRows.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

// ─── Search & Edit Section ────────────────────────────────────────────────────

function VehicleSearchSection() {
  const [searchMake, setSearchMake] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VehicleSearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGen, setBulkGen] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  async function handleSearch() {
    if (!searchMake.trim() && !searchModel.trim()) {
      setSearchError("Enter a make or model to search.");
      return;
    }
    setSearchError(null);
    setSearching(true);
    setResults(null);
    setSelectedIds(new Set());
    setBulkResult(null);
    setBulkError(null);

    try {
      const res = await searchVehicles({
        make: searchMake,
        model: searchModel,
        yearMin: yearMin ? parseInt(yearMin, 10) : undefined,
        yearMax: yearMax ? parseInt(yearMax, 10) : undefined,
      });
      if ("error" in res) {
        setSearchError(res.error);
      } else {
        setResults(res);
      }
    } catch {
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function startEdit(vehicle: VehicleSearchResult) {
    setEditingId(vehicle.id);
    setSaveError(null);
    setEditFields({
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      body_type_alt: vehicle.body_type_alt,
      body_type: vehicle.body_type,
      generation: vehicle.generation,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFields({});
    setSaveError(null);
  }

  async function saveEdit(original: VehicleSearchResult) {
    setSavingId(original.id);
    setSaveError(null);
    try {
      const res = await updateVehicle(original.id, editFields);
      if (res.error) {
        setSaveError(res.error);
      } else {
        setResults(
          (prev) =>
            prev?.map((v) =>
              v.id === original.id ? { ...v, ...editFields } as VehicleSearchResult : v
            ) ?? null
        );
        setEditingId(null);
        setEditFields({});
      }
    } catch {
      setSaveError("Save failed. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleBulkGeneration() {
    const gen = parseInt(bulkGen, 10);
    if (isNaN(gen) || gen < 1) { setBulkError("Enter a valid generation number."); return; }
    if (!selectedIds.size) { setBulkError("Select at least one vehicle."); return; }

    setBulkSaving(true);
    setBulkError(null);
    setBulkResult(null);

    try {
      const res = await bulkUpdateVehicleGeneration([...selectedIds], gen);
      if (res.error) {
        setBulkError(res.error);
      } else {
        setBulkResult(`Updated ${res.updated} vehicle${res.updated !== 1 ? "s" : ""} to generation ${gen}.`);
        setResults(
          (prev) =>
            prev?.map((v) => (selectedIds.has(v.id) ? { ...v, generation: gen } : v)) ?? null
        );
        setSelectedIds(new Set());
        setBulkGen("");
      }
    } catch {
      setBulkError("Bulk update failed.");
    } finally {
      setBulkSaving(false);
    }
  }

  function setNumField(field: "year" | "generation", raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) setEditFields((prev) => ({ ...prev, [field]: n }));
  }

  const allSelected = !!results?.length && selectedIds.size === results.length;

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(results?.map((v) => v.id) ?? []));
  }

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-text-bright mb-4">Search Vehicles</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <input
            value={searchMake}
            onChange={(e) => setSearchMake(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Make"
            className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
          />
          <input
            value={searchModel}
            onChange={(e) => setSearchModel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Model"
            className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
          />
          <input
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Year from"
            type="number"
            className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
          />
          <input
            value={yearMax}
            onChange={(e) => setYearMax(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Year to"
            type="number"
            className="bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
          />
        </div>
        {searchError && <p className="text-xs text-red-400 mt-2">{searchError}</p>}
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {results !== null && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {results.length === 0
                ? "No vehicles found."
                : `${results.length} vehicle${results.length !== 1 ? "s" : ""}${results.length === 200 ? " (limited to 200 — narrow your search)" : ""}`}
            </p>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{selectedIds.size} selected</span>
                <input
                  value={bulkGen}
                  onChange={(e) => setBulkGen(e.target.value)}
                  placeholder="New generation"
                  type="number"
                  min="1"
                  className="w-32 bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleBulkGeneration}
                  disabled={bulkSaving || !bulkGen}
                  className="text-xs bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  {bulkSaving ? "Updating..." : "Set Generation"}
                </button>
              </div>
            )}
          </div>

          {bulkResult && (
            <div className="px-5 py-2 bg-green-500/10 border-b border-green-500/20">
              <p className="text-xs text-green-400">{bulkResult}</p>
            </div>
          )}
          {bulkError && (
            <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/20">
              <p className="text-xs text-red-400">{bulkError}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="px-3 py-2 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                    </th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Year</th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Make</th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Model</th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Body Type ALT</th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Body Type</th>
                    <th className="text-left px-3 py-2 text-text-muted font-medium">Gen</th>
                    <th className="px-3 py-2 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((v) => (
                    <Fragment key={v.id}>
                      <tr className={editingId === v.id ? "bg-surface-hover" : "hover:bg-surface-hover/50"}>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(v.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              e.target.checked ? next.add(v.id) : next.delete(v.id);
                              setSelectedIds(next);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-text">{v.year}</td>
                        <td className="px-3 py-2 text-text">{v.make}</td>
                        <td className="px-3 py-2 text-text">{v.model}</td>
                        <td className="px-3 py-2 text-text">{v.body_type_alt}</td>
                        <td className="px-3 py-2 text-text">{v.body_type}</td>
                        <td className="px-3 py-2 text-text">{v.generation}</td>
                        <td className="px-3 py-2 text-right">
                          {editingId === v.id ? (
                            <button onClick={cancelEdit} className="text-text-dim hover:text-text text-xs">
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => startEdit(v)}
                              className="text-primary hover:text-primary/80 text-xs font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>

                      {editingId === v.id && (
                        <tr>
                          <td colSpan={8} className="px-4 pb-4 pt-2 bg-surface-hover">
                            <div className="border border-border rounded-xl p-4 bg-surface space-y-3">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-text-muted mb-1">Year</label>
                                  <input
                                    type="number"
                                    value={editFields.year ?? ""}
                                    onChange={(e) => setNumField("year", e.target.value)}
                                    className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-text-muted mb-1">Make</label>
                                  <input
                                    value={editFields.make ?? ""}
                                    onChange={(e) => setEditFields((f) => ({ ...f, make: e.target.value }))}
                                    className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-text-muted mb-1">Model</label>
                                  <input
                                    value={editFields.model ?? ""}
                                    onChange={(e) => setEditFields((f) => ({ ...f, model: e.target.value }))}
                                    className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-text-muted mb-1">Body Type ALT</label>
                                  <select
                                    value={editFields.body_type_alt ?? ""}
                                    onChange={(e) => setEditFields((f) => ({ ...f, body_type_alt: e.target.value }))}
                                    className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                  >
                                    {BODY_TYPE_ALT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-text-muted mb-1">Body Type</label>
                                  <select
                                    value={editFields.body_type ?? ""}
                                    onChange={(e) => setEditFields((f) => ({ ...f, body_type: e.target.value }))}
                                    className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                  >
                                    {BODY_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-text-muted mb-1">
                                    Generation
                                    {editFields.generation !== undefined && editFields.generation !== v.generation && (
                                      <span className="ml-1 text-yellow-400">(group will be reassigned)</span>
                                    )}
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={editFields.generation ?? ""}
                                    onChange={(e) => setNumField("generation", e.target.value)}
                                    className="w-full bg-surface-hover border border-border rounded-lg px-2 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                                  />
                                </div>
                              </div>

                              {saveError && <p className="text-xs text-red-400">{saveError}</p>}

                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={cancelEdit}
                                  className="text-xs text-text-muted hover:text-text px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveEdit(v)}
                                  disabled={savingId === v.id}
                                  className="text-xs bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
                                >
                                  {savingId === v.id ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
