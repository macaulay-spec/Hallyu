import { useEffect, useState } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Screen, T, WaveProgress, Button } from "@/components/ui";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Onboarding completion (Spec §34): persists interests, marks onboarding
// complete, then lands the user in Home — "Your feed is ready."
export default function OnboardingDone() {
  const params = useLocalSearchParams<{ interests?: string }>();
  const complete = useMutation(api.onboarding.complete);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const interests = (params.interests ?? "").split(",").filter(Boolean);
    complete({ interests })
      .then(() => setDone(true))
      .catch(() => setFailed(true));
  }, [complete, params.interests]);

  return (
    <Screen className="items-center justify-center">
      <Stack.Screen options={{ headerShown: false }} />
      {failed ? (
        <>
          <T variant="h3">Couldn't save your preferences.</T>
          <T variant="secondary" className="mt-2 px-8 text-center">
            Check your connection and try again.
          </T>
          <Button
            label="Retry"
            variant="secondary"
            className="mt-6"
            onPress={() => {
              setFailed(false);
              complete({ interests: (params.interests ?? "").split(",").filter(Boolean) })
                .then(() => setDone(true))
                .catch(() => setFailed(true));
            }}
          />
        </>
      ) : done ? (
        <>
          <T variant="h2" className="text-center px-8">
            Your feed is ready
          </T>
          <WaveProgress className="mt-6" />
          <Button label="Enter Hallyu" className="mt-8" onPress={() => router.replace("/(tabs)/home")} />
        </>
      ) : (
        <>
          <WaveProgress />
          <T variant="tertiary" className="mt-4">
            Setting up your feed…
          </T>
        </>
      )}
    </Screen>
  );
}
