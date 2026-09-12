import { useState } from "react";
import { Stack } from "expo-router";
import { TextInput, View } from "react-native";
import { Screen, T, Button } from "@/components/ui";
import { useAuthActions } from "@convex-dev/auth/react";
import { errorCopy } from "@/lib/copy";

// Real sign-up (M1): Convex Auth Password provider. Inline validation +
// humane error mapping (Spec §38). Success routes into onboarding (Spec §34).
export default function SignUp() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ title: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const emailOk = /.+@.+\..+/.test(email);
  const pwOk = password.length >= 8;
  const canSubmit = emailOk && pwOk && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim().toLowerCase(), password, flow: "signUp" });
      // Router redirect is handled by SessionGate once auth state flips.
    } catch (e) {
      const msg = e instanceof Error ? e.message : "UNKNOWN";
      setError(msg.includes("already") ? errorCopy("AUTH_INVALID") : errorCopy("UNKNOWN"));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Create your account
      </T>
      <T variant="secondary" className="px-6 mt-2">
        Join the wave — follow dramas, discuss episodes safely.
      </T>

      <View className="px-6 mt-8 gap-3">
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#6B6B6B"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
        {!emailOk && email.length > 0 ? (
          <T variant="tertiary" className="text-coral">
            Enter a valid email address.
          </T>
        ) : null}
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (8+ characters)"
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
        {password.length > 0 && !pwOk ? (
          <T variant="tertiary" className="text-coral">
            At least 8 characters.
          </T>
        ) : null}
        {error ? (
          <T variant="secondary" className="text-coral">
            {error.title} — {error.body}
          </T>
        ) : null}
        <Button label={busy ? "Creating account…" : "Sign up"} onPress={submit} disabled={!canSubmit} />
      </View>
      <T variant="tertiary" className="px-6 mt-6">
        By continuing you agree to the Terms and Privacy Policy.
      </T>
    </Screen>
  );
}
