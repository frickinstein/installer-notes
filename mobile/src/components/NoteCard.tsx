import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { TINT_PANELS } from "@/lib/difficulty";
import { NOTE_REPORT_REASONS, reportNote, type VehicleNote } from "@/lib/queries/notes";
import { publicUrl } from "@/lib/supabase";
import { colors, font, space } from "@/lib/theme";
import { timeAgo } from "@/lib/validation";
import { NotePhotos } from "./NotePhotos";
import { Avatar, Button, Card, Pill, Stars, T } from "./ui";

export function NoteCard({ note, currentUserId }: { note: VehicleNote; currentUserId: string | null }) {
  const [showReviews, setShowReviews] = useState(false);
  const [reported, setReported] = useState(false);
  const difficulty = note.installer_note_difficulty?.[0];
  const ratings = note.installer_note_ratings ?? [];
  const profile = note.profiles;
  const name = profile?.full_name ?? "Anonymous";
  const isOwn = currentUserId === note.user_id;
  const hasRated = currentUserId ? ratings.some((r) => r.user_id === currentUserId) : false;
  const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : 0;
  const photos = (note.installer_note_media ?? []).map((m) => publicUrl("installer-note-media", m.storage_path));

  return (
    <Card>
      <View style={styles.header}>
        <Link href={{ pathname: "/profile/[userId]", params: { userId: note.user_id } }} asChild>
          <Pressable style={styles.author} accessibilityRole="link">
            <Avatar url={profile?.avatar_url} name={name} />
            <T style={{ fontWeight: "600", color: colors.textBright, fontSize: font.sm }}>{name}</T>
          </Pressable>
        </Link>
        <View style={{ flexDirection: "row", gap: space[2], alignItems: "center" }}>
          {isOwn && (
            <Link href={{ pathname: "/submit/[groupId]", params: { groupId: note.group_id } }} asChild>
              <Pressable accessibilityRole="link">
                <Pill tone="primary">Edit</Pill>
              </Pressable>
            </Link>
          )}
          {difficulty?.overall != null && <Pill>Difficulty {difficulty.overall}</Pill>}
        </View>
      </View>

      {note.trim_package ? <Pill tone="amber">⚠ Trim: {note.trim_package}</Pill> : null}

      <View style={styles.ratingRow}>
        <Stars value={avg} />
        <T kind="dim">
          {ratings.length > 0 ? `${avg.toFixed(1)} · ${ratings.length} review${ratings.length !== 1 ? "s" : ""}` : "No reviews yet"}
        </T>
        {ratings.length > 0 && (
          <Pressable onPress={() => setShowReviews((s) => !s)} accessibilityRole="button">
            <T kind="small" style={{ color: colors.primary }}>{showReviews ? "Hide" : "Read"}</T>
          </Pressable>
        )}
        {!isOwn && !hasRated && currentUserId && (
          <Link href={{ pathname: "/rate/[noteId]", params: { noteId: note.id } }} asChild>
            <Pressable accessibilityRole="link" style={{ marginLeft: "auto" }}>
              <T kind="small" style={{ color: colors.primary, fontWeight: "700" }}>Rate this note</T>
            </Pressable>
          </Link>
        )}
      </View>

      {showReviews && (
        <View style={{ gap: space[2] }}>
          {ratings.map((r) => (
            <View key={r.id} style={styles.review}>
              <View style={{ flexDirection: "row", gap: space[2], alignItems: "center" }}>
                <Avatar url={r.profiles?.avatar_url} name={r.profiles?.full_name} size={22} />
                <T kind="small" style={{ color: colors.textMuted }}>{r.profiles?.full_name ?? "Installer"}</T>
                <Stars value={r.stars} size={11} />
                <T kind="small">{timeAgo(r.created_at)}</T>
              </View>
              <T kind="muted">{r.review}</T>
            </View>
          ))}
        </View>
      )}

      <T>{note.general_tips}</T>

      {note.tools_needed ? (
        <View>
          <T kind="small" style={styles.sectionLabel}>TOOLS NEEDED</T>
          <T kind="muted">{note.tools_needed}</T>
        </View>
      ) : null}
      {note.common_problems ? (
        <View>
          <T kind="small" style={styles.sectionLabel}>COMMON PROBLEMS</T>
          <T kind="muted">{note.common_problems}</T>
        </View>
      ) : null}

      {difficulty && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space[1] }}>
          {TINT_PANELS.map((p) => {
            const v = difficulty[p.key];
            if (v == null) return null;
            return (
              <Pill key={p.key}>
                {p.label}: {v}/5
              </Pill>
            );
          })}
        </View>
      )}

      <NotePhotos urls={photos} />

      {(note.youtube_url || note.facebook_url) && (
        <View style={{ flexDirection: "row", gap: space[2] }}>
          {note.youtube_url ? <Button title="Watch on YouTube" variant="secondary" onPress={() => Linking.openURL(note.youtube_url!)} /> : null}
          {note.facebook_url ? <Button title="Watch on Facebook" variant="secondary" onPress={() => Linking.openURL(note.facebook_url!)} /> : null}
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <T kind="small">{timeAgo(note.created_at)}</T>
        {currentUserId && !isOwn && (
          reported ? (
            <T kind="small">Reported</T>
          ) : (
            <Pressable onPress={() => askReport(note.id, () => setReported(true))} accessibilityRole="button" hitSlop={8}>
              <T kind="small">Report</T>
            </Pressable>
          )
        )}
      </View>
    </Card>
  );
}

function askReport(noteId: string, onDone: () => void) {
  Alert.alert("Report this note", "Why should a moderator look at it?", [
    ...NOTE_REPORT_REASONS.map((reason) => ({
      text: reason,
      onPress: () => {
        reportNote(noteId, reason)
          .then(() => {
            onDone();
            Alert.alert("Thanks", "A moderator will review this note.");
          })
          .catch((e: Error) => Alert.alert("Couldn't report", e.message));
      },
    })),
    { text: "Cancel", style: "cancel" as const },
  ]);
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space[2] },
  author: { flexDirection: "row", alignItems: "center", gap: space[2], flexShrink: 1 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: space[2], flexWrap: "wrap" },
  review: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: space[2], gap: space[1] },
  sectionLabel: { fontWeight: "700", letterSpacing: 0.6, marginBottom: 2 },
});
