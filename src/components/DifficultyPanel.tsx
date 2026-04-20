/* eslint-disable @typescript-eslint/no-explicit-any */

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

function difficultyColor(avg: number): string {
  if (avg <= 2) return "text-green-400";
  if (avg <= 3.5) return "text-yellow-400";
  return "text-red-400";
}

function difficultyLabel(avg: number): string {
  if (avg <= 1.5) return "Easy";
  if (avg <= 2.5) return "Moderate";
  if (avg <= 3.5) return "Tricky";
  if (avg <= 4.5) return "Hard";
  return "Expert";
}

export function DifficultyPanel({ notes, noteType = "tint" }: { notes: any[]; noteType?: "tint" | "ppf" }) {
  const panels = noteType === "ppf" ? PPF_PANELS : TINT_PANELS;
  const diffKey = noteType === "ppf" ? "installer_note_ppf_difficulty" : "installer_note_difficulty";

  const panelStats: Record<string, { total: number; count: number }> = {};
  panels.forEach((p) => (panelStats[p.key] = { total: 0, count: 0 }));

  for (const note of notes) {
    const diffs = note[diffKey];
    if (!diffs || diffs.length === 0) continue;
    const d = diffs[0];
    for (const panel of panels) {
      const val = d[panel.key];
      if (val != null) {
        panelStats[panel.key].total += val;
        panelStats[panel.key].count += 1;
      }
    }
  }

  const hasAnyRating = Object.values(panelStats).some((s) => s.count > 0);

  let overallTotal = 0;
  let overallCount = 0;
  for (const stats of Object.values(panelStats)) {
    if (stats.count > 0) {
      overallTotal += stats.total / stats.count;
      overallCount += 1;
    }
  }
  const overallAvg = overallCount > 0 ? overallTotal / overallCount : null;

  const cols = noteType === "ppf" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5";

  return (
    <div className="bg-surface border border-border rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-bright">
          Difficulty Ratings
        </h2>
        {overallAvg !== null && (
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${difficultyColor(overallAvg)}`}>
              {overallAvg.toFixed(1)}
            </span>
            <span className="text-sm text-text-dim">
              {difficultyLabel(overallAvg)}
            </span>
          </div>
        )}
      </div>

      {!hasAnyRating ? (
        <p className="text-text-muted text-sm">
          No difficulty ratings yet. Be the first to rate this vehicle.
        </p>
      ) : (
        <div className={`grid ${cols} gap-3`}>
          {panels.map((panel) => {
            const stats = panelStats[panel.key];
            if (stats.count === 0) return (
              <div key={panel.key} className="bg-bg border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-text-dim mb-1">{panel.label}</p>
                <p className="text-sm text-text-dim">&mdash;</p>
              </div>
            );
            const avg = stats.total / stats.count;
            return (
              <div key={panel.key} className="bg-bg border border-border rounded-lg p-3 text-center">
                <p className="text-xs text-text-dim mb-1">{panel.label}</p>
                <p className={`text-lg font-bold ${difficultyColor(avg)}`}>
                  {avg.toFixed(1)}
                </p>
                <p className="text-xs text-text-dim">{stats.count} rating{stats.count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
