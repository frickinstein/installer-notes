import { Image } from "expo-image";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, radius, space } from "@/lib/theme";

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = [padded && styles.padded, style];
  if (!scroll) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.screen}>
        <View style={[styles.fill, inner]}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={["bottom"]} style={styles.screen}>
      <ScrollView contentContainerStyle={inner} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type TextKind = "title" | "heading" | "body" | "muted" | "dim" | "label" | "small";
export function T({
  kind = "body",
  children,
  style,
  ...rest
}: { kind?: TextKind; children: ReactNode; style?: StyleProp<TextStyle> } & Omit<
  React.ComponentProps<typeof Text>,
  "style" | "children"
>) {
  return (
    <Text style={[styles.text, textKinds[kind], style]} {...rest}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...rest
}: { title: string; variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean } & PressableProps) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        buttonVariants[variant],
        pressed && styles.pressed,
        off && styles.disabled,
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? colors.white : colors.text} />
      ) : (
        <Text style={[styles.buttonText, variant === "ghost" && { color: colors.primary }, variant === "secondary" && { color: colors.textBright }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Input({ label, hint, style, ...rest }: { label?: string; hint?: string } & TextInputProps) {
  return (
    <View style={{ gap: space[1] }}>
      {label ? <T kind="label">{label}</T> : null}
      <TextInput
        placeholderTextColor={colors.textDim}
        style={[styles.input, rest.multiline && styles.inputMultiline, style]}
        {...rest}
      />
      {hint ? <T kind="dim" style={{ fontSize: font.xs }}>{hint}</T> : null}
    </View>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "error" | "ok" }) {
  const toneStyle = {
    info: { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text },
    warn: { borderColor: colors.amberBorder, backgroundColor: colors.amberBg, color: colors.amber },
    error: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryBg, color: colors.red },
    ok: { borderColor: "rgba(74,222,128,0.3)", backgroundColor: "rgba(74,222,128,0.12)", color: colors.green },
  }[tone];
  return (
    <View style={[styles.notice, { borderColor: toneStyle.borderColor, backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={{ color: toneStyle.color, fontSize: font.sm }}>{children}</Text>
    </View>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "amber" }) {
  const t = {
    neutral: { bg: colors.bg, border: colors.border, color: colors.textDim },
    primary: { bg: colors.primaryBg, border: colors.primaryBorder, color: colors.primary },
    amber: { bg: colors.amberBg, border: colors.amberBorder, color: colors.amber },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={{ color: t.color, fontSize: font.xs, fontWeight: "600" }}>{children}</Text>
    </View>
  );
}

export function Avatar({ url, name, size = 32 }: { url: string | null | undefined; name: string | null | undefined; size?: number }) {
  const initial = (name ?? "?").trim()[0]?.toUpperCase() ?? "?";
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primaryBg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={[styles.fill, { alignItems: "center", justifyContent: "center", padding: space[6] }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <Card style={{ alignItems: "center", padding: space[6] }}>
      <T kind="muted" style={{ textAlign: "center" }}>{children}</T>
    </Card>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <Text style={{ color: colors.yellow, fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(Math.round(value))}
      <Text style={{ color: colors.textDim }}>{"★".repeat(5 - Math.round(value))}</Text>
    </Text>
  );
}

const textKinds: Record<TextKind, TextStyle> = {
  title: { fontSize: font.xxl, fontWeight: "900", color: colors.textBright },
  heading: { fontSize: font.lg, fontWeight: "700", color: colors.textBright },
  body: { fontSize: font.md, color: colors.text },
  muted: { fontSize: font.sm, color: colors.textMuted },
  dim: { fontSize: font.sm, color: colors.textDim },
  label: { fontSize: font.sm, fontWeight: "600", color: colors.textMuted },
  small: { fontSize: font.xs, color: colors.textDim },
};

const buttonVariants: Record<"primary" | "secondary" | "ghost" | "danger", ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: "transparent" },
  danger: { backgroundColor: "#991B1B" },
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  padded: { padding: space[4], gap: space[4] },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[3],
  },
  text: { color: colors.text },
  button: {
    minHeight: 46,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: font.md },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    color: colors.textBright,
    fontSize: font.md,
  },
  inputMultiline: { minHeight: 110, textAlignVertical: "top" },
  notice: { borderWidth: 1, borderRadius: radius.md, padding: space[3] },
  pill: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space[2] + 2, paddingVertical: 3, alignSelf: "flex-start" },
});
