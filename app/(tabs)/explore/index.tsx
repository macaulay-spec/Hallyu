import { useState } from "react";
import { Stack, Link } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
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
  Rail,
  SectionHeader,
  ShimmerList,
} from "@/components/ui";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Explore (SCREEN_NAVIGATION_MAP #13, Spec §6/§51). Every rail reads real rows:
// trending comes from the 15-minute trendScores sweep (and says so honestly
// before its first run), popularity is ordered by actual follower counts, and
// topics are ordered by real hashtag usage.

export default function Explore() {
  const [genre, setGenre] = useState<string | null>(null);
  const live = EXPO_PUBLIC_CONVEX_URL ? {} : "skip";

  const genres = useQuery(api.search.genres, live);
  const trending = useQuery(api.trending.list, EXPO_PUBLIC_CONVEX_URL ? { limit: 10 } : "skip");
  const airing = useQuery(api.dramas.listAiring, live);
  const newEpisodes = useQuery(api.feeds.newEpisodes, EXPO_PUBLIC_CONVEX_URL ? { limit: 8 } : "skip");
  const popular = useQuery(
    api.discovery.popularDramas,
    EXPO_PUBLIC_CONVEX_URL ? { limit: 10, genre: genre ?? undefined } : "skip"
  );
  const actors = useQuery(api.discovery.popularActors, EXPO_PUBLIC_CONVEX_URL ? { limit: 12 } : "skip");
  const communities = useQuery(api.communities.list, live);
  const official = useQuery(api.discovery.officialAccounts, EXPO_PUBLIC_CONVEX_URL ? { limit: 8 } : "skip");
  const topics = useQuery(api.discovery.topics, EXPO_PUBLIC_CONVEX_URL ? { limit: 12 } : "skip");

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14">
          <T variant="h1">Explore</T>
          <Link href="/search" asChild>
            <Pressable
              accessibilityRole="search"
              accessibilityLabel="Search dramas, actors, communities"
              className="mt-3 h-11 justify-center rounded-[12px] bg-card border border-line px-4"
            >
              <T variant="tertiary">Search dramas, actors, communities…</T>
            </Pressable>
          </Link>
        </View>

        {/* Genre chips filter the Popular rail (§6/§51 genre browsing) */}
        {genres && genres.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 flex-grow-0">
            <Row className="px-4">
              <Chip label="All genres" active={genre === null} onPress={() => setGenre(null)} />
              {genres.slice(0, 12).map((g) => (
                <Chip
                  key={g.genre}
                  label={`${g.genre} ${g.count}`}
                  active={genre === g.genre}
                  onPress={() => setGenre(g.genre === genre ? null : g.genre)}
                />
              ))}
            </Row>
          </ScrollView>
        ) : null}

        {/* Trending Now (§6) */}
        <View className="mt-4">
          <SectionHeader
            title="Trending Now"
            subtitle={
              trending?.computedAt
                ? `Recomputed ${new Date(trending.computedAt).toISOString().slice(11, 16)} UTC · velocity + participants`
                : "The trend sweep runs every 15 minutes"
            }
          />
          {trending === undefined ? (
            <ShimmerList rows={1} />
          ) : trending.dramas.length === 0 && trending.hashtags.length === 0 ? (
            <T variant="tertiary" className="px-4">
              No trend data yet — the sweep has not produced scores for this window.
              It never shows invented numbers.
            </T>
          ) : (
            <>
              {trending.dramas.length > 0 ? (
                <Rail>
                  {trending.dramas.map((d, i) => (
                    <Link key={d.slug} href={`/drama/${d.slug}`} asChild>
                      <Pressable accessibilityRole="button" className="mr-3 w-44">
                        <Card className="p-3.5">
                          <Row className="justify-between">
                            <Badge label={`#${i + 1}`} tone="brand" />
                            <T variant="tertiary">{Math.round(d.score)}</T>
                          </Row>
                          <T variant="h3" className="mt-2" numberOfLines={2}>
                            {d.title}
                          </T>
                          <T variant="tertiary" numberOfLines={1}>
                            {d.genres.join(" · ")}
                          </T>
                        </Card>
                      </Pressable>
                    </Link>
                  ))}
                </Rail>
              ) : null}
              {trending.hashtags.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 flex-grow-0">
                  <Row className="px-4">
                    {trending.hashtags.map((h) => (
                      <Link key={h.tag} href={`/hashtag/${h.tag}`} asChild>
                        <Pressable accessibilityRole="button">
                          <Card className="mr-2 px-3 py-1.5">
                            <T variant="secondary">#{h.tag}</T>
                          </Card>
                        </Pressable>
                      </Link>
                    ))}
                  </Row>
                </ScrollView>
              ) : null}
            </>
          )}
        </View>

        {/* New Episodes (§6/§51) */}
        <View className="mt-6">
          <SectionHeader title="New Episodes" subtitle="Just aired, with live discussions" />
          {newEpisodes === undefined ? (
            <ShimmerList rows={1} />
          ) : newEpisodes.length === 0 ? (
            <T variant="tertiary" className="px-4">
              Nothing has aired recently.
            </T>
          ) : (
            <View className="px-4">
              {newEpisodes.map((e) => (
                <Link key={e.episodeId} href={`/episode/${e.episodeId}`} asChild>
                  <Pressable accessibilityRole="button">
                    <Card className="mb-2 p-3.5">
                      <Row className="justify-between">
                        <View className="flex-1 pr-2">
                          <T variant="h3">
                            {e.dramaTitle} · Ep {e.number}
                          </T>
                          <T variant="tertiary">
                            {e.title ? `${e.title} · ` : ""}
                            {e.airAt ? new Date(e.airAt).toISOString().slice(0, 10) : "date TBA"}
                          </T>
                        </View>
                        <Badge label="DISCUSSION" tone="success" />
                      </Row>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        {/* Popular Dramas (§6) */}
        <View className="mt-6">
          <SectionHeader
            title={genre ? `Popular in ${genre}` : "Popular Dramas"}
            subtitle="Ordered by followers"
          />
          {popular === undefined ? (
            <ShimmerList rows={2} />
          ) : popular.length === 0 ? (
            <T variant="tertiary" className="px-4">
              Nothing in this genre yet.
            </T>
          ) : (
            <View className="px-4">
              {popular.map((d) => (
                <Link key={d.slug} href={`/drama/${d.slug}`} asChild>
                  <Pressable accessibilityRole="button">
                    <Card className="mb-2 p-3.5">
                      <Row className="justify-between">
                        <View className="flex-1 pr-3">
                          <T variant="h3">{d.title}</T>
                          <T variant="tertiary">
                            {[d.genres.join(" · "), d.network, d.year].filter(Boolean).join(" — ")}
                          </T>
                        </View>
                        <View className="items-end">
                          <Badge
                            label={d.status.toUpperCase()}
                            tone={d.status === "airing" ? "success" : d.status === "upcoming" ? "warn" : "muted"}
                          />
                          <T variant="tertiary" className="mt-1">
                            {d.followerCount} followers
                          </T>
                        </View>
                      </Row>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        {/* Actors (§6) */}
        <View className="mt-6">
          <SectionHeader title="Actors" subtitle="Most followed in the fandom" />
          {actors === undefined ? (
            <ShimmerList rows={1} />
          ) : actors.length === 0 ? (
            <T variant="tertiary" className="px-4">
              No actor profiles yet.
            </T>
          ) : (
            <Rail>
              {actors.map((a) => (
                <Link key={a.slug} href={`/actor/${a.slug}`} asChild>
                  <Pressable accessibilityRole="button" className="mr-3 w-32 items-center">
                    <Card className="p-3.5 items-center w-32">
                      <Avatar name={a.name} size={52} />
                      <T variant="h3" className="mt-2 text-center" numberOfLines={2}>
                        {a.name}
                      </T>
                      <T variant="tertiary">{a.followerCount} followers</T>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </Rail>
          )}
        </View>

        {/* Communities (§6/§14) */}
        <View className="mt-6">
          <SectionHeader title="Communities" subtitle="Where the discussion lives" />
          {communities === undefined ? (
            <ShimmerList rows={2} />
          ) : communities.length === 0 ? (
            <T variant="tertiary" className="px-4">
              No communities yet.
            </T>
          ) : (
            <View className="px-4">
              {communities.slice(0, 8).map((c) => (
                <Link key={c.slug} href={`/community/${c.slug}`} asChild>
                  <Pressable accessibilityRole="button">
                    <Card className="mb-2 p-3.5">
                      <Row className="justify-between">
                        <View className="flex-1 pr-3">
                          <T variant="h3">{c.name}</T>
                          <T variant="tertiary" numberOfLines={1}>
                            {c.memberCount} members
                            {c.viewerState === "active" ? " · joined" : c.viewerState === "pending" ? " · request pending" : ""}
                          </T>
                        </View>
                        {c.isPrivate ? <Badge label="PRIVATE" tone="muted" /> : null}
                      </Row>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        {/* Official accounts (§6/§15) */}
        {official && official.length > 0 ? (
          <View className="mt-6">
            <SectionHeader title="Official Accounts" subtitle="Broadcasters, studios and publications" />
            <Rail>
              {official.map((o) => (
                <Link key={o.handle} href={`/user/${o.handle}`} asChild>
                  <Pressable accessibilityRole="button" className="mr-3 w-48">
                    <Card className="p-3.5">
                      <Row className="justify-between">
                        <Avatar name={o.displayName} size={32} />
                        <Badge label="OFFICIAL" tone="coral" />
                      </Row>
                      <T variant="h3" className="mt-2" numberOfLines={1}>
                        {o.displayName}
                      </T>
                      <T variant="tertiary" numberOfLines={1}>
                        {o.orgName} · {o.kind}
                      </T>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </Rail>
          </View>
        ) : null}

        {/* Topics (§6) */}
        {topics && topics.length > 0 ? (
          <View className="mt-6">
            <SectionHeader title="Topics" subtitle="Ranked by real usage" />
            <View className="flex-row flex-wrap px-4">
              {topics.map((t) => (
                <Link key={t.tag} href={`/hashtag/${t.tag}`} asChild>
                  <Pressable accessibilityRole="button">
                    <Chip label={`#${t.tag} · ${t.useCount}`} />
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
