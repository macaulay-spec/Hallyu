import { Stack } from "expo-router";
import { Screen, T, WaveProgress } from "@/components/ui";
import { EMPTY_COPY } from "@/lib/copy";

// Notifications (SCREEN_NAVIGATION_MAP #25). M0 shell. M5 wires grouped list
// (Critical/Important/Optional), unread states, per-category preferences,
// quiet hours, and deep links for every notification type (Spec §18).
export default function Notifications() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Notifications
      </T>
      <T variant="secondary" className="px-6 mt-2 text-center">
        {EMPTY_COPY.notifications}
      </T>
      <WaveProgress className="mt-8" />
      <T variant="tertiary" className="px-6 mt-4 text-center">
        Realtime notification feed lands in M5 (Convex live queries).
      </T>
    </Screen>
  );
}
