import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";
import { Screen, T, Card, WaveProgress } from "@/components/ui";
import { EMPTY_COPY } from "@/lib/copy";

// Explore (SCREEN_NAVIGATION_MAP #13). M0 shell: rails + search structure.
// M4 wires trending, currently-airing, upcoming, actors, communities rails and
// the SearchOverlay with entity-typed results.
export default function Explore() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-4 pt-4">
          <T variant="h2">Explore</T>
          <T variant="tertiary" className="mt-1">
            Search overlay arrives in M4.
          </T>
        </View>

        {["Trending", "Currently Airing", "Upcoming", "Actors", "Communities"].map((rail) => (
          <View key={rail} className="mt-6">
            <T variant="h3" className="px-4 mb-3">
              {rail}
            </T>
            <Card className="mx-4 p-4 items-center">
              <WaveProgress />
              <T variant="tertiary" className="mt-2 text-center">
                {EMPTY_COPY.search}
              </T>
            </Card>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
