import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import { Screen, T, Card, WaveProgress, ShimmerList } from "@/components/ui";
import { EMPTY_COPY } from "@/lib/copy";

// Home (SCREEN_NAVIGATION_MAP #12). M0 shell: structure + honest empty state.
// M2 wires feeds.forYou / feeds.following + Home top modules (Airing Now,
// Drama Updates, Episode Activity, Communities for you) from Convex.
export default function Home() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <T variant="h2">Home</T>
          <T variant="tertiary" className="mt-1">
            For You / Following segmented control arrives with feeds (M2).
          </T>
        </View>

        <T variant="h3" className="px-4 mt-6 mb-3">
          Airing Now
        </T>
        <View className="px-4">
          <Card className="p-4 items-center">
            <WaveProgress />
            <T variant="tertiary" className="mt-2 text-center">
              Populated from the drama graph in M3.
            </T>
          </Card>
        </View>

        <T variant="h3" className="px-4 mt-6 mb-3">
          Episode Activity
        </T>
        <View className="px-4">
          <Card className="p-4 items-center">
            <WaveProgress />
            <T variant="tertiary" className="mt-2 text-center">
              Live episode discussions land in M3.
            </T>
          </Card>
        </View>

        <T variant="h3" className="px-4 mt-6 mb-3">
          Feed
        </T>
        <ShimmerList rows={3} />
        <T variant="secondary" className="px-6 text-center">
          {EMPTY_COPY.feed}
        </T>
      </ScrollView>
    </Screen>
  );
}
