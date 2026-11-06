import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Avatar, Card, Empty, Input, Loading, Pill, Stars, T } from "@/components/ui";
import { getRecentNotes, type RecentNote } from "@/lib/queries/notes";
import { searchVehiclesGrouped, type VehicleGroup } from "@/lib/queries/vehicles";
import { colors, space } from "@/lib/theme";
import { timeAgo } from "@/lib/validation";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = useQuery({
    queryKey: ["vehicle-search", debounced],
    queryFn: () => searchVehiclesGrouped(debounced),
    enabled: debounced.length >= 2,
  });
  const recent = useQuery({ queryKey: ["recent-notes"], queryFn: () => getRecentNotes(30) });

  const searching = debounced.length >= 2;

  return (
    <View style={styles.screen}>
      <View style={{ padding: space[4], paddingBottom: space[2] }}>
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder='Type a vehicle — "2024 Civic", "Model 3"…'
          autoCorrect={false}
          autoCapitalize="words"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {searching ? (
        results.isLoading ? (
          <Loading />
        ) : (
          <FlatList
            data={results.data ?? []}
            keyExtractor={(v) => v.group_id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Empty>{`No vehicles match "${debounced}".`}</Empty>}
            renderItem={({ item }) => <VehicleRow v={item} />}
          />
        )
      ) : (
        <FlatList
          data={recent.data ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          refreshing={recent.isRefetching}
          onRefresh={() => recent.refetch()}
          ListHeaderComponent={<T kind="heading" style={{ marginBottom: space[1] }}>Recent notes</T>}
          ListEmptyComponent={recent.isLoading ? <Loading /> : <Empty>No notes yet.</Empty>}
          renderItem={({ item }) => <RecentRow n={item} />}
        />
      )}
    </View>
  );
}

function VehicleRow({ v }: { v: VehicleGroup }) {
  const years = v.minYear === v.maxYear ? `${v.minYear}` : `${v.minYear}–${v.maxYear}`;
  return (
    <Link href={{ pathname: "/vehicle/[groupId]", params: { groupId: v.group_id } }} asChild>
      <Pressable accessibilityRole="link">
        <Card style={{ gap: space[1] }}>
          <T kind="dim">{years}</T>
          <T kind="heading">
            {v.make} {v.model}
          </T>
          <Pill>{v.body_type_alt}</Pill>
        </Card>
      </Pressable>
    </Link>
  );
}

function RecentRow({ n }: { n: RecentNote }) {
  const ratings = n.installer_note_ratings ?? [];
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : 0;
  const overall = n.installer_note_difficulty?.[0]?.overall;
  return (
    <Link href={{ pathname: "/vehicle/[groupId]", params: { groupId: n.group_id } }} asChild>
      <Pressable accessibilityRole="link">
        <Card style={{ gap: space[2] }}>
          <T style={{ fontWeight: "700", color: colors.textBright }}>{n.vehicleLabel ?? "Vehicle"}</T>
          <T kind="muted" numberOfLines={3}>{n.general_tips}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space[2], flexWrap: "wrap" }}>
            <Avatar url={n.profiles?.avatar_url} name={n.profiles?.full_name} size={20} />
            <T kind="small">{n.profiles?.full_name ?? "Anonymous"}</T>
            {ratings.length > 0 && <Stars value={avg} size={11} />}
            {overall != null && <Pill>Difficulty {overall}</Pill>}
            <T kind="small" style={{ marginLeft: "auto" }}>{timeAgo(n.created_at)}</T>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space[4], paddingTop: space[2], gap: space[3] },
});
