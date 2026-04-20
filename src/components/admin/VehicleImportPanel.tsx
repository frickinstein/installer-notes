"use client";

import { useState, useRef } from "react";
import { importVehicleCsv } from "@/actions/admin";

type ParsedRow = {
  year: number;
  make: string;
  model: string;
  body_type_alt: string;
  body_type: string;
  generation: number;
};

type ImportResult = {
  inserted: number;
  updated: number;
  skipped: number;
  error?: string;
  duplicatesInCsv?: ParsedRow[];
  duplicatesInDb?: ParsedRow[];
};

const EXPECTED_HEADERS = ["Year", "Make", "Model", "Body Type ALT", "Body Type", "Generation"];

function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row."] };

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^"(.*)"$/, "$1"));

  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) {
    return { rows: [], errors: [`Missing columns: ${missing.join(", ")}. Expected: ${EXPECTED_HEADERS.join(", ")}`] };
  }

  const idx = {
    year: headers.indexOf("Year"),
    make: headers.indexOf("Make"),
    model: headers.indexOf("Model"),
    bodyTypeAlt: headers.indexOf("Body Type ALT"),
    bodyType: headers.indexOf("Body Type"),
    generation: headers.indexOf("Generation"),
  };

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < headers.length) {
      errors.push(`Row ${i + 1}: expected ${headers.length} columns, got ${cols.length}`);
      continue;
    }

    const year = parseInt(cols[idx.year], 10);
    const generation = parseInt(cols[idx.generation], 10);

    if (isNaN(year) || year < 1900 || year > 2100) {
      errors.push(`Row ${i + 1}: invalid year "${cols[idx.year]}"`);
      continue;
    }
    if (isNaN(generation)) {
      errors.push(`Row ${i + 1}: invalid generation "${cols[idx.generation]}"`);
      continue;
    }

    const make = cols[idx.make].trim();
    const model = cols[idx.model].trim();
    const bodyTypeAlt = cols[idx.bodyTypeAlt].trim();
    const bodyType = cols[idx.bodyType].trim();

    if (!make || !model || !bodyTypeAlt || !bodyType) {
      errors.push(`Row ${i + 1}: make, model, body type ALT, and body type are required`);
      continue;
    }

    rows.push({ year, make, model, body_type_alt: bodyTypeAlt, body_type: bodyType, generation });
  }

  return { rows, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export function VehicleImportPanel() {
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCsv(text);
      setParsed(rows);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsed?.length) return;
    setImporting(true);
    setResult(null);

    try {
      const res = await importVehicleCsv(parsed);
      setResult(res);
      if (!res.error) {
        setParsed(null);
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setResult({ error: "Import failed unexpectedly.", inserted: 0, updated: 0, skipped: 0 });
    } finally {
      setImporting(false);
    }
  }

  function handleReset() {
    setParsed(null);
    setParseErrors([]);
    setFileName("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const makes = parsed ? [...new Set(parsed.map((r) => r.make))].sort() : [];
  const years = parsed ? [...new Set(parsed.map((r) => r.year))].sort((a, b) => a - b) : [];

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text-bright mb-1">Import Vehicle CSV</h2>
        <p className="text-sm text-text-muted mb-4">
          Upload a CSV with columns: Year, Make, Model, Body Type ALT, Body Type, Generation.
          Duplicates (same year/make/model/body type alt) will be updated if body type or generation changed, otherwise skipped.
        </p>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-primary hover:bg-primary/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Choose CSV
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {fileName && (
            <span className="text-sm text-text-muted">{fileName}</span>
          )}
        </div>
      </div>

      {parseErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm font-bold text-red-400 mb-2">Parse Errors ({parseErrors.length})</p>
          <ul className="text-xs text-red-300 space-y-1 max-h-40 overflow-y-auto">
            {parseErrors.slice(0, 20).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {parseErrors.length > 20 && (
              <li className="text-red-400 font-medium">...and {parseErrors.length - 20} more</li>
            )}
          </ul>
        </div>
      )}

      {parsed && parsed.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-text-bright">
                {parsed.length.toLocaleString()} rows ready to import
              </p>
              <p className="text-xs text-text-muted">
                {makes.length} make{makes.length !== 1 ? "s" : ""}: {makes.join(", ")}
                {" | "}Years: {years[0]}–{years[years.length - 1]}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                disabled={importing}
                className="text-sm text-text-muted hover:text-text px-3 py-2 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto max-h-64 overflow-y-auto border border-border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-surface-hover sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Year</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Make</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Model</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Body Type ALT</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Body Type</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Gen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {parsed.slice(0, 50).map((row, i) => (
                  <tr key={i} className="hover:bg-surface-hover">
                    <td className="px-3 py-1.5 text-text">{row.year}</td>
                    <td className="px-3 py-1.5 text-text">{row.make}</td>
                    <td className="px-3 py-1.5 text-text">{row.model}</td>
                    <td className="px-3 py-1.5 text-text">{row.body_type_alt}</td>
                    <td className="px-3 py-1.5 text-text">{row.body_type}</td>
                    <td className="px-3 py-1.5 text-text">{row.generation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 50 && (
              <p className="text-xs text-text-dim text-center py-2">
                Showing first 50 of {parsed.length.toLocaleString()} rows
              </p>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`border rounded-xl p-4 ${
            result.error
              ? "bg-red-500/10 border-red-500/30"
              : "bg-green-500/10 border-green-500/30"
          }`}>
            {result.error ? (
              <p className="text-sm text-red-400">{result.error}</p>
            ) : (
              <div className="text-sm text-green-400">
                <p className="font-bold mb-1">Import complete</p>
                <p className="text-xs text-green-300">
                  {result.inserted.toLocaleString()} inserted, {result.updated.toLocaleString()} updated, {result.skipped.toLocaleString()} skipped (already in database)
                </p>
              </div>
            )}
          </div>

          {/* Duplicates within the CSV */}
          {result.duplicatesInCsv && result.duplicatesInCsv.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm font-bold text-yellow-400 mb-2">
                Duplicates within CSV ({result.duplicatesInCsv.length})
              </p>
              <p className="text-xs text-yellow-300/70 mb-2">
                These rows appeared more than once in your CSV — only the first occurrence was used.
              </p>
              <DuplicateTable rows={result.duplicatesInCsv} />
            </div>
          )}

          {/* Already in database */}
          {result.duplicatesInDb && result.duplicatesInDb.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <p className="text-sm font-bold text-text-muted mb-2">
                Already in database ({result.duplicatesInDb.length})
              </p>
              <p className="text-xs text-text-dim mb-2">
                These rows already exist with identical data — no changes needed.
              </p>
              <DuplicateTable rows={result.duplicatesInDb} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DuplicateTable({ rows }: { rows: ParsedRow[] }) {
  return (
    <div className="overflow-x-auto max-h-48 overflow-y-auto border border-border rounded-lg">
      <table className="w-full text-xs">
        <thead className="bg-surface-hover sticky top-0">
          <tr>
            <th className="text-left px-3 py-1.5 text-text-muted font-medium">Year</th>
            <th className="text-left px-3 py-1.5 text-text-muted font-medium">Make</th>
            <th className="text-left px-3 py-1.5 text-text-muted font-medium">Model</th>
            <th className="text-left px-3 py-1.5 text-text-muted font-medium">Body Type ALT</th>
            <th className="text-left px-3 py-1.5 text-text-muted font-medium">Body Type</th>
            <th className="text-left px-3 py-1.5 text-text-muted font-medium">Gen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 100).map((row, i) => (
            <tr key={i}>
              <td className="px-3 py-1 text-text">{row.year}</td>
              <td className="px-3 py-1 text-text">{row.make}</td>
              <td className="px-3 py-1 text-text">{row.model}</td>
              <td className="px-3 py-1 text-text">{row.body_type_alt}</td>
              <td className="px-3 py-1 text-text">{row.body_type}</td>
              <td className="px-3 py-1 text-text">{row.generation}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 100 && (
        <p className="text-xs text-text-dim text-center py-1">
          Showing first 100 of {rows.length.toLocaleString()}
        </p>
      )}
    </div>
  );
}
