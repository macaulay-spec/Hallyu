import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Screen, T, Row, ShimmerList, EmptyState } from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { ReportSheet, ReportTarget } from "@/components/ReportSheet";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { EMPTY_COPY } from "@/lib/copy";

// Saved posts (SCREEN_NAVIGATION_MAP #28). Bookmarks are read back through the
// same spoiler-guarded assembly as every other stream.
export default function Saved() {
  const router = useRouter();
  const [report, setReport] = useState<ReportTarget | null>(null);
  const saved = useQuery(api.engagement.listBookmarked, EXPO_PUBLIC_CONVEX_URL ? { limit: 40 } : "skip");

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <View>
              <T variant="h1">Saved</T>
              <T variant="tertiary">
                {saved === undefined ? "Loading…" : `${saved.length} saved`}
              </T>
            </View>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
            >
              <T variant="secondary">‹</T>
            </Pressable>
          </Row>
        </View>

        <View className="mt-4">
          {saved === undefined ? (
            <ShimmerList rows={3} />
          ) : saved.length === 0 ? (
            <EmptyState
              copy={EMPTY_COPY.saved}
              cta="Explore dramas"
              onCta={() => router.push("/explore")}
            />
          ) : (
            saved.map((post) => (
              <PostCard
                key={post._id}
                post={post as PostCardData}
                onReport={(p) =>
                  setReport({ targetType: "post", targetId: p._id, label: `post by @${p.author.handle}` })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
      <ReportSheet target={report} onClose={() => setReport(null)} />
    </Screen>
  );
}
