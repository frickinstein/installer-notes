// Tint-only. Mirrors the panel list + thresholds in the web DifficultyPanel.
import { colors } from "./theme";

export const TINT_PANELS = [
  { key: "rollups", label: "Rollups" },
  { key: "back_glass", label: "Back Glass" },
  { key: "windshield", label: "Windshield" },
  { key: "sunroof", label: "Sunroof" },
  { key: "quarter_glass", label: "Quarter Glass" },
] as const;

export type PanelKey = (typeof TINT_PANELS)[number]["key"];
export type PanelScores = Record<PanelKey, number | null>;

export const emptyScores = (): PanelScores => ({
  rollups: null,
  back_glass: null,
  windshield: null,
  sunroof: null,
  quarter_glass: null,
});

export function difficultyColor(avg: number): string {
  if (avg <= 2) return colors.green;
  if (avg <= 3.5) return colors.yellow;
  return colors.red;
}

export function difficultyLabel(avg: number): string {
  if (avg <= 1.5) return "Easy";
  if (avg <= 2.5) return "Moderate";
  if (avg <= 3.5) return "Tricky";
  if (avg <= 4.5) return "Hard";
  return "Expert";
}

type DifficultyRow = Partial<Record<PanelKey, number | null>>;

/** Per-panel averages across notes, plus the overall (mean of panel means). */
export function summarizeDifficulty(rows: (DifficultyRow | null | undefined)[]) {
  const stats: Record<PanelKey, { total: number; count: number }> = {
    rollups: { total: 0, count: 0 },
    back_glass: { total: 0, count: 0 },
    windshield: { total: 0, count: 0 },
    sunroof: { total: 0, count: 0 },
    quarter_glass: { total: 0, count: 0 },
  };
  for (const row of rows) {
    if (!row) continue;
    for (const p of TINT_PANELS) {
      const v = row[p.key];
      if (v != null) {
        stats[p.key].total += v;
        stats[p.key].count += 1;
      }
    }
  }
  let total = 0;
  let count = 0;
  for (const s of Object.values(stats)) {
    if (s.count > 0) {
      total += s.total / s.count;
      count += 1;
    }
  }
  return { stats, overall: count > 0 ? total / count : null };
}
