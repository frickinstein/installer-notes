import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { Button, Input, Loading, Notice, Screen, T } from "@/components/ui";
import { emptyScores, type PanelScores } from "@/lib/difficulty";
import { getMyNoteForVehicle, submitNote, type MyNote, type NewPhoto } from "@/lib/queries/notes";
import { getVehicle, type Vehicle } from "@/lib/queries/vehicles";
import { publicUrl } from "@/lib/supabase";
import { colors, radius, space } from "@/lib/theme";
import { isValidFacebookUrl, isValidYoutubeUrl, MAX_PHOTOS, MIN_TIPS } from "@/lib/validation";

export default function SubmitScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const vehicle = useQuery({ queryKey: ["vehicle", groupId], queryFn: () => getVehicle(groupId) });
  const mine = useQuery({ queryKey: ["my-note", groupId], queryFn: () => getMyNoteForVehicle(groupId) });
  if (vehicle.isLoading || mine.isLoading) return <Loading />;
  // Mounted once the existing note is known so the form's state can start from it.
  return <NoteForm groupId={groupId} vehicle={vehicle.data ?? null} existing={mine.data ?? null} />;
}

function NoteForm({ groupId, vehicle, existing }: { groupId: string; vehicle: Vehicle | null; existing: MyNote | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const d = existing?.installer_note_difficulty?.[0];

  const [trim, setTrim] = useState(existing?.trim_package ?? "");
  const [tips, setTips] = useState(existing?.general_tips ?? "");
  const [tools, setTools] = useState(existing?.tools_needed ?? "");
  const [problems, setProblems] = useState(existing?.common_problems ?? "");
  const [youtube, setYoutube] = useState(existing?.youtube_url ?? "");
  const [facebook, setFacebook] = useState(existing?.facebook_url ?? "");
  const [scores, setScores] = useState<PanelScores>(
    d ? { rollups: d.rollups, back_glass: d.back_glass, windshield: d.windshield, sunroof: d.sunroof, quarter_glass: d.quarter_glass } : emptyScores()
  );
  const [kept, setKept] = useState<{ id: string; storage_path: string }[]>(existing?.installer_note_media ?? []);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const total = kept.length + added.length;

  async function pick(from: "camera" | "library") {
    const slots = MAX_PHOTOS - total;
    if (slots <= 0) return;
    if (from === "camera") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setError("Camera permission is needed to take a photo.");
    }
    const res =
      from === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true, selectionLimit: slots });
    if (res.canceled) return;
    setAdded((prev) => [...prev, ...res.assets.slice(0, slots).map((a) => ({ uri: a.uri, mimeType: a.mimeType, fileName: a.fileName }))]);
  }

  function addPhoto() {
    Alert.alert("Add photo", undefined, [
      { text: "Take photo", onPress: () => pick("camera") },
      { text: "Choose from library", onPress: () => pick("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const submit = useMutation({
    mutationFn: async () => {
      const generalTips = tips.trim();
      if (generalTips.length < MIN_TIPS) throw new Error(`General tips must be at least ${MIN_TIPS} characters.`);
      const yt = youtube.trim() || null;
      const fb = facebook.trim() || null;
      if (yt && !isValidYoutubeUrl(yt)) throw new Error("Please enter a valid YouTube URL.");
      if (fb && !isValidFacebookUrl(fb)) throw new Error("Please enter a valid Facebook URL.");
      return submitNote(
        groupId,
        {
          trimPackage: trim.trim() || null,
          generalTips,
          toolsNeeded: tools.trim() || null,
          commonProblems: problems.trim() || null,
          youtubeUrl: yt,
          facebookUrl: fb,
          scores,
        },
        existing,
        kept.map((k) => k.id),
        added
      );
    },
    onSuccess: async (result) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["vehicle-notes", groupId] }),
        qc.invalidateQueries({ queryKey: ["my-note", groupId] }),
        qc.invalidateQueries({ queryKey: ["recent-notes"] }),
        qc.invalidateQueries({ queryKey: ["profile-notes"] }),
      ]);
      router.replace({ pathname: "/vehicle/[groupId]", params: { groupId, submitted: result.status === "approved" ? "approved" : "pending" } });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Screen>
      <T kind="muted">{vehicle?.label ?? "Vehicle"} · Window tint</T>
      {error ? <Notice tone="error">{error}</Notice> : null}

      <Input label="Trim package (optional)" value={trim} onChangeText={setTrim} placeholder="e.g. Sport, Limited, with sunroof" hint="Only if the tint job differs by trim." />
      <Input label="General tips" value={tips} onChangeText={setTips} multiline placeholder="What should another installer know before they start this car?" hint={`At least ${MIN_TIPS} characters.`} />
      <Input label="Tools needed (optional)" value={tools} onChangeText={setTools} multiline style={{ minHeight: 70 }} />
      <Input label="Common problems (optional)" value={problems} onChangeText={setProblems} multiline style={{ minHeight: 70 }} />

      <DifficultyPicker value={scores} onChange={setScores} />

      <View style={{ gap: space[2] }}>
        <T kind="label">
          Photos <T kind="dim">({total}/{MAX_PHOTOS})</T>
        </T>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space[2] }}>
          {kept.map((k) => (
            <Thumb key={k.id} uri={publicUrl("installer-note-media", k.storage_path)} onRemove={() => setKept((p) => p.filter((x) => x.id !== k.id))} />
          ))}
          {added.map((a, i) => (
            <Thumb key={a.uri} uri={a.uri} onRemove={() => setAdded((p) => p.filter((_, j) => j !== i))} />
          ))}
          {total < MAX_PHOTOS && (
            <Pressable onPress={addPhoto} style={styles.addBox} accessibilityRole="button" accessibilityLabel="Add photo">
              <Text style={{ color: colors.textDim, fontSize: 28 }}>+</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      <Input label="YouTube link (optional)" value={youtube} onChangeText={setYoutube} autoCapitalize="none" keyboardType="url" placeholder="https://youtube.com/…" />
      <Input label="Facebook video link (optional)" value={facebook} onChangeText={setFacebook} autoCapitalize="none" keyboardType="url" placeholder="https://facebook.com/…" />

      <Button title={existing ? "Save changes" : "Submit note"} onPress={() => submit.mutate()} loading={submit.isPending} />
      <T kind="small" style={{ textAlign: "center" }}>Notes are checked before they go live; most are approved right away.</T>
    </Screen>
  );
}

function Thumb({ uri, onRemove }: { uri: string; onRemove: () => void }) {
  return (
    <View>
      <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
      <Pressable onPress={onRemove} style={styles.remove} accessibilityRole="button" accessibilityLabel="Remove photo">
        <Text style={{ color: colors.white, fontSize: 12, fontWeight: "900" }}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: { width: 84, height: 84, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  addBox: { width: 84, height: 84, borderRadius: radius.md, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  remove: { position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
});
