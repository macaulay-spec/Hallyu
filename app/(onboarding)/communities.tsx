import { useState } from "react";
import { Stack, Link, useLocalSearchParams } from "expo-router";
import { ScrollView, TextInput, View } from "react-native";
import { Screen, T, Card, Button, ShimmerList } from "@/components/ui";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Onboarding step 4 (Spec §34): recommended communities + official accounts.
// Join/leave mutations land with communities in M5 — until then this screen
// is discovery-only, with an honest note (no fake join buttons).
export default function OnboardingCommunities() {
  const params = useLocalSearchParams<{ interests?: string }>();
  const suggestions = useQuery(api.onboarding.suggestions);
  const [term, setTerm] = useState("");
  const search = useQuery(api.onboarding.search, { q: term });

  const list = term.trim().length >= 2 ? search?.communities ?? [] : suggestions?.communities ?? [];

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <T variant="h2" className="px-6 pt-16">
        Find your people
      </T>
      <T variant="secondary" className="px-6 mt-2">
        Communities you can join once the community module ships (M5) —
        browsing is live now.
      </T>
      <View className="px-6 mt-4">
        <TextInput
          value={term}
          onChangeText={setTerm}
          placeholder="Search communities…"
          placeholderTextColor="#6B6B6B"
          className="h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
      </View>

      {suggestions === undefined && term.trim().length < 2 ? (
        <ShimmerList rows={4} />
      ) : list.length === 0 ? (
        <T variant="secondary" className="px-6 mt-6 text-center">
          No matching communities found.
        </T>
      ) : (
        <ScrollView className="mt-4" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}>
          {list.map((c) => (
            <Card key={c._id} className="p-4 mb-3">
              <T variant="h3">{c.name}</T>
              <T variant="tertiary" className="mt-1">
                {c.isPrivate ? "Private · " : ""}{c.memberCount} {c.memberCount === 1 ? "member" : "members"}
              </T>
            </Card>
          ))}
          <Link href={{ pathname: "/(onboarding)/done", params: { interests: params.interests ?? "" } }} asChild>
            <Button label="Finish" variant="secondary" />
          </Link>
        </ScrollView>
      )}
    </Screen>
  );
}
