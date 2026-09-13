import { useState } from "react";
import { Stack, Link } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Screen, T, Row, WaveProgress, EmptyState, cn } from "@/components/ui";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { EMPTY_COPY } from "@/lib/copy";

// Explore (SCREEN_NAVIGATION_MAP #13): search + live rails. M3 wires real
// data (airing, upcoming, communities, actors); M4 adds the trending cron's
// rail and explainable For You ranking.
export default function Explore() {
  const [q, setQ] = useState("");

  const live = EXPO_PUBLIC_CONVEX_URL ? {} : "skip";
  const airing = useQuery(api.dramas.listAiring, live);
  const upcoming = useQuery(api.dramas.listUpcoming, live);
  const results = useQuery(
    api.onboarding.search,
    EXPO_PUBLIC_CONVEX_URL && q.trim().length >= 2 ? { q: q.trim() } : "skip"
  );

  const searching = q.trim().length >= 2;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4">
          <T variant="h2">Explore</T>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search dramas, actors, communities…"
            placeholderTextColor="#6B6B6B"
            autoCapitalize="none"
            className="mt-3 h-11 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
          />
        </View>

        {searching ? (
          <View className="mt-4">
            {results === undefined ? (
              <WaveProgress className="mt-6" />
            ) : results.dramas.length === 0 &&
              results.actors.length === 0 &&
              results.communities.length === 0 ? (
              <EmptyState copy={EMPTY_COPY.search} />
            ) : (
              <>
                {results.dramas.length > 0 ? (
                  <View className="mt-2">
                    <T variant="h3" className="px-4 mb-2">Dramas</T>
                    {results.dramas.map((d) => (
                      <Link key={d._id} href={`/drama/${d.slug}`} asChild>
                        <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                          <T variant="h3">{d.title}</T>
                          <T variant="tertiary">{d.genres.join(" · ")}</T>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : null}
                {results.actors.length > 0 ? (
                  <View className="mt-2">
                    <T variant="h3" className="px-4 mb-2">Actors</T>
                    {results.actors.map((a) => (
                      <Link key={a._id} href={`/actor/${a.slug}`} asChild>
                        <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                          <T variant="h3">{a.name}</T>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : null}
                {results.communities.length > 0 ? (
                  <View className="mt-2">
                    <T variant="h3" className="px-4 mb-2">Communities</T>
                    {results.communities.map((c) => (
                      <Link key={c._id} href={`/community/${c.slug}`} asChild>
                        <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                          <T variant="h3">{c.name}</T>
                          <T variant="tertiary">{c.memberCount} members</T>
                        </Pressable>
                      </Link>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : (
          <>
            {/* Currently airing */}
            <View className="mt-6">
              <T variant="h3" className="px-4 mb-3">Currently airing</T>
              {airing === undefined ? (
                <WaveProgress />
              ) : airing.length === 0 ? (
                <T variant="tertiary" className="px-4">Nothing airing right now.</T>
              ) : (
                (airing as Array<{ slug: string; title: string; titleKr?: string | null; genres: string[]; network?: string | null; releaseSchedule?: string | null }>).map((d) => (
                  <Link key={d.slug} href={`/drama/${d.slug}`} asChild>
                    <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                      <Row className="justify-between">
                        <View className="flex-1">
                          <T variant="h3">{d.title}</T>
                          <T variant="tertiary">
                            {[d.genres.join(" · "), d.network].filter(Boolean).join(" — ")}
                          </T>
                          {d.releaseSchedule ? (
                            <T variant="coral" className="mt-0.5">{d.releaseSchedule}</T>
                          ) : null}
                        </View>
                        <T variant="tertiary">›</T>
                      </Row>
                    </Pressable>
                  </Link>
                ))
              )}
            </View>

            {/* Upcoming */}
            <View className="mt-6">
              <T variant="h3" className="px-4 mb-3">Upcoming</T>
              {upcoming === undefined ? (
                <WaveProgress />
              ) : upcoming.length === 0 ? (
                <T variant="tertiary" className="px-4">Nothing announced yet.</T>
              ) : (
                (upcoming as Array<{ slug: string; title: string; genres: string[]; year?: number | null }>).map((d) => (
                  <Link key={d.slug} href={`/drama/${d.slug}`} asChild>
                    <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                      <Row className="justify-between">
                        <View className="flex-1">
                          <T variant="h3">{d.title}</T>
                          <T variant="tertiary">{d.genres.join(" · ")}</T>
                        </View>
                        {d.year ? <T variant="tertiary">{d.year}</T> : null}
                      </Row>
                    </Pressable>
                  </Link>
                ))
              )}
            </View>

            <T variant="tertiary" className="px-4 mt-6">
              Trending rails arrive with the trend-score sweep in M4 — they'll
              reflect real activity, never invented numbers.
            </T>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
