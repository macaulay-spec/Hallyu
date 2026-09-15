import { useState } from "react";
import { Stack, Link, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Screen,
  T,
  Row,
  Card,
  Segmented,
  SectionHeader,
  Rail,
  Badge,
  ShimmerList,
  EmptyState,
} from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { ReportSheet, ReportTarget } from "@/components/ReportSheet";
import { EMPTY_COPY } from "@/lib/copy";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Home (SCREEN_NAVIGATION_MAP #12, Spec §5). Sticky For You / Following
// segmented control, then the top modules: Airing Now, Episode Activity,
// Communities for you, Drama Updates — all computed from real rows. For You
// items carry the reason that ranked them (§17) so the feed is never opaque.
// There is no pull-to-refresh by design: Convex queries are live subscriptions,
// so the feed already updates itself (documented in the README).

export default function Home() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [report, setReport] = useState<ReportTarget | null>(null);
  const router = useRouter();

  const offline = !EXPO_PUBLIC_CONVEX_URL;
  const modules = useQuery(api.feeds.homeModules, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const forYou = useQuery(api.feeds.forYou, EXPO_PUBLIC_CONVEX_URL ? { limit: 30 } : "skip");
  const following = useQuery(api.feeds.following, EXPO_PUBLIC_CONVEX_URL ? { limit: 30 } : "skip");

  const items = (tab === "foryou" ? forYou?.items : following?.items) as PostCardData[] | undefined;

  function reportPost(post: PostCardData) {
    setReport({ targetType: "post", targetId: post._id, label: `post by @${post.author.handle}` });
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14 pb-3">
          <Row className="justify-between">
            <View>
              <T variant="h1">Hallyu</T>
              <T variant="tertiary">Where the Wave Lives</T>
            </View>
            <Link href="/search" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search"
                className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
              >
                <T variant="secondary">⌕</T>
              </Pressable>
            </Link>
          </Row>
          <Segmented
            className="mt-4"
            value={tab}
            onChange={setTab}
            options={[
              { value: "foryou", label: "For You" },
              { value: "following", label: "Following" },
            ]}
          />
        </View>

        {offline ? (
          <Card className="mx-4 mb-3 p-4">
            <T variant="coral">Backend not configured</T>
            <T variant="secondary" className="mt-1">
              EXPO_PUBLIC_CONVEX_URL is not set, so there is nothing real to show yet.
              This surface never fills with mock data (Spec §39).
            </T>
          </Card>
        ) : null}

        {tab === "foryou" ? (
          <>
            {/* Airing Now (§5) */}
            <View className="mt-3">
              <SectionHeader title="Airing Now" subtitle="New episodes on the schedule" />
              {modules === undefined ? (
                <ShimmerList rows={1} />
              ) : modules.airingNow.length === 0 ? (
                <T variant="tertiary" className="px-4">
                  Nothing is airing right now.
                </T>
              ) : (
                <Rail>
                  {modules.airingNow.map((d) => (
                    <Link key={d.slug} href={`/drama/${d.slug}`} asChild>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${d.title}, episode ${d.nextEpisodeAt ? "scheduled" : "airing"}`}
                        className="mr-3 w-40"
                      >
                        <Card className="p-3">
                          <Row className="justify-between">
                            <Badge label={d.followed ? "FOLLOWING" : "AIRING"} tone={d.followed ? "brand" : "success"} />
                          </Row>
                          <T variant="h3" className="mt-2" numberOfLines={2}>
                            {d.title}
                          </T>
                          {d.titleKr ? <T variant="tertiary">{d.titleKr}</T> : null}
                          <T variant="coral" className="mt-1.5">
                            {d.releaseSchedule ?? "Schedule TBA"}
                          </T>
                          {d.nextEpisodeAt ? (
                            <T variant="tertiary">
                              Next: {new Date(d.nextEpisodeAt).toISOString().slice(0, 10)}
                            </T>
                          ) : null}
                        </Card>
                      </Pressable>
                    </Link>
                  ))}
                </Rail>
              )}
            </View>

            {/* Episode Activity (§8) */}
            <View className="mt-6">
              <SectionHeader title="Episode Activity" subtitle="Live conversations this week" />
              {modules === undefined ? (
                <ShimmerList rows={1} />
              ) : modules.episodeActivity.length === 0 ? (
                <T variant="tertiary" className="px-4">
                  No episode conversations yet — open a drama and start one.
                </T>
              ) : (
                <View className="px-4">
                  {modules.episodeActivity.map((e) => {
                    const ahead = e.viewerWatchedThrough != null && e.number > e.viewerWatchedThrough;
                    return (
                      <Link key={e.episodeId} href={`/episode/${e.episodeId}`} asChild>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${e.dramaTitle} episode ${e.number}, ${e.postCount} posts`}
                        >
                          <Card className="mb-2 p-3.5">
                            <Row className="justify-between">
                              <View className="flex-1 pr-3">
                                <T variant="h3">
                                  {e.dramaTitle} · Ep {e.number}
                                </T>
                                <T variant="tertiary">
                                  {e.title ? `${e.title} · ` : ""}
                                  {e.postCount} {e.postCount === 1 ? "post" : "posts"}
                                  {e.airAt ? ` · aired ${new Date(e.airAt).toISOString().slice(5, 10)}` : ""}
                                </T>
                              </View>
                              {ahead ? <Badge label="BEYOND YOU" tone="warn" /> : <T variant="tertiary">›</T>}
                            </Row>
                          </Card>
                        </Pressable>
                      </Link>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Communities for you (§5/§14) */}
            <View className="mt-6">
              <SectionHeader title="Communities for you" subtitle="Based on what's active" />
              {modules === undefined ? (
                <ShimmerList rows={1} />
              ) : modules.communitiesForYou.length === 0 ? (
                <T variant="tertiary" className="px-4">
                  You've joined every community we know about.
                </T>
              ) : (
                <Rail>
                  {modules.communitiesForYou.map((c) => (
                    <Link key={c.slug} href={`/community/${c.slug}`} asChild>
                      <Pressable accessibilityRole="button" className="mr-3 w-56">
                        <Card className="p-3.5">
                          <Row className="justify-between">
                            <T variant="h3">{c.name}</T>
                            {c.isPrivate ? <Badge label="PRIVATE" tone="muted" /> : null}
                          </Row>
                          <T variant="tertiary" numberOfLines={2} className="mt-1">
                            {c.description ?? "No description yet."}
                          </T>
                          <T variant="secondary" className="mt-2">
                            {c.memberCount} members
                          </T>
                        </Card>
                      </Pressable>
                    </Link>
                  ))}
                </Rail>
              )}
            </View>

            {/* Drama Updates (§5) */}
            <View className="mt-6">
              <SectionHeader title="Drama Updates" subtitle="Latest from the dramas you follow" />
              {modules === undefined ? (
                <ShimmerList rows={1} />
              ) : modules.dramaUpdates.length === 0 ? (
                <T variant="tertiary" className="px-4">
                  No drama activity yet.
                </T>
              ) : (
                <View className="px-4">
                  {modules.dramaUpdates.map((u) => (
                    <Link key={u.dramaSlug} href={`/drama/${u.dramaSlug}`} asChild>
                      <Pressable accessibilityRole="button">
                        <Card className="mb-2 p-3.5">
                          <Row className="justify-between">
                            <View className="flex-1 pr-3">
                              <T variant="h3">{u.dramaTitle}</T>
                              <T variant="tertiary" numberOfLines={2}>
                                {u.post.body ? u.post.body : u.post.author.displayName + " posted (guarded)"}
                              </T>
                            </View>
                            {u.followed ? <Badge label="FOLLOWING" tone="brand" /> : null}
                          </Row>
                        </Card>
                      </Pressable>
                    </Link>
                  ))}
                </View>
              )}
            </View>

            <View className="mt-8">
              <SectionHeader
                title="Your feed"
                subtitle={
                  forYou?.personalized
                    ? "Ranked by your follows, watch progress and interests"
                    : "Sign in to personalize this"
                }
              />
              {items === undefined ? (
                <ShimmerList rows={3} />
              ) : items.length === 0 ? (
                <EmptyState
                  copy={EMPTY_COPY.feed}
                  cta="Find dramas"
                  onCta={() => router.push("/explore")}
                />
              ) : (
                items.map((post) => (
                  <PostCard key={post._id} post={post} showReason onReport={reportPost} />
                ))
              )}
            </View>
          </>
        ) : (
          <View className="mt-3">
            {items === undefined ? (
              <ShimmerList rows={3} />
            ) : items.length === 0 ? (
              <EmptyState
                copy="Your fandom is quiet here. Follow a few dramas or communities to get things moving."
                cta="Explore"
                onCta={() => router.push("/explore")}
              />
            ) : (
              items.map((post) => (
                <PostCard key={post._id} post={post} showReason onReport={reportPost} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ReportSheet target={report} onClose={() => setReport(null)} />
    </Screen>
  );
}
