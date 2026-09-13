import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Screen, T, Row, WaveProgress, EmptyState } from "@/components/ui";
import { Link } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Actor page (SCREEN_NAVIGATION_MAP #19): filmography + follow. Fictional
// seed per D-05; TMDB enrichment arrives via the config-gated sync.
export default function ActorPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const actor = useQuery(
    api.actors.getBySlug,
    EXPO_PUBLIC_CONVEX_URL && slug ? { slug } : "skip"
  );
  const toggleFollow = useMutation(api.onboarding.toggleFollow);

  if (EXPO_PUBLIC_CONVEX_URL && actor === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <WaveProgress className="mt-24" />
      </Screen>
    );
  }

  if (!actor) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState copy="This actor doesn't exist — or hasn't been added yet." />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-[#150A20] px-6 pt-16 pb-6">
          <T variant="h1">{actor.name}</T>
          {actor.nameKr ? <T variant="brand" className="mt-1">{actor.nameKr}</T> : null}
          <T variant="secondary" className="mt-2">
            {actor.followerCount} followers
          </T>
          {actor.bio ? (
            <T variant="body" className="mt-3 text-text-secondary">{actor.bio}</T>
          ) : null}
        </View>

        <View className="mt-6">
          <Row className="px-4 justify-between">
            <T variant="h3">Filmography</T>
            <T variant="tertiary">{actor.credits.length} credits</T>
          </Row>
          {actor.credits.length === 0 ? (
            <T variant="tertiary" className="px-4 mt-2">No credits yet.</T>
          ) : (
            <View className="mt-3">
              {actor.credits.map(
                (c) => (
                  <Link key={c.dramaSlug} href={`/drama/${c.dramaSlug}`} asChild>
                    <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                      <Row className="justify-between">
                        <View className="flex-1">
                          <T variant="h3">{c.title}</T>
                          <T variant="tertiary">
                            {[
                              c.year,
                              c.characterName ? `as ${c.characterName}` : null,
                              c.status,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </T>
                        </View>
                        <T variant="tertiary">›</T>
                      </Row>
                    </Pressable>
                  </Link>
                )
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
