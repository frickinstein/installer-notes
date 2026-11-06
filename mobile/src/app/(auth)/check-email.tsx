import { useRouter } from "expo-router";
import { Button, Screen, T } from "@/components/ui";
import { space } from "@/lib/theme";

export default function CheckEmail() {
  const router = useRouter();
  return (
    <Screen scroll={false} style={{ justifyContent: "center", gap: space[4] }}>
      <T kind="title">Check your email</T>
      <T kind="muted">
        We sent you a confirmation link. Open it on this phone and it brings you straight back into Tint Notes, signed in.
      </T>
      <T kind="small">Didn&apos;t get it? Check spam, then try signing up again.</T>
      <Button title="Back to sign in" variant="secondary" onPress={() => router.replace("/sign-in")} />
    </Screen>
  );
}
