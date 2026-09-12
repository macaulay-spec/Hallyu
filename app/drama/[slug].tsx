import { Stack, useLocalSearchParams } from "expo-router";
import { Screen, T, Card, WaveProgress } from "@/components/ui";

// Drama hub (SCREEN_NAVIGATION_MAP #16). M0 shell — slug is captured for deep
// links. M3 wires the hub: hero, titles EN+KR, genres/status, Follow,
// watching-status, cast carousel, episode list with spoiler boundaries,
// community tabs.
export default function DramaHub() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Drama hub
      </T>
      <T variant="brand" className="px-6 mt-1">
        {slug}
      </T>
      <Card className="mx-6 mt-6 p-5 items-center">
        <WaveProgress />
        <T variant="tertiary" className="mt-2 text-center">
          Poster, episodes, cast and discussion wire up in M3.
        </T>
      </Card>
    </Screen>
  );
}
