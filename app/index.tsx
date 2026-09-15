import { Redirect } from "expo-router";
import { Screen, T, WaveProgress } from "@/components/ui";
import { BRAND } from "@/lib/brand";
import { FONTS } from "@/lib/theme";

// Entry: bounces into the gated tab area; SessionGate decides between tabs
// and welcome (and shows the wave splash while the session restores).
export default function Splash() {
  return (
    <Screen className="items-center justify-center">
      <T variant="display" style={{ fontFamily: FONTS.display }}>{BRAND.name}</T>
      <T variant="secondary" className="mt-1">
        {BRAND.koreanName} · {BRAND.tagline}
      </T>
      <WaveProgress className="mt-8" />
      <Redirect href="/(tabs)/home" />
    </Screen>
  );
}
