import { Stack } from "expo-router";
import { Screen, T, WaveProgress } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { FONTS } from "@/lib/theme";

// Splash loading state (SCREEN_NAVIGATION_MAP #1): serif wordmark + wave
// shimmer while session restore completes; SessionGate then routes to tabs or
// welcome.
export default function SplashLoading() {
  return (
    <Screen className="items-center justify-center">
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="display" style={{ fontFamily: FONTS.display }}>
        {BRAND.name}
      </T>
      <T variant="secondary" className="mt-1">
        {BRAND.koreanName} · {BRAND.tagline}
      </T>
      <WaveProgress className="mt-8" />
    </Screen>
  );
}
