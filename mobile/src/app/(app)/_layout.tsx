import { Stack } from "expo-router";
import { colors } from "@/lib/theme";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.textBright,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="vehicle/[groupId]" options={{ title: "" }} />
      <Stack.Screen name="submit/[groupId]" options={{ title: "Your note" }} />
      <Stack.Screen name="profile/[userId]" options={{ title: "Profile" }} />
      <Stack.Screen name="leaderboard" options={{ title: "Leaderboard" }} />
      <Stack.Screen name="settings" options={{ title: "Notification settings" }} />
      <Stack.Screen name="edit-profile" options={{ title: "Edit profile" }} />
      <Stack.Screen name="rate/[noteId]" options={{ title: "Rate this note", presentation: "modal" }} />
    </Stack>
  );
}
