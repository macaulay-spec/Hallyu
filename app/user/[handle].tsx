import { Stack, useLocalSearchParams } from "expo-router";
import { Screen, T, Card, WaveProgress } from "@/components/ui";

// User profile page (SCREEN_NAVIGATION_MAP #26 other-user variant). M0 shell.
// M2 wires follow button, posts grid, mutual info, block/mute overflow.
export default function UserPage() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        @{handle}
      </T>
      <Card className="mx-6 mt-6 p-5 items-center">
        <WaveProgress />
        <T variant="tertiary" className="mt-2 text-center">
          Profile details land in M2.
        </T>
      </Card>
    </Screen>
  );
}
