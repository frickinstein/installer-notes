import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Screen, T } from "@/components/ui";
import { colors, space } from "@/lib/theme";

export default function Welcome() {
  const router = useRouter();
  return (
    <Screen scroll={false} style={{ justifyContent: "center", gap: space[5] }}>
      <View style={{ gap: space[2] }}>
        <T kind="title">
          Tint <T kind="title" style={{ color: colors.primary }}>Notes</T>
        </T>
        <T kind="muted">
          Real-world window tint install notes from professional installers. Search any vehicle, read the tips,
          rate the difficulty, and share what you know.
        </T>
      </View>
      <View style={{ gap: space[2] }}>
        <Button title="Sign in" onPress={() => router.push("/sign-in")} />
        <Button title="Create a free account" variant="secondary" onPress={() => router.push("/sign-up")} />
      </View>
    </Screen>
  );
}
