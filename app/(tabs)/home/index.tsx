import { useState } from "react";
import { Stack, Link, useRouter, useFocusEffect } from "expo-router";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useCallback } from "react";
import { Screen, T, Card, WaveProgress, ShimmerList, Button, Row } from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EMPTY_COPY } from "@/lib/copy";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Home (SCREEN_NAVIGATION_MAP #12): For You / Following segmented control.
// For You currently serves the recent stream (labeled honestly); M4 replaces
// it with explainable ranking. Following is the real social-graph feed.
export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const [refreshing, setRefreshing] = useState(false);

  const forYou = useQuery(
    api.posts.listRecent,
    EXPO_PUBLIC_CONVEX_URL ? {} : "skip"
  );
  const following = useQuery(
    api.posts.listFollowing,
    EXPO_PUBLIC_CONVEX_URL ? {} : "skip"
  );

  const posts = (tab === "forYou" ? forYou : following) as PostCardData[] | undefined;
  const loading = posts === undefined;

  useFocusEffect(
    useCallback(() => {
      // Convex live queries keep this fresh automatically; focus hook exists
      // for future analytics events (§33).
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    // Live queries propagate changes; brief hold keeps the pull gesture honest.
    await new Promise((r) => setTimeout(r, 350));
    setRefreshing(false);
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="px-4 pt-3">
        <Row className="justify-between">
          <T variant="h2">Home</T>
          <Link href="/(tabs)/create" asChild>
            <Pressable className="rounded-[12px] bg-brand px-4 py-2">
              <T variant="body" className="text-white text-[13px] font-semibold">+ Post</T>
            </Pressable>
          </Link>
        </Row>
        <Row className="mt-3 gap-2">
          <Pressable
            onPress={() => setTab("forYou")}
            className={`rounded-full px-4 py-2 ${tab === "forYou" ? "bg-brand" : "bg-card border border-line"}`}
          >
            <T variant="body" className={`text-[13px] ${tab === "forYou" ? "text-white" : "text-text-secondary"}`}>
              For You
            </T>
          </Pressable>
          <Pressable
            onPress={() => setTab("following")}
            className={`rounded-full px-4 py-2 ${tab === "following" ? "bg-brand" : "bg-card border border-line"}`}
          >
            <T variant="body" className={`text-[13px] ${tab === "following" ? "text-white" : "text-text-secondary"}`}>
              Following
            </T>
          </Pressable>
        </Row>
        {tab === "forYou" ? (
          <T variant="tertiary" className="mt-2">
            Recent posts across Hallyu — personalized ranking arrives in M4.
          </T>
        ) : null}
      </View>

      <ScrollView
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7B4FD8"
            progressBackgroundColor="#1A1A1A"
          />
        }
      >
        {loading ? (
          <ShimmerList rows={5} />
        ) : posts && posts.length > 0 ? (
          posts.map((p) => <PostCard key={p._id} post={p} />)
        ) : tab === "following" ? (
          <>
            <T variant="secondary" className="px-8 text-center mt-6">
              {EMPTY_COPY.feed}
            </T>
            <Link href="/(tabs)/explore" asChild>
              <Button label="Explore dramas" variant="secondary" className="mx-6 mt-4" />
            </Link>
          </>
        ) : (
          <Card className="mx-4 p-4 items-center">
            <WaveProgress />
            <T variant="tertiary" className="mt-2 text-center">
              Nothing here yet — be the first to post.
            </T>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}
