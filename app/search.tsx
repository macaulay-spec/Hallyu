import { useEffect, useState } from "react";
import { Stack, Link, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Screen,
  T,
  Row,
  Card,
  Chip,
  Badge,
  Avatar,
  ShimmerList,
  EmptyState,
  Button,
} from "@/components/ui";
import { PostCard } from "@/components/PostCard";
import { EMPTY_COPY } from "@/lib/copy";
import { localClear, localList, localPush } from "@/lib/local-store";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Search (SCREEN_NAVIGATION_MAP #14/#15, Spec §16). One debounced query returns
// entity-typed groups; filter chips narrow to a single type. Recent searches are
// stored locally on the device and never sent to the server.

const ENTITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "dramas", label: "Dramas" },
  { value: "actors", label: "Actors" },
  { value: "users", label: "Users" },
  { value: "communities", label: "Communities" },
  { value: "hashtags", label: "Hashtags" },
  { value: "posts", label: "Posts" },
] as const;

type Entity = (typeof ENTITY_FILTERS)[number]["value"];
const RECENT_KEY = "hallyu.recentSearches";

export default function Search() {
  const params = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const [raw, setRaw] = useState(params.q ?? "");
  const [term, setTerm] = useState(params.q ?? "");
  const [entity, setEntity] = useState<Entity>("all");
  const [recent, setRecent] = useState<string[]>([]);

  // Debounce typing so each keystroke isn't a query (§16 typing-state).
  useEffect(() => {
    const id = setTimeout(() => setTerm(raw.trim()), 250);
    return () => clearTimeout(id);
  }, [raw]);

  useEffect(() => {
    localList(RECENT_KEY).then(setRecent);
  }, []);

  const results = useQuery(
    api.search.all,
    EXPO_PUBLIC_CONVEX_URL && term.length >= 2 ? { q: term, entity } : "skip"
  );
  const trending = useQuery(api.search.trendingSearches, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");

  function commit(value: string) {
    setRaw(value);
    setTerm(value.trim());
    localPush(RECENT_KEY, value.trim()).then(setRecent);
  }

  const total =
    (results?.dramas.length ?? 0) +
    (results?.actors.length ?? 0) +
    (results?.users.length ?? 0) +
    (results?.communities.length ?? 0) +
    (results?.hashtags.length ?? 0) +
    (results?.posts.length ?? 0);

  const searching = term.length >= 2;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-4 pt-14">
        <Row className="justify-between">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
          >
            <T variant="secondary">‹</T>
          </Pressable>
          <T variant="h2" className="flex-1 px-3">
            Search
          </T>
        </Row>
        <TextInput
          value={raw}
          onChangeText={setRaw}
          onSubmitEditing={() => raw.trim().length >= 2 && commit(raw)}
          placeholder="Dramas, actors, users, communities, hashtags…"
          placeholderTextColor="#6B6B6B"
          autoCapitalize="none"
          autoFocus
          returnKeyType="search"
          className="mt-4 h-12 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 flex-grow-0">
          <Row>
            {ENTITY_FILTERS.map((f) => (
              <Chip key={f.value} label={f.label} active={entity === f.value} onPress={() => setEntity(f.value)} />
            ))}
          </Row>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 mt-2" contentContainerStyle={{ paddingBottom: 40 }}>
        {!searching ? (
          <View className="px-4">
            {recent.length > 0 ? (
              <>
                <Row className="justify-between mb-2 mt-2">
                  <T variant="h3">Recent</T>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => localClear(RECENT_KEY).then(() => setRecent([]))}
                  >
                    <T variant="brand">Clear all</T>
                  </Pressable>
                </Row>
                <Row className="flex-wrap">
                  {recent.map((r) => (
                    <Chip key={r} label={r} onPress={() => commit(r)} />
                  ))}
                </Row>
              </>
            ) : null}

            <T variant="h3" className="mt-4 mb-2">
              Trending searches
            </T>
            {trending === undefined ? (
              <ShimmerList rows={1} />
            ) : trending.length === 0 ? (
              <T variant="tertiary">
                Nothing is trending yet — trending searches come from real hashtag
                usage and followed dramas, never an invented list.
              </T>
            ) : (
              <Row className="flex-wrap">
                {trending.map((t) => (
                  <Chip
                    key={`${t.kind}:${t.value}`}
                    label={t.label}
                    onPress={() => commit(t.value)}
                  />
                ))}
              </Row>
            )}
          </View>
        ) : results === undefined ? (
          <ShimmerList rows={4} />
        ) : total === 0 ? (
          <EmptyState
            copy={EMPTY_COPY.search}
            cta="Browse trending"
            onCta={() => router.push("/explore")}
          />
        ) : (
          <View>
            {results.dramas.length > 0 ? (
              <View className="mt-3">
                <T variant="h3" className="px-4 mb-2">
                  Dramas
                </T>
                {results.dramas.map((d) => (
                  <Link key={d.slug} href={`/drama/${d.slug}`} asChild>
                    <Pressable accessibilityRole="button">
                      <Card className="mx-4 mb-2 p-3.5">
                        <Row className="justify-between">
                          <View className="flex-1 pr-3">
                            <T variant="h3">{d.title}</T>
                            <T variant="tertiary">
                              {[d.titleKr, d.genres.join(" · "), d.year].filter(Boolean).join(" — ")}
                            </T>
                          </View>
                          <Badge
                            label={d.status.toUpperCase()}
                            tone={d.status === "airing" ? "success" : d.status === "upcoming" ? "warn" : "muted"}
                          />
                        </Row>
                      </Card>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null}

            {results.actors.length > 0 ? (
              <View className="mt-3">
                <T variant="h3" className="px-4 mb-2">
                  Actors
                </T>
                {results.actors.map((a) => (
                  <Link key={a.slug} href={`/actor/${a.slug}`} asChild>
                    <Pressable accessibilityRole="button">
                      <Card className="mx-4 mb-2 p-3.5">
                        <Row>
                          <Avatar name={a.name} size={36} />
                          <View className="ml-3 flex-1">
                            <T variant="h3">{a.name}</T>
                            <T variant="tertiary">
                              {a.nameKr ? `${a.nameKr} · ` : ""}
                              {a.followerCount} followers
                            </T>
                          </View>
                        </Row>
                      </Card>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null}

            {results.users.length > 0 ? (
              <View className="mt-3">
                <T variant="h3" className="px-4 mb-2">
                  Users
                </T>
                {results.users.map((u) => (
                  <Link key={u.handle} href={`/user/${u.handle}`} asChild>
                    <Pressable accessibilityRole="button">
                      <Card className="mx-4 mb-2 p-3.5">
                        <Row>
                          <Avatar name={u.displayName} size={36} />
                          <View className="ml-3 flex-1">
                            <Row>
                              <T variant="h3">{u.displayName}</T>
                              {u.verified ? <Badge label="VERIFIED" tone="brand" className="ml-2" /> : null}
                              {u.official ? <Badge label="OFFICIAL" tone="coral" className="ml-2" /> : null}
                            </Row>
                            <T variant="tertiary">@{u.handle} · {u.followerCount} followers</T>
                          </View>
                        </Row>
                      </Card>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null}

            {results.communities.length > 0 ? (
              <View className="mt-3">
                <T variant="h3" className="px-4 mb-2">
                  Communities
                </T>
                {results.communities.map((c) => (
                  <Link key={c.slug} href={`/community/${c.slug}`} asChild>
                    <Pressable accessibilityRole="button">
                      <Card className="mx-4 mb-2 p-3.5">
                        <Row className="justify-between">
                          <View className="flex-1 pr-3">
                            <T variant="h3">{c.name}</T>
                            <T variant="tertiary">{c.memberCount} members</T>
                          </View>
                          {c.isPrivate ? <Badge label="PRIVATE" tone="muted" /> : null}
                        </Row>
                      </Card>
                    </Pressable>
                  </Link>
                ))}
              </View>
            ) : null}

            {results.hashtags.length > 0 ? (
              <View className="mt-3">
                <T variant="h3" className="px-4 mb-2">
                  Hashtags
                </T>
                <Row className="flex-wrap px-4">
                  {results.hashtags.map((h) => (
                    <Link key={h.tag} href={`/hashtag/${h.tag}`} asChild>
                      <Pressable accessibilityRole="button">
                        <Chip label={`#${h.tag} · ${h.useCount}`} />
                      </Pressable>
                    </Link>
                  ))}
                </Row>
              </View>
            ) : null}

            {results.posts.length > 0 ? (
              <View className="mt-3">
                <T variant="h3" className="px-4 mb-2">
                  Posts
                </T>
                {results.posts.map((p) => (
                  <PostCard key={p._id} post={p} />
                ))}
              </View>
            ) : null}

            <Button
              variant="ghost"
              label="Back to browse"
              className="mt-4"
              onPress={() => router.push("/explore")}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
