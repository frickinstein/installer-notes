import { Link } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Turnstile } from "@/components/Turnstile";
import { Button, Input, Notice, Screen, T } from "@/components/ui";
import { SITE_URL, supabase, TURNSTILE_SITE_KEY } from "@/lib/supabase";
import { colors, space } from "@/lib/theme";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) return setError("Email and password are required.");
    if (TURNSTILE_SITE_KEY && !captcha) return setError("Please wait for the security check to finish.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: { captchaToken: captcha || undefined },
    });
    setBusy(false);
    if (error) {
      setCaptcha("");
      setError(error.message);
    }
    // On success the root layout's Protected guard swaps to the app.
  }

  return (
    <Screen>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
      <Turnstile onToken={setCaptcha} />
      <Button title="Sign in" onPress={submit} loading={busy} />
      <View style={{ flexDirection: "row", gap: space[1], justifyContent: "center" }}>
        <T kind="muted">New here?</T>
        <Link href="/sign-up">
          <T kind="muted" style={{ color: colors.primary, fontWeight: "600" }}>Create an account</T>
        </Link>
      </View>
      <Pressable onPress={() => Linking.openURL(`${SITE_URL}/forgot-password`)} accessibilityRole="link" style={{ alignSelf: "center" }}>
        <T kind="small" style={{ color: colors.primary }}>Forgot password?</T>
      </Pressable>
      <T kind="small" style={{ textAlign: "center" }}>Same account as tintnotes.com and SnapTip.</T>
    </Screen>
  );
}
