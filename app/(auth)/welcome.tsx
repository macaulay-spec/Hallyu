import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen, T, Button, WaveProgress } from "@/components/ui";
import { BRAND, CONFIG_STATUS } from "@/lib/brand";

// Welcome (SCREEN_NAVIGATION_MAP #2) — the first touch of the brand: full
// gradient field, serif wordmark, the wave promise, then auth CTAs. Config
// status stays honest (Spec §54) but quiet, at the bottom.
export default function Welcome() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={["#2A0A45", "#5B21C9", "#0C0817"]} style={{ flex: 1 }}>
        <View className="flex-1 justify-end px-6 pb-10">
          <View className="flex-1 items-center justify-center">
            <T variant="display" className="text-[56px]">
              {BRAND.name}
            </T>
            <T className="text-white/75 mt-1">
              {BRAND.koreanName} · {BRAND.tagline}
            </T>
            <WaveProgress className="mt-10" />
          </View>

          <T variant="hero" className="text-white">
            The social home for K-drama fandom.
          </T>
          <T className="text-white/75 mt-2 leading-6">
            Every drama, episode, conversation and community — connected into one
            living fan experience, with spoiler protection built into its heart.
          </T>

          <Link href="/(auth)/login" asChild>
            <Button label="Log in" variant="secondary" className="mt-8 border-white/30 bg-white/10" />
          </Link>
          <Link href="/(auth)/sign-up" asChild>
            <Button label="Create your account" variant="gradient" className="mt-3" />
          </Link>

          <T variant="tertiary" className="mt-6 text-center">
            Backend {CONFIG_STATUS.convex ? "connected" : "preview mode"} · TMDB{" "}
            {CONFIG_STATUS.tmdb ? "configured" : "seed data"} · Push{" "}
            {CONFIG_STATUS.push ? "configured" : "in-app only"}
          </T>
          <T variant="tertiary" className="mt-2 text-center">
            By continuing you agree to the Terms and Privacy Policy.
          </T>
        </View>
      </LinearGradient>
    </Screen>
  );
}
