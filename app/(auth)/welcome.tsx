import { Link, Stack } from "expo-router";
import { Screen, T, Button } from "@/components/ui";
import { BRAND, CONFIG_STATUS } from "@/lib/brand";

export default function Welcome() {
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h1" className="px-6 pt-20">
        {BRAND.name}
      </T>
      <T variant="brand" className="px-6 mt-1">
        {BRAND.tagline}
      </T>
      <T variant="body" className="px-6 mt-4 text-text-secondary">
        The social home for K-drama fandom — every drama, episode, conversation
        and community connected into one living fan experience.
      </T>
      <T variant="tertiary" className="px-6 mt-6">
        Backend: {CONFIG_STATUS.convex ? "connected" : "not configured yet — UI preview mode"}
      </T>
      <T variant="tertiary" className="px-6 mt-1">
        TMDB sync: {CONFIG_STATUS.tmdb ? "configured" : "not configured (seed data in use)"}
      </T>
      <T variant="tertiary" className="px-6 mt-1">
        Push: {CONFIG_STATUS.push ? "configured" : "not configured (in-app only)"}
      </T>
      <T variant="body" className="px-6 mt-8 text-text-tertiary">
        Real authentication, feeds, discussions and spoiler protection arrive
        with milestone M1. This is the M0 shell.
      </T>
      <T variant="tertiary" className="px-6 mt-6">
        By continuing you agree to the Terms and Privacy Policy.
      </T>
      <Link href="/(auth)/login" asChild>
        <Button label="Log in" variant="secondary" className="mx-6 mt-8" />
      </Link>
      <Link href="/(auth)/sign-up" asChild>
        <Button label="Sign up" className="mx-6 mt-3" />
      </Link>
    </Screen>
  );
}
