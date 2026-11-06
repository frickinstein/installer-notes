import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, View } from "react-native";
import { Avatar, Card, Empty, Loading, T } from "@/components/ui";
import { getTintLeaderboard } from "@/lib/queries/profiles";
import { colors, font, space } from "@/lib/theme";

export default function LeaderboardScreen() {
  const leaders = useQuery({ queryKey: ["leaderboard", "tint"], queryFn: () => getTintLeaderboard(50) });
  if (leaders.isLoading) return <Loading />;
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={leaders.data ?? []}
      keyExtractor={(l) => l.id}
      contentContainerStyle={{ padding: space[4], gap: space[2] }}
      ListHeaderComponent={<T kind="muted" style={{ marginBottom: space[2] }}>Top tint contributors, ranked by quality and volume of notes.</T>}
      ListEmptyComponent={<Empty>No contributors yet.</Empty>}
      renderItem={({ item, index }) => (
        <Link href={{ pathname: "/profile/[userId]", params: { userId: item.id } }} asChild>
          <Pressable accessibilityRole="link">
            <Card style={{ flexDirection: "row", alignItems: "center", gap: space[3], paddingVertical: space[3] }}>
              <T style={{ width: 28, fontWeight: "900", fontSize: font.lg, color: index < 3 ? colors.primary : colors.textDim }}>{index + 1}</T>
              <Avatar url={item.avatar_url} name={item.full_name} size={36} />
              <View style={{ flex: 1 }}>
                <T style={{ fontWeight: "700", color: colors.textBright }}>{item.full_name ?? "Installer"}</T>
                <T kind="small">
                  {item.notes_count} note{item.notes_count !== 1 ? "s" : ""}
                  {item.avg_rating > 0 ? ` · ${item.avg_rating.toFixed(1)} ★` : ""}
                </T>
              </View>
              <T style={{ fontWeight: "900", color: colors.textBright }}>{Math.round(item.contributor_score)}</T>
            </Card>
          </Pressable>
        </Link>
      )}
    />
  );
}
