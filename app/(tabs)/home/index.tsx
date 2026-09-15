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
  BrandHero,
  HeroAction,
  DramaCover,
} from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { ReportSheet, ReportTarget } from "@/components/ReportSheet";
import { EMPTY_COPY } from "@/lib/copy";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { TAB_BAR_CLEARANCE } from "@/lib/theme";

// Home (SCREEN_NAVIGATION_MAP #12, Spec §5) — the reference-design screen:
// violet→azure gradient header with the serif wordmark, search + notification
// actions, then the horizontal rail of circular drama covers (Airing Now,
// §5), then the image-first feed. Sticky For You / Following segmented
// control. For You items carry the reason that ranked them (§17) so the feed
// is never opaque. There is no pull-to-refresh by design: Convex queries are
// live subscriptions, so the feed already updates itself (README).
//
// The secondary discovery modules (Episode Activity, Communities for you)
// live on Explore now, where they have room to breathe.

export default function Home() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [report, setReport] = useState<ReportTarget | null>(null);
  const router = useRouter();

  const offline = !EXPO_PUBLIC_CONVEX_URL;
  const live = EXPO_PUBLIC_CONVEX_URL ? {} : "skip";
  const modules = useQuery(api.feeds.homeModules, live);
  const forYou = useQuery(api.feeds.forYou, EXPO_PUBLIC_CONVEX_URL ? { limit: 30 } : "skip");
  const following = useQuery(api.feeds.following, EXPO_PUBLIC_CONVEX_URL ? { limit: 30 } : "skip");
  const unread = useQuery(api.notifications.unreadCount, live);

  const items = (tab === "foryou" ? forYou?.items : following?.items) as PostCardData[] | undefined;

  function reportPost(post: PostCardData) {
    setReport({ targetType: "post", targetId: post._id, label: `post by @${post.author.handle}` });
  }

  const covers = (modules?.airingNow ?? []).slice(0, 10);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
      >
        {/* Gradient hero + cover rail (reference design top block) */}
        <BrandHero
          subtitle={BRAND_SUBTITLE}
          right={
            <>
              <Link href="/search" asChild>
                <HeroAction glyph="⌕" label="Search" />
              </Link>
              <Link href="/notifications" asChild>
                <HeroAction glyph="🔔" label="Notifications" badge={unread ?? 0} />
              </Link>
            </>
          }
        >
          <View className="mt-4 -mx-4">
            {modules === undefined ? (
              <View className="flex-row px-4 pb-2">
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    className="mr-3.5 h-[78px] w-[78px] rounded-full bg-white/10"
                  />
                ))}
              </View>
            ) : covers.length === 0 ? (
              <T className="text-white/70 text-[12px] pb-3">
                Nothing is airing right now — follow dramas in Explore to build this rail.
              </T>
            ) : (
              <Rail>
                {covers.map((d) => (
                  <DramaCover
                    key={d.slug}
                    title={d.title}
                    seed={d.slug}
                    uri={d.posterUrl}
                    following={d.followed}
                    updates={
                      d.nextEpisodeAt
                        ? `Next ${new Date(d.nextEpisodeAt).toISOString().slice(5, 10)}`
                        : d.releaseSchedule ?? "Airing"
                    }
                    onPress={() => router.push(`/drama/${d.slug}`)}
                  />
                ))}
              </Rail>
            )}
          </View>
        </BrandHero>

        {/* Sticky feed switch */}
        <View className="px-4 pt-3">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "foryou", label: "For You" },
              { value: "following", label: "Following" },
            ]}
          />
        </View>

        {offline ? (
          <Card className="mx-4 mt-3 p-4">
            <T variant="coral">Backend not configured</T>
            <T variant="secondary" className="mt-1">
              EXPO_PUBLIC_CONVEX_URL is not set, so there is nothing real to show yet.
              This surface never fills with mock data (Spec §39).
            </T>
          </Card>
        ) : null}

        {tab === "foryou" ? (
          <>
            {/* The feed (§5/§51) */}
            <View className="mt-3">
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

            {/* Drama Updates (§5) — a digest, not a second feed */}
            <View className="mt-6">
              <SectionHeader
                title="Drama Updates"
                subtitle="Latest from the dramas you follow"
              />
              {modules === undefined ? (
                <ShimmerList rows={1} />
              ) : modules.dramaUpdates.length === 0 ? (
                <T variant="tertiary" className="px-4 pb-2">
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

const BRAND_SUBTITLE = "Where the Wave Lives";
