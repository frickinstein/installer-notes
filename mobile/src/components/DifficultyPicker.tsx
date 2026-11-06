import { Pressable, StyleSheet, Text, View } from "react-native";
import { TINT_PANELS, type PanelScores } from "@/lib/difficulty";
import { colors, font, radius, space } from "@/lib/theme";
import { T } from "./ui";

export function DifficultyPicker({ value, onChange }: { value: PanelScores; onChange: (next: PanelScores) => void }) {
  return (
    <View style={{ gap: space[2] }}>
      <T kind="label">
        Difficulty by panel <T kind="dim">(optional, 1 = easy, 5 = hard)</T>
      </T>
      {TINT_PANELS.map((p) => (
        <View key={p.key} style={styles.row}>
          <T kind="muted" style={{ width: 110 }}>{p.label}</T>
          <View style={{ flexDirection: "row", gap: space[1] }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = value[p.key] === n;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.label} ${n}`}
                  onPress={() => onChange({ ...value, [p.key]: on ? null : n })}
                  style={[styles.box, on && styles.boxOn]}
                >
                  <Text style={[styles.boxText, on && { color: colors.white }]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space[3] },
  box: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxText: { color: colors.textDim, fontWeight: "700", fontSize: font.sm },
});
