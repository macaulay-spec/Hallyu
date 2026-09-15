import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Screen, T, Row, Button, Avatar, Badge, ShimmerList, EmptyState, Divider } from "@/components/ui";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Followers / Following (SCREEN_NAVIGATION_MAP #29). Lists come from the real
// follows edges; follow toggles here are the same mutation the profile uses.
export default function Follows() {
  const params = useLocalSearchParams<{ handle?: string; kind?: string }>();
  const router = useRouter();
  const kind = params.kind === "following" ? "following" : "followers";
  const handle = (params.handle ?? "").toLowerCase();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const followers = useQuery(
    api.social.listFollowers,
    EXPO_PUBLIC_CONVEX_URL && kind === "followers" && handle ? { handle } : "skip"
  );
  const following = useQuery(
    api.social.listFollowingUsers,
    EXPO_PUBLIC_CONVEX_URL && kind === "following" && handle ? { handle } : "skip"
  );
  const toggleFollow = useMutation(api.social.toggleUserFollow);
  const list = (kind === "followers" ? followers : following) ?? undefined;

  async function follow(target: string) {
    setBusy(target);
    try {
      const res = await toggleFollow({ handle: target });
      setNotice(res.following ? `Following @${target}.` : `Unfollowed @${target}.`);
    } catch {
      setNotice("Couldn't update that follow right now.");
    } finally {
      setBusy(null);
      setTimeout(() => setNotice(null), 2500);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <View>
              <T variant="h1">{kind === "followers" ? "Followers" : "Following"}</T>
              <T variant="tertiary">
                @{handle} · {list === undefined ? "loading" : list.length}
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
          {notice ? <T variant="coral" className="mt-2">{notice}</T> : null}
          <Divider className="mt-4" />
        </View>

        <View className="mt-2">
          {list === undefined ? (
            <ShimmerList rows={4} />
          ) : list.length === 0 ? (
            <EmptyState
              copy={
                kind === "followers"
                  ? "No followers yet — posting in a drama hub is the fastest way to find your people."
                  : "You aren't following anyone yet."
              }
              cta="Explore"
              onCta={() => router.push("/explore")}
            />
          ) : (
            list.map((u) => (
              <View key={u.handle} className="flex-row items-center px-4 py-3">
                <Pressable
                  accessibilityRole="button"
                  className="flex-row items-center flex-1"
                  onPress={() => router.push(`/user/${u.handle}`)}
                >
                  <Avatar name={u.displayName} size={40} />
                  <View className="ml-3 flex-1">
                    <Row>
                      <T variant="h3">{u.displayName}</T>
                      {u.verified ? <Badge label="VERIFIED" tone="brand" className="ml-2" /> : null}
                    </Row>
                    <T variant="tertiary">@{u.handle}</T>
                  </View>
                </Pressable>
                {u.handle === handle ? null : (
                  <Button
                    size="sm"
                    variant="secondary"
                    label="Follow"
                    disabled={busy === u.handle}
                    onPress={() => follow(u.handle)}
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
