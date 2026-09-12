import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Screen, T, Card, SpoilerOverlay, WaveProgress } from "@/components/ui";

// Episode page (SCREEN_NAVIGATION_MAP #17). M0 shell. M3 wires the
// first-class episode discussion, spoiler boundary banner ("Beyond here:
// Ep 8 — you've watched through Ep 6"), watched-toggle, reactions rail.
export default function EpisodePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Episode
      </T>
      <T variant="brand" className="px-6 mt-1">
        {id}
      </T>
      <View className="mx-6 mt-6">
        <SpoilerOverlay
          drama="Context arrives with the drama graph (M3)"
          episode={null}
          watchedThrough={null}
          onReveal={() => {
            // Reveal is an audited second fetch (D-10) — wired in M3.
          }}
        />
      </View>
      <Card className="mx-6 mt-4 p-5 items-center">
        <WaveProgress />
        <T variant="tertiary" className="mt-2 text-center">
          Discussion stream lands in M3.
        </T>
      </Card>
    </Screen>
  );
}
