import { useState } from "react";
import { Stack, Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Screen, T, Card, Row, Button, WaveProgress, EmptyState, ArtImage, cn } from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { ErrorState } from "@/components/ui";

const WATCH_STATUSES = [
  { value: "watching", label: "Watching" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
] as const;

// Drama hub (SCREEN_NAVIGATION_MAP #16): hero, follow, watching status +
// watched-through stepper (the spoiler engine's input), cast, episode list
// with per-episode watched marks and the spoiler boundary.
export default function DramaHub() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [tab, setTab] = useState<"episodes" | "posts">("episodes");
  const [actionNote, setActionNote] = useState<string | null>(null);
  // Drama-hub community area filter (§7): Discussions / Theories / Memes / Edits
  // / Official are category views of the same real stream.
  const [category, setCategory] = useState<string | null>(null);

  const drama = useQuery(
    api.dramas.getBySlug,
    EXPO_PUBLIC_CONVEX_URL && slug ? { slug } : "skip"
  );
  const episodeData = useQuery(
    api.episodes.listForDrama,
    EXPO_PUBLIC_CONVEX_URL && drama ? { dramaId: drama._id } : "skip"
  );
  const posts = useQuery(
    api.posts.listByDrama,
    EXPO_PUBLIC_CONVEX_URL && slug
      ? { slug, limit: 30, category: (category ?? undefined) as never }
      : "skip"
  );

  const toggleFollow = useMutation(api.dramas.toggleFollow);
  const muteDrama = useMutation(api.social.mute);
  const setNotificationPref = useMutation(api.notifications.setPreference);
  const setStatus = useMutation(api.watching.setStatus);
  const syncProgress = useMutation(api.watching.syncWatchedEpisodes);

  if (EXPO_PUBLIC_CONVEX_URL && drama === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <WaveProgress className="mt-24" />
      </Screen>
    );
  }

  if (!drama) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState copy="This drama doesn't exist — or hasn't been added yet." />
      </Screen>
    );
  }

  async function onFollow() {
    if (!drama) return;
    try {
      await toggleFollow({ slug: drama.slug });
    } catch {
      // Optimistic-less: live query reflects the true state; errors surface
      // through the mutation rejection and the row simply doesn't change.
    }
  }

  async function onWatchStatus(status: (typeof WATCH_STATUSES)[number]["value"]) {
    if (!drama) return;
    await setStatus({ dramaSlug: drama.slug, status });
  }

  async function onProgress(episode: number) {
    if (!drama) return;
    // Stepper sets the headline number and syncs the per-episode ledger so
    // checkmarks and the spoiler boundary always agree.
    await syncProgress({ dramaSlug: drama.slug, watchedThrough: episode });
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero — full-bleed art with gradient scrim (reference design) */}
        <ArtImage uri={drama.posterUrl} seed={drama.slug} label={drama.title} ratio={16 / 10} scrim>
          <View className="p-4">
            <Row className="flex-wrap">
              {drama.genres.slice(0, 3).map((g: string) => (
                <View
                  key={g}
                  className="rounded-full bg-white/15 border border-white/20 px-2.5 py-0.5 mr-1.5 mb-1.5"
                >
                  <T className="text-white/85 text-[11px]">{g}</T>
                </View>
              ))}
            </Row>
            <T variant="hero" className="text-white">{drama.title}</T>
            {drama.titleKr ? <T className="text-white/70">{drama.titleKr}</T> : null}
            <T className="text-white/70 text-[12px] mt-1.5">
              {[drama.year, drama.network, drama.releaseSchedule].filter(Boolean).join(" · ")}
              {drama.status === "airing" ? " · Airing" : drama.status === "upcoming" ? " · Upcoming" : " · Completed"}
              {" · "}{drama.followerCount} followers · {drama.episodeCount} episodes
            </T>
          </View>
        </ArtImage>

        <View className="px-4 pt-3">
          <Row>
            <Button
              label={drama.viewerFollowing ? "Following ✓" : "Follow"}
              variant={drama.viewerFollowing ? "secondary" : "gradient"}
              size="md"
              className="flex-1"
              onPress={onFollow}
            />
            {drama.nextEpisodeAt ? (
              <T variant="coral" className="ml-3 flex-1">
                Next ep {new Date(drama.nextEpisodeAt).toLocaleDateString()}
              </T>
            ) : null}
          </Row>

          {drama.synopsis ? (
            <T variant="body" className="mt-3 text-text-secondary leading-6">{drama.synopsis}</T>
          ) : null}

          {/* Per-drama controls (§18 mute drama, per-drama notification settings) */}
          <Row className="mt-3 flex-wrap">
            <Button
              label="Mute drama"
              variant="secondary"
              size="sm"
              className="mr-2 mt-2"
              onPress={async () => {
                try {
                  await muteDrama({ targetType: "drama", targetId: drama.slug });
                  setActionNote("Muted — this drama is filtered out of your feeds. Undo in Settings → Privacy.");
                } catch {
                  setActionNote("Couldn't mute that right now.");
                }
              }}
            />
            <Button
              label="Mute episode notices"
              variant="secondary"
              size="sm"
              className="mt-2"
              onPress={async () => {
                try {
                  await setNotificationPref({
                    category: "critical",
                    enabled: false,
                    targetId: drama.slug,
                  });
                  setActionNote("Episode release notifications off for this drama. Re-enable in Settings → Notifications.");
                } catch {
                  setActionNote("Couldn't update that preference right now.");
                }
              }}
            />
          </Row>
          {actionNote ? (
            <T variant="tertiary" className="mt-2">
              {actionNote}
            </T>
          ) : null}
        </View>

        {/* Spoiler boundary banner (§9) */}
        {drama.spoilerBoundary ? (
          <View className="mx-4 mt-4 rounded-[12px] border border-line bg-card p-4">
            <T variant="coral">Spoiler boundary</T>
            <T variant="secondary" className="mt-1">{drama.spoilerBoundary.line}</T>
          </View>
        ) : null}

        {/* Watching status + progress */}
        <View className="mx-4 mt-4">
          <T variant="h3">Your watch status</T>
          <Row className="flex-wrap gap-2 mt-2">
            {WATCH_STATUSES.map((s) => (
              <Pressable
                key={s.value}
                onPress={() => onWatchStatus(s.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5",
                  drama.viewerWatch?.status === s.value ? "border-brand bg-brand" : "border-line bg-card"
                )}
              >
                <T variant="tertiary" className={drama.viewerWatch?.status === s.value ? "text-white" : ""}>
                  {s.label}
                </T>
              </Pressable>
            ))}
          </Row>

          {drama.viewerWatch && drama.viewerWatch.status !== "planning" ? (
            <View className="mt-3">
              <T variant="secondary">
                Watched through Ep {drama.viewerWatch.watchedThrough}
                {episodeData ? ` of ${episodeData.episodes.length}` : ""}
              </T>
              <Row className="flex-wrap gap-1.5 mt-2">
                {(episodeData?.episodes ?? []).slice(0, 20).map((e: { number: number; viewerWatched: boolean }) => (
                  <Pressable
                    key={e.number}
                    onPress={() => onProgress(e.number)}
                    className={cn(
                      "h-8 w-8 rounded-[8px] items-center justify-center border",
                      e.viewerWatched ? "bg-brand border-brand" : "bg-card border-line"
                    )}
                  >
                    <T variant="tertiary" className={e.viewerWatched ? "text-white" : ""}>{e.number}</T>
                  </Pressable>
                ))}
              </Row>
              <T variant="tertiary" className="mt-1.5">
                Tap your latest watched episode — this drives what spoilers you see.
              </T>
            </View>
          ) : null}
        </View>

        {/* Tabs: episodes / posts */}
        <Row className="mx-4 mt-6 gap-2">
          <Pressable
            onPress={() => setTab("episodes")}
            className={cn("rounded-full px-4 py-2", tab === "episodes" ? "bg-brand" : "bg-card border border-line")}
          >
            <T variant="body" className={cn("text-[13px]", tab === "episodes" ? "text-white" : "text-text-secondary")}>
              Episodes
            </T>
          </Pressable>
          <Pressable
            onPress={() => setTab("posts")}
            className={cn("rounded-full px-4 py-2", tab === "posts" ? "bg-brand" : "bg-card border border-line")}
          >
            <T variant="body" className={cn("text-[13px]", tab === "posts" ? "text-white" : "text-text-secondary")}>
              Posts
            </T>
          </Pressable>
        </Row>

        {tab === "posts" ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 flex-grow-0">
            <Row className="px-4">
              {[
                { value: null, label: "All" },
                { value: "reaction", label: "Reactions" },
                { value: "discussion", label: "Discussions" },
                { value: "theory", label: "Theories" },
                { value: "meme", label: "Memes" },
                { value: "fan_content", label: "Fan edits" },
                { value: "news", label: "Official news" },
              ].map((c) => (
                <Pressable
                  key={c.label}
                  onPress={() => setCategory(c.value)}
                  className={cn(
                    "mr-2 rounded-full px-3.5 py-1.5 " +
                      (category === c.value ? "bg-brand" : "bg-card border border-line")
                  )}
                >
                  <T
                    variant="tertiary"
                    className={category === c.value ? "text-white" : ""}
                  >
                    {c.label}
                  </T>
                </Pressable>
              ))}
            </Row>
          </ScrollView>
        ) : null}

        {tab === "episodes" ? (
          <View className="mt-3">
            {(episodeData?.episodes ?? []).map((e) => (
              <Link key={e._id} href={`/episode/${e._id}`} asChild>
                <Pressable className="mx-4 mb-2 rounded-[12px] bg-card border border-line p-4">
                  <Row className="justify-between">
                    <Row>
                      <T variant={e.viewerWatched ? "brand" : "h3"}>
                        {e.viewerWatched ? "✓ " : ""}Ep {e.number}
                      </T>
                      {e.title ? <T variant="secondary" className="ml-2">{e.title}</T> : null}
                    </Row>
                    <T variant="tertiary">Discuss ›</T>
                  </Row>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : (
          <View className="mt-3">
            {posts === undefined ? (
              <WaveProgress className="mt-6" />
            ) : posts.length === 0 ? (
              <EmptyState copy="No posts about this drama yet." />
            ) : (
              (posts as PostCardData[]).map((p) => <PostCard key={p._id} post={p} />)
            )}
          </View>
        )}

        {/* Cast */}
        <View className="mt-6">
          <T variant="h3" className="px-4 mb-3">Cast</T>
          {drama.cast.length === 0 ? (
            <T variant="tertiary" className="px-4">No cast listed yet.</T>
          ) : (
            <Row className="flex-wrap px-4 gap-2">
              {drama.cast.map((c) => (
                <Link key={c.actorId} href={`/actor/${c.slug}`} asChild>
                  <Pressable className="rounded-[12px] bg-card border border-line px-3 py-2">
                    <T variant="body">{c.name}</T>
                    {c.characterName ? <T variant="tertiary">as {c.characterName}</T> : null}
                  </Pressable>
                </Link>
              ))}
            </Row>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
