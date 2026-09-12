import { Stack, Link } from "expo-router";
import { Screen, T, Button, Card, WaveProgress } from "@/components/ui";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Profile (SCREEN_NAVIGATION_MAP #26). M1: real viewer identity + sign out.
// M2 adds posts/saved/followers/following tabs; M3 adds Currently Watching.
export default function Profile() {
  const me = useQuery(api.users.me, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const { signOut } = useAuthActions();

  if (EXPO_PUBLIC_CONVEX_URL && me === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <WaveProgress className="mt-24" />
      </Screen>
    );
  }

  if (!me) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <T variant="h2" className="px-6 pt-16">
          Profile
        </T>
        <T variant="secondary" className="px-6 mt-2">
          Backend not connected — running in preview mode.
        </T>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        {me.displayName}
      </T>
      <T variant="brand" className="px-6 mt-1">
        @{me.handle}
      </T>
      {me.bio ? (
        <T variant="body" className="px-6 mt-3 text-text-secondary">
          {me.bio}
        </T>
      ) : null}
      <Card className="mx-6 mt-6 p-4">
        <T variant="secondary">
          {me.followerCount} followers · {me.followingCount} following · {me.postCount} posts
        </T>
        <T variant="tertiary" className="mt-1">
          Spoiler preference: {me.spoilerPreference} · {me.isPrivate ? "Private" : "Public"} account
        </T>
      </Card>
      {!me.onboardingComplete ? (
        <Link href="/(onboarding)/interests" asChild>
          <Button label="Finish setting up your feed" variant="secondary" className="mx-6 mt-4" />
        </Link>
      ) : null}
      <Button label="Sign out" variant="ghost" className="mx-6 mt-6" onPress={() => signOut()} />
    </Screen>
  );
}
