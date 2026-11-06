import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Card, Empty, Loading, T } from "@/components/ui";
import { getNotifications, markAllRead } from "@/lib/queries/notifications";
import { colors, space } from "@/lib/theme";
import { timeAgo } from "@/lib/validation";

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });

  // Opening the tab marks everything read, like the website page does.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      markAllRead().then(() => {
        if (cancelled) return;
        qc.invalidateQueries({ queryKey: ["unread-count"] });
      });
      return () => {
        cancelled = true;
      };
    }, [qc])
  );

  if (list.isLoading) return <Loading />;

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={list.data ?? []}
      keyExtractor={(n) => n.id}
      contentContainerStyle={styles.list}
      refreshing={list.isRefetching}
      onRefresh={() => list.refetch()}
      ListEmptyComponent={<Empty>No notifications yet.</Empty>}
      renderItem={({ item }) => (
        <Card style={{ gap: space[1] }}>
          <View style={{ flexDirection: "row", gap: space[2], alignItems: "center" }}>
            {!item.read && <View style={styles.dot} />}
            <T style={{ flex: 1, color: item.read ? colors.textMuted : colors.textBright }}>{item.message}</T>
          </View>
          <T kind="small">{timeAgo(item.created_at)}</T>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space[4], gap: space[3] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
