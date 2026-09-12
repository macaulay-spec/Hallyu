import { useEffect, useMemo, useState } from "react";
import { Stack, useLocalSearchParams, Link } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Screen, T, Card, Button, ShimmerList, EmptyState, cn } from "@/components/ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { INTEREST_OPTIONS } from "@/lib/interests";

// Onboarding step 2 (Spec §34): searchable drama cards with follow toggles;
// suggestions derive from the interests picked in step 1 (genre match).
export default function OnboardingDramas() {
  const params = useLocalSearchParams<{ interests?: string }>();
  const interests = useMemo(
    () => (params.interests ?? "").split(",").filter(Boolean),
    [params.interests]
  );

  const suggestions = useQuery(api.onboarding.suggestions);
  const [term, setTerm] = useState("");
  const search = useQuery(api.onboarding.search, { q: term });

  const toggleFollow = useMutation(api.onboarding.toggleFollow);
  const [pending, setPending] = useState<string | null>(null);

  const list = term.trim().length >= 2 ? search?.dramas ?? [] : suggestions?.dramas ?? [];
  const matchedInterests = interests
    .map((i) => INTEREST_OPTIONS.find((o) => o.toLowerCase() === i.toLowerCase()) ?? i)
    .map((i) => i.split(" ")[0]!.toLowerCase());

  const sorted = useMemo(() => {
    if (term.trim().length >= 2 || interests.length === 0) return list;
    return [...list].sort((a, b) => {
      const aHit = a.genres.some((g) => matchedInterests.some((m) => g.toLowerCase().includes(m))) ? 0 : 1;
      const bHit = b.genres.some((g) => matchedInterests.some((m) => g.toLowerCase().includes(m))) ? 0 : 1;
      return aHit - bHit;
    });
  }, [list, term, interests.length, matchedInterests]);

  async function toggle(slug: string, following: boolean | undefined) {
    setPending(slug);
    try {
      await toggleFollow({ targetType: "drama", targetId: slug });
      void following;
    } finally {
      setPending(null);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Pick favorite dramas
      </T>
      <T variant="secondary" className="px-6 mt-2">
        Follow a few — your feed and spoiler protection build from these.
      </T>
      <View className="px-6 mt-4">
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Search dramas…"
          placeholderTextColor="#6B6B6B"
          className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
      </View>

      {suggestions === undefined && term.trim().length < 2 ? (
        <ShimmerList rows={4} />
      ) : sorted.length === 0 ? (
        <EmptyState copy="No matching dramas found. Try another title." />
      ) : (
        <ScrollView className="mt-4" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {sorted.map((d) => (
            <Card key={d._id} className="p-4 mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <T variant="h3">{d.title}</T>
                  {d.titleKr ? <T variant="tertiary">{d.titleKr}</T> : null}
                  <T variant="tertiary" className="mt-1">
                    {d.genres.join(" · ")}{d.status === "airing" ? " · Airing" : ""}
                  </T>
                </View>
                <Pressable
                  onPress={() => toggle(d.slug, undefined)}
                  disabled={pending === d.slug}
                  className={cn(
                    "rounded-[12px] px-4 py-2",
                    pending === d.slug ? "opacity-50 bg-card" : "bg-brand"
                  )}
                >
                  <T variant="body" className="text-white text-[13px] font-semibold">
                    Follow
                  </T>
                </Pressable>
              </View>
            </Card>
          ))}
          <Link href={{ pathname: "/(onboarding)/actors", params: { interests: interests.join(",") } }} asChild>
            <Button label="Next: actors" variant="secondary" />
          </Link>
        </ScrollView>
      )}
    </Screen>
  );
}
