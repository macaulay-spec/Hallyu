import { useState } from "react";
import { Stack, Link } from "expo-router";
import { TextInput, View } from "react-native";
import { Screen, T, Button } from "@/components/ui";
import { useAuthActions } from "@convex-dev/auth/react";
import { errorCopy } from "@/lib/copy";

// Real login (M1): Convex Auth Password provider, invalid-credentials copy.
export default function Login() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = /.+@.+\..+/.test(email) && password.length >= 8 && !busy;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim().toLowerCase(), password, flow: "signIn" });
      // SessionGate flips to tabs automatically on success.
    } catch {
      setError("Couldn't sign you in — check your email and password, then try again.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Log in
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
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#6B6B6B"
          secureTextEntry
          className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
        {error ? <T variant="secondary" className="text-coral">{error}</T> : null}
        <Button label={busy ? "Signing in…" : "Log in"} onPress={submit} disabled={!canSubmit} />
        <Link href="/(auth)/account-recovery" asChild>
          <Button label="Forgot password?" variant="ghost" />
        </Link>
      </View>
    </Screen>
  );
}
