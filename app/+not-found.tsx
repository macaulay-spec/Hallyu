import { Stack } from "expo-router";
import { Screen, T, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <Screen className="items-center justify-center px-8">
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h3" className="text-center">
        This page doesn't exist.
      </T>
      <T variant="secondary" className="text-center mt-1.5">
        The link may be broken or the content removed.
      </T>
      <T variant="tertiary" className="text-center mt-4">
        Deep links landing here are logged for routing fixes.
      </T>
    </Screen>
  );
}
