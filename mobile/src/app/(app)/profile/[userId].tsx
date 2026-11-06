import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ProfileView } from "@/components/ProfileView";
import { Loading, Screen } from "@/components/ui";
import { useUserId } from "@/lib/auth";
import { getProfile, getProfileNotes } from "@/lib/queries/profiles";

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const me = useUserId();
  const isSelf = me === userId;
  const profile = useQuery({ queryKey: ["profile", userId], queryFn: () => getProfile(userId) });
  const notes = useQuery({ queryKey: ["profile-notes", userId, isSelf ? "all" : "approved"], queryFn: () => getProfileNotes(userId, isSelf) });

  if (profile.isLoading) return <Loading />;
  return (
    <Screen>
      <ProfileView profile={profile.data ?? null} notes={notes.data ?? []} isSelf={isSelf} />
    </Screen>
  );
}
