import { Stack, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Screen, T, Card, SpoilerOverlay, WaveProgress } from "@/components/ui";

// Post detail (SCREEN_NAVIGATION_MAP #21). M0 shell. M2 wires the full post,
// context tags, media viewer, 3-level comments (Spec §11), reactions with
// optimistic rollback, spoiler reveal second-fetch (D-10).
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Post
      </T>
      <T variant="brand" className="px-6 mt-1">
        {id}
      </T>
      <View className="mx-6 mt-6">
        <SpoilerOverlay
          drama="Context arrives with the social core (M2)"
          episode={null}
          watchedThrough={null}
          onReveal={() => {
            // Audited reveal — wired in M2.
          }}
        />
      </View>
      <Card className="mx-6 mt-4 p-5 items-center">
        <WaveProgress />
        <T variant="tertiary" className="mt-2 text-center">
          Post content, comments and reactions land in M2.
        </T>
      </Card>
    </Screen>
  );
}
