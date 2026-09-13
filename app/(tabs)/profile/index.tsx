import { useState } from "react";
import { Stack, Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Screen, T, Button, Card, Row, WaveProgress, EmptyState, cn } from "@/components/ui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { EMPTY_COPY } from "@/lib/copy";

const PREFS = [
  { value: "strict", label: "Strict", hint: "Hide all tagged spoilers, even watched episodes" },
  { value: "balanced", label: "Balanced", hint: "Guard episodes you haven't reached" },
  { value: "relaxed", label: "Relaxed", hint: "Show tagged spoilers — I don't mind" },
] as const;

// Profile (SCREEN_NAVIGATION_MAP #26): identity, stats, Currently Watching
// (the spoiler engine's control panel), spoiler preference, sign out.
export default function Profile() {
  const me = useQuery(api.users.me, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const watching = useQuery(api.watching.listMine, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const setPreference = useMutation(api.users.setSpoilerPreference);
  const { signOut } = useAuthActions();
  const [prefBusy, setPrefBusy] = useState(false);

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

  async function onPreference(p: "strict" | "balanced" | "relaxed") {
    setPrefBusy(true);
    try {
      await setPreference({ preference: p });
    } finally {
      setPrefBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
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
            {me.isPrivate ? "Private" : "Public"} account
          </T>
        </Card>
        {!me.onboardingComplete ? (
          <Link href="/(onboarding)/interests" asChild>
            <Button label="Finish setting up your feed" variant="secondary" className="mx-6 mt-4" />
          </Link>
        ) : null}

        {/* Currently Watching (§13): the spoiler engine's input surface */}
        <View className="mt-8">
          <Row className="px-6 justify-between">
            <T variant="h3">Currently watching</T>
            <Link href="/(tabs)/explore" asChild>
              <Pressable>
                <T variant="brand">Browse</T>
              </Pressable>
            </Link>
          </Row>
          {watching === undefined ? (
            <WaveProgress className="mt-4" />
          ) : watching.length === 0 ? (
            <T variant="secondary" className="px-6 mt-2">
              {EMPTY_COPY.watching}
            </T>
          ) : (
            <View className="mt-3">
              {(watching as Array<{
                dramaSlug: string;
                title: string;
                status: string;
                watchedThrough: number;
              }>).map((w) => (
                <Link key={w.dramaSlug} href={`/drama/${w.dramaSlug}`} asChild>
                  <Pressable className="mx-6 mb-2 rounded-[12px] bg-card border border-line p-4">
                    <Row className="justify-between">
                      <View className="flex-1">
                        <T variant="h3">{w.title}</T>
                        <T variant="tertiary" className="mt-0.5">
                          {w.status === "watching"
                            ? `Watching · through Ep ${w.watchedThrough}`
                            : w.status.replace("_", " ")}
                        </T>
                      </View>
                      <T variant="tertiary">›</T>
                    </Row>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        {/* Spoiler preference (§9) */}
        <View className="mt-8 px-6">
          <T variant="h3">Spoiler safety</T>
          <T variant="tertiary" className="mt-1 mb-2">
            How aggressively we guard tagged content for you.
          </T>
          <View className="gap-2">
            {PREFS.map((p) => (
              <Pressable
                key={p.value}
                onPress={() => onPreference(p.value)}
                disabled={prefBusy}
                className={cn(
                  "rounded-[12px] border p-4",
                  me.spoilerPreference === p.value ? "border-brand bg-card" : "border-line bg-card"
                )}
              >
                <Row className="justify-between">
                  <View className="flex-1">
                    <T variant="body" className={me.spoilerPreference === p.value ? "text-brand font-semibold" : ""}>
                      {p.label}
                    </T>
                    <T variant="tertiary" className="mt-0.5">{p.hint}</T>
                  </View>
                  {me.spoilerPreference === p.value ? <T variant="brand">✓</T> : null}
                </Row>
              </Pressable>
            ))}
          </View>
        </View>

        <Button label="Sign out" variant="ghost" className="mx-6 mt-8" onPress={() => signOut()} />
      </ScrollView>
    </Screen>
  );
}
