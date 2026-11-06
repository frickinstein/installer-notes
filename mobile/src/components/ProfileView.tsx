import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import type { Profile, ProfileNote } from "@/lib/queries/profiles";
import { colors, font, space } from "@/lib/theme";
import { timeAgo } from "@/lib/validation";
import { Avatar, Card, Empty, Pill, Stars, T } from "./ui";

export function ProfileView({ profile, notes, isSelf = false }: { profile: Profile | null; notes: ProfileNote[]; isSelf?: boolean }) {
  if (!profile) return <Empty>Profile not found.</Empty>;
  const name = profile.full_name ?? "Installer";
  return (
    <>
      <Card>
        <View style={{ flexDirection: "row", gap: space[3], alignItems: "center" }}>
          <Avatar url={profile.avatar_url} name={name} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <T kind="heading">{name}</T>
            <T kind="small">Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</T>
            {profile.installer_role !== "user" && <Pill tone="primary">{profile.installer_role}</Pill>}
          </View>
        </View>
        <View style={styles.stats}>
          <Stat label="Notes" value={String(profile.notes_count)} />
          <Stat label="Avg rating" value={profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : "—"} />
          <Stat label="Score" value={profile.contributor_score > 0 ? Math.round(profile.contributor_score).toString() : "—"} />
        </View>
      </Card>

      <T kind="heading">{isSelf ? "Your notes" : "Notes"}</T>
      {notes.length === 0 ? (
        <Empty>{isSelf ? "You haven't added a note yet. Search a vehicle to add one." : "No approved notes yet."}</Empty>
      ) : (
        notes.map((n) => {
          const ratings = n.installer_note_ratings ?? [];
          const avg = ratings.length ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : 0;
          const overall = n.installer_note_difficulty?.[0]?.overall;
          return (
            <Link key={n.id} href={{ pathname: "/vehicle/[groupId]", params: { groupId: n.group_id } }} asChild>
              <Pressable accessibilityRole="link">
                <Card style={{ gap: space[2] }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space[2] }}>
                    <T style={{ fontWeight: "700", color: colors.textBright, flex: 1 }}>{n.vehicleLabel ?? "Vehicle"}</T>
                    {n.status !== "approved" && <Pill tone="amber">{n.status === "pending" ? "Pending review" : n.status}</Pill>}
                  </View>
                  <T kind="muted" numberOfLines={2}>{n.general_tips}</T>
                  <View style={{ flexDirection: "row", gap: space[2], alignItems: "center" }}>
                    {ratings.length > 0 && <Stars value={avg} size={11} />}
                    {overall != null && <Pill>Difficulty {overall}</Pill>}
                    <T kind="small" style={{ marginLeft: "auto" }}>{timeAgo(n.created_at)}</T>
                  </View>
                </Card>
              </Pressable>
            </Link>
          );
        })
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <T style={{ fontSize: font.xl, fontWeight: "900", color: colors.textBright }}>{value}</T>
      <T kind="small">{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space[3] },
});
