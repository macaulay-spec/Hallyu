import { Stack } from "expo-router";
import { Screen, T, WaveProgress } from "@/components/ui";
import { BRAND } from "@/lib/brand";

// Splash loading state (SCREEN_NAVIGATION_MAP #1): brand mark + wave shimmer
// while session restore completes; SessionGate then routes to tabs or welcome.
export default function SplashLoading() {
  return (
    <Screen className="items-center justify-center">
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h1">{BRAND.name}</T>
      <T variant="secondary" className="mt-1">
        {BRAND.koreanName} · {BRAND.tagline}
      </T>
      <WaveProgress className="mt-8" />
    </Screen>
  );
}
