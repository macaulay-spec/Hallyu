import { useState } from "react";
import { Stack, useLocalSearchParams, Link } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Screen, T, Card, Button, ShimmerList, cn } from "@/components/ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Onboarding step 3 (Spec §34): actor cards with follow toggles + search.
export default function OnboardingActors() {
  const params = useLocalSearchParams<{ interests?: string }>();
  const suggestions = useQuery(api.onboarding.suggestions);
  const [term, setTerm] = useState("");
  const search = useQuery(api.onboarding.search, { q: term });
  const toggleFollow = useMutation(api.onboarding.toggleFollow);
  const [pending, setPending] = useState<string | null>(null);

  const list = term.trim().length >= 2 ? search?.actors ?? [] : suggestions?.actors ?? [];

  async function toggle(slug: string) {
    setPending(slug);
    try {
      await toggleFollow({ targetType: "actor", targetId: slug });
    } finally {
      setPending(null);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Faces you love
      </T>
      <T variant="secondary" className="px-6 mt-2">
        Follow actors to catch their next project.
      </T>
      <View className="px-6 mt-4">
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Search actors…"
          placeholderTextColor="#6B6B6B"
          className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
      </View>

      {suggestions === undefined && term.trim().length < 2 ? (
        <ShimmerList rows={4} />
      ) : list.length === 0 ? (
        <T variant="secondary" className="px-6 mt-6 text-center">
          No matching actors found.
        </T>
      ) : (
        <ScrollView className="mt-4" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {list.map((a) => (
            <Card key={a._id} className="p-4 mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <T variant="h3">{a.name}</T>
                  {a.nameKr ? <T variant="tertiary">{a.nameKr}</T> : null}
                </View>
                <Pressable
                  onPress={() => toggle(a.slug)}
                  disabled={pending === a.slug}
                  className={cn("rounded-[12px] px-4 py-2", pending === a.slug ? "opacity-50 bg-card" : "bg-brand")}
                >
                  <T variant="body" className="text-white text-[13px] font-semibold">
                    Follow
                  </T>
                </Pressable>
              </View>
            </Card>
          ))}
          <Link href={{ pathname: "/(onboarding)/communities", params: { interests: params.interests ?? "" } }} asChild>
            <Button label="Next: communities" variant="secondary" />
          </Link>
        </ScrollView>
      )}
    </Screen>
  );
}
