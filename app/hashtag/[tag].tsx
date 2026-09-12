import { Stack, useLocalSearchParams } from "expo-router";
import { Screen, T, Card, WaveProgress } from "@/components/ui";
import { EMPTY_COPY } from "@/lib/copy";

// Hashtag page (SCREEN_NAVIGATION_MAP #20). M0 shell. M2 wires the tag's post
// stream with spoiler-guarded cards.
export default function HashtagPage() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        #{tag}
      </T>
      <Card className="mx-6 mt-6 p-5 items-center">
        <WaveProgress />
        <T variant="tertiary" className="mt-2 text-center">
          {EMPTY_COPY.hashtag}
        </T>
      </Card>
    </Screen>
  );
}
