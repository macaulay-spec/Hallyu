import { useState } from "react";
import { Stack } from "expo-router";
import { TextInput, View } from "react-native";
import { Screen, T, Button } from "@/components/ui";
import { useAuthActions } from "@convex-dev/auth/react";

// Account recovery (M1): Convex Auth Password "reset" flow. Without an email
// adapter configured the code cannot actually reach the user, so the flow is
// gated: the UI explains exactly what's missing (Spec §54 — never fake an
// "email sent" state). When RESEND_API_KEY is configured, this screen sends
// the real reset code.
export default function AccountRecovery() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const emailConfigured = process.env.EXPO_PUBLIC_EMAIL_CONFIGURED === "1";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn("password", { email: email.trim().toLowerCase(), flow: "reset" });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start recovery.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Account recovery
      </T>
      {emailConfigured ? (
        sent ? (
          <T variant="secondary" className="px-6 mt-4">
            If that email has an account, a reset code is on its way. Enter it
            on the next screen to choose a new password.
          </T>
        ) : (
          <View className="px-6 mt-8 gap-3">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#6B6B6B"
              autoCapitalize="none"
              keyboardType="email-address"
              className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
            />
            {error ? <T variant="secondary" className="text-coral">{error}</T> : null}
            <Button label={busy ? "Sending…" : "Send reset code"} onPress={submit} disabled={!email || busy} />
          </View>
        )
      ) : (
        <T variant="body" className="px-6 mt-6 text-text-secondary">
          Password-reset email isn't configured on this deployment yet (missing
          email service key). Until then, contact support to recover your
          account — we won't pretend a message was sent when it wasn't.
        </T>
      )}
      <T variant="tertiary" className="px-6 mt-8">
        Recovery always confirms without revealing whether an account exists.
      </T>
    </Screen>
  );
}
