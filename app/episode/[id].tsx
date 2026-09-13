import { useState } from "react";
import { Stack, Link, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Screen, T, Card, Row, Button, WaveProgress, EmptyState } from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Episode page (SCREEN_NAVIGATION_MAP #17): the first-class episode
// discussion (Spec §8). Shows the spoiler boundary banner with the viewer's
// own progress, the watched toggle (which can advance watchedThrough), and
// the episode-scoped discussion stream with per-user spoiler decisions
// applied server-side.
export default function EpisodePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(false);

  const episode = useQuery(
    api.episodes.getWithDiscussion,
    EXPO_PUBLIC_CONVEX_URL && id ? { episodeId: id as never } : "skip"
  );
  const discussion = useQuery(
    api.dramas.listDiscussion,
    EXPO_PUBLIC_CONVEX_URL && id ? { episodeId: id as never } : "skip"
  );
  const toggleWatched = useMutation(api.episodes.toggleWatched);

  if (EXPO_PUBLIC_CONVEX_URL && episode === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <WaveProgress className="mt-24" />
      </Screen>
    );
  }

  if (!episode) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState copy="This episode doesn't exist." />
      </Screen>
    );
  }

  async function onToggleWatched() {
    setBusy(true);
    try {
      await toggleWatched({ episodeId: id as never });
    } finally {
      setBusy(false);
    }
  }

  const watched = episode.viewerWatchedThisEpisode;
  const progress = episode.viewerWatchedThrough;
  const beyondProgress =
    progress != null && episode.number > progress;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-[#150A20] px-6 pt-16 pb-6">
          <Link href={`/drama/${episode.drama.slug}`} asChild>
            <Pressable>
              <T variant="brand">← {episode.drama.title}</T>
            </Pressable>
          </Link>
          <T variant="h1" className="mt-2">
            Episode {episode.number}
          </T>
          {episode.title ? <T variant="h3" className="mt-1">{episode.title}</T> : null}
          <T variant="secondary" className="mt-2">
            {[
              episode.airAt ? new Date(episode.airAt).toLocaleDateString() : null,
              episode.runtimeMinutes ? `${episode.runtimeMinutes} min` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Airing details to come"}
          </T>
        </View>

        {/* Watched toggle + your progress */}
        <Card className="mx-4 mt-4 p-4">
          <Row className="justify-between">
            <View className="flex-1">
              <T variant="h3">{watched ? "Watched ✓" : "Mark as watched"}</T>
              <T variant="tertiary" className="mt-0.5">
                {progress != null
                  ? `You've watched through Ep ${progress} of this drama`
                  : "No progress recorded for this drama yet"}
              </T>
            </View>
            <Button
              label={busy ? "Saving…" : watched ? "Unmark" : "Watched"}
              variant={watched ? "secondary" : "primary"}
              size="sm"
              disabled={busy}
              onPress={onToggleWatched}
            />
          </Row>
        </Card>

        {/* Spoiler boundary banner — verbatim §9 presentation */}
        {beyondProgress ? (
          <View className="mx-4 mt-3 rounded-[12px] border border-line bg-card p-4">
            <T variant="coral">Spoiler boundary</T>
            <T variant="secondary" className="mt-1">
              Beyond here: Ep {episode.number} — you've watched through Ep {progress}
            </T>
            <T variant="tertiary" className="mt-1">
              Posts in this discussion are guarded until you catch up. Reveals
              are your choice — and they're logged.
            </T>
          </View>
        ) : null}

        {/* Discussion stream */}
        <View className="mt-6">
          <Row className="px-4 justify-between">
            <T variant="h3">Discussion</T>
            {episode.discussion ? (
              <T variant="tertiary">{episode.discussion.postCount} posts</T>
            ) : null}
          </Row>
          {discussion === undefined ? (
            <WaveProgress className="mt-6" />
          ) : discussion.length === 0 ? (
            <EmptyState copy="No posts in this episode's discussion yet — be the first reaction." />
          ) : (
            (discussion as PostCardData[]).map((p) => <PostCard key={p._id} post={p} />)
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
