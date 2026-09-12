import { Stack } from "expo-router";
import { View } from "react-native";
import { Screen, T, Card } from "@/components/ui";

// Create (SCREEN_NAVIGATION_MAP #23 CreateHub). M0 shell. M2 wires the real
// composer (5,000-char counter, categories, drama/episode tagger, spoiler
// toggle, ≤4 images, alt-text, preview, publish). Video shows an honest
// "coming in v1.1" chip — never a fake button (Spec §22/§39).
export default function Create() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false, presentation: "modal" }} />
      <T variant="h2" className="px-6 pt-14">
        Create
      </T>
      <Card className="mx-6 mt-6 p-5">
        <T variant="h3">Post</T>
        <T variant="secondary" className="mt-1">
          Text + image composer — wired to Convex in M2.
        </T>
      </Card>
      <Card className="mx-6 mt-3 p-5">
        <T variant="h3">Image</T>
        <T variant="secondary" className="mt-1">
          Photo Picker, ≤4 images, JPEG/PNG/WebP ≤10MB — M2.
        </T>
      </Card>
      <Card className="mx-6 mt-3 p-5 opacity-60">
        <T variant="h3">Video · Poll</T>
        <T variant="secondary" className="mt-1">
          Coming in v1.1 — intentionally not functional yet (Spec §22).
        </T>
      </Card>
      <View className="px-6 mt-8">
        <T variant="tertiary">
          Every option above becomes real only when its end-to-end flow works
          (Spec §45). No placeholder buttons that pretend to publish.
        </T>
      </View>
    </Screen>
  );
}
