import { StyleSheet, View } from "react-native";
import { difficultyColor, difficultyLabel, summarizeDifficulty, TINT_PANELS } from "@/lib/difficulty";
import type { VehicleNote } from "@/lib/queries/notes";
import { colors, font, radius, space } from "@/lib/theme";
import { Card, T } from "./ui";

export function DifficultyPanel({ notes }: { notes: VehicleNote[] }) {
  const { stats, overall } = summarizeDifficulty(notes.map((n) => n.installer_note_difficulty?.[0]));
  const hasAny = Object.values(stats).some((s) => s.count > 0);

  return (
    <Card>
      <View style={styles.header}>
        <T kind="heading">Difficulty</T>
        {overall !== null && (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: space[2] }}>
            <T style={{ fontSize: font.xl, fontWeight: "900", color: difficultyColor(overall) }}>{overall.toFixed(1)}</T>
            <T kind="dim">{difficultyLabel(overall)}</T>
          </View>
        )}
      </View>
      {!hasAny ? (
        <T kind="muted">No difficulty ratings yet. Be the first to rate this vehicle.</T>
      ) : (
        <View style={styles.grid}>
          {TINT_PANELS.map((p) => {
            const s = stats[p.key];
            const avg = s.count > 0 ? s.total / s.count : null;
            return (
              <View key={p.key} style={styles.cell}>
                <T kind="small">{p.label}</T>
                {avg === null ? (
                  <T kind="dim">—</T>
                ) : (
                  <>
                    <T style={{ fontSize: font.lg, fontWeight: "700", color: difficultyColor(avg) }}>{avg.toFixed(1)}</T>
                    <T kind="small">
                      {s.count} rating{s.count !== 1 ? "s" : ""}
                    </T>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  cell: {
    width: "31%",
    flexGrow: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space[2],
    alignItems: "center",
    gap: 2,
  },
});
