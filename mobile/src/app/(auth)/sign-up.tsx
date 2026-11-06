import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Turnstile } from "@/components/Turnstile";
import { Button, Input, Notice, Screen, T } from "@/components/ui";
import { emailRedirectTo } from "@/lib/auth";
import { SITE_URL, supabase, TURNSTILE_SITE_KEY } from "@/lib/supabase";
import { colors, space } from "@/lib/theme";
import { newPasswordError, PASSWORD_MIN } from "@/lib/validation";

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) return setError("Email and password are required.");
    const pw = newPasswordError(password);
    if (pw) return setError(pw);
    if (!agreed) return setError("You must agree to the Terms of Service and Privacy Policy.");
    if (TURNSTILE_SITE_KEY && !captcha) return setError("Please wait for the security check to finish.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), accepted_terms_at: new Date().toISOString() },
        emailRedirectTo: emailRedirectTo(),
        captchaToken: captcha || undefined,
      },
    });
    setBusy(false);
    if (error) {
      setCaptcha("");
      return setError(error.message);
    }
    router.replace("/check-email");
  }

  return (
    <Screen>
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Input label="Full name" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" />
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={`At least ${PASSWORD_MIN} characters.`}
      />
      <Pressable onPress={() => setAgreed((a) => !a)} style={{ flexDirection: "row", gap: space[2], alignItems: "flex-start" }} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
        <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: agreed ? colors.primary : colors.border, backgroundColor: agreed ? colors.primary : colors.bg, alignItems: "center", justifyContent: "center" }}>
          {agreed ? <T style={{ color: colors.white, fontSize: 14, fontWeight: "900" }}>✓</T> : null}
        </View>
        <T kind="muted" style={{ flex: 1 }}>
          I agree to the{" "}
          <T kind="muted" style={{ color: colors.primary }} onPress={() => Linking.openURL(`${SITE_URL}/terms`)}>Terms of Service</T> and{" "}
          <T kind="muted" style={{ color: colors.primary }} onPress={() => Linking.openURL(`${SITE_URL}/privacy`)}>Privacy Policy</T>.
        </T>
      </Pressable>
      <Turnstile onToken={setCaptcha} />
      <Button title="Create account" onPress={submit} loading={busy} />
      <View style={{ flexDirection: "row", gap: space[1], justifyContent: "center" }}>
        <T kind="muted">Already have an account?</T>
        <Link href="/sign-in">
          <T kind="muted" style={{ color: colors.primary, fontWeight: "600" }}>Sign in</T>
        </Link>
      </View>
    </Screen>
  );
}
