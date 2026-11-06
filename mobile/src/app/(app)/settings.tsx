import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch, View } from "react-native";
import { Card, Loading, Notice, Screen, T } from "@/components/ui";
import { getNotificationPreferences, NOTIFICATION_TYPES, updateNotificationPreference } from "@/lib/queries/notifications";
import { colors, space } from "@/lib/theme";

export default function SettingsScreen() {
  const qc = useQueryClient();
  const prefs = useQuery({ queryKey: ["notification-prefs"], queryFn: getNotificationPreferences });
  const update = useMutation({
    mutationFn: ({ type, channel, enabled }: { type: string; channel: "in_app" | "email"; enabled: boolean }) =>
      updateNotificationPreference(type, channel, enabled),
    onSettled: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
  });

  if (prefs.isLoading) return <Loading />;

  return (
    <Screen>
      <T kind="muted">Choose what you hear about, in the app and by email.</T>
      {update.isError ? <Notice tone="error">{(update.error as Error).message}</Notice> : null}
      {NOTIFICATION_TYPES.map((t) => {
        const p = prefs.data?.find((x) => x.type === t.key);
        return (
          <Card key={t.key} style={{ gap: space[2] }}>
            <T style={{ fontWeight: "700", color: colors.textBright }}>{t.label}</T>
            <T kind="small">{t.description}</T>
            <Row label="In app" value={p?.in_app ?? true} onChange={(v) => update.mutate({ type: t.key, channel: "in_app", enabled: v })} />
            <Row label="Email" value={p?.email ?? t.defaultEmail} onChange={(v) => update.mutate({ type: t.key, channel: "email", enabled: v })} />
          </Card>
        );
      })}
    </Screen>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <T kind="muted">{label}</T>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
    </View>
  );
}
