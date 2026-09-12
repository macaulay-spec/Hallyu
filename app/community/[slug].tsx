import { Stack, useLocalSearchParams } from "expo-router";
import { Screen, T, Card, WaveProgress } from "@/components/ui";

// Community page (SCREEN_NAVIGATION_MAP #19). M0 shell. M5 wires join/leave,
// private join-request flow, roles, rules sheet, moderator actions.
export default function CommunityPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Community
      </T>
      <T variant="brand" className="px-6 mt-1">
        {slug}
      </T>
      <Card className="mx-6 mt-6 p-5 items-center">
        <WaveProgress />
        <T variant="tertiary" className="mt-2 text-center">
          Members, rules and feed land in M5.
        </T>
      </Card>
    </Screen>
  );
}
