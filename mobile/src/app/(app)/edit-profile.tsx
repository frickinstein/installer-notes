import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Avatar, Button, Input, Loading, Notice, Screen } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { getProfile, removeAvatar, updateName, uploadAvatar, type Profile } from "@/lib/queries/profiles";
import { space } from "@/lib/theme";

export default function EditProfileScreen() {
  const userId = useUserId();
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => getProfile(userId!), enabled: !!userId });
  if (!userId || profile.isLoading) return <Loading />;
  // Mounted once the profile is here so the form's state can start from it.
  return <EditProfileForm userId={userId} profile={profile.data ?? null} />;
}

function EditProfileForm({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["profile", userId] });

  const save = useMutation({
    mutationFn: () => updateName(name),
    onSuccess: async () => {
      await invalidate();
      router.back();
    },
    onError: (e: Error) => setError(e.message),
  });

  const avatar = useMutation({
    mutationFn: async () => {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (res.canceled) return;
      const a = res.assets[0];
      await uploadAvatar(a.uri, a.mimeType);
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({ mutationFn: removeAvatar, onSuccess: invalidate, onError: (e: Error) => setError(e.message) });

  return (
    <Screen>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <View style={{ alignItems: "center", gap: space[3] }}>
        <Avatar url={profile?.avatar_url} name={name} size={96} />
        <View style={{ flexDirection: "row", gap: space[2] }}>
          <Button title="Change photo" variant="secondary" onPress={() => avatar.mutate()} loading={avatar.isPending} />
          {profile?.avatar_url ? <Button title="Remove" variant="ghost" onPress={() => remove.mutate()} loading={remove.isPending} /> : null}
        </View>
      </View>
      <Input label="Full name" value={name} onChangeText={setName} autoComplete="name" />
      <Button title="Save" onPress={() => save.mutate()} loading={save.isPending} />
    </Screen>
  );
}
