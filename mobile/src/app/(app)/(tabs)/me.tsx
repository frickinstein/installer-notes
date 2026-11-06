import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Alert, View } from "react-native";
import { ProfileView } from "@/components/ProfileView";
import { Button, Loading, Screen } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { getProfile, getProfileNotes } from "@/lib/queries/profiles";
import { supabase } from "@/lib/supabase";
import { space } from "@/lib/theme";

export default function MeScreen() {
  const router = useRouter();
  const userId = useUserId();
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => getProfile(userId!), enabled: !!userId });
  const notes = useQuery({ queryKey: ["profile-notes", userId, "all"], queryFn: () => getProfileNotes(userId!, true), enabled: !!userId });

  if (!userId || profile.isLoading) return <Loading />;

  function signOut() {
    Alert.alert("Sign out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => supabase.auth.signOut() },
    ]);
  }

  return (
    <Screen>
      <ProfileView profile={profile.data ?? null} notes={notes.data ?? []} isSelf />
      <View style={{ gap: space[2] }}>
        <Button title="Edit profile" variant="secondary" onPress={() => router.push("/edit-profile")} />
        <Button title="Leaderboard" variant="secondary" onPress={() => router.push("/leaderboard")} />
        <Button title="Notification settings" variant="secondary" onPress={() => router.push("/settings")} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}
