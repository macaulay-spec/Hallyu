import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Screen,
  T,
  Row,
  Card,
  Button,
  Badge,
  Avatar,
  Divider,
  ShimmerList,
  EmptyState,
} from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { ReportSheet, ReportTarget } from "@/components/ReportSheet";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// User profile (SCREEN_NAVIGATION_MAP #26 other-user variant, Spec §18).
// Private accounts show an honest locked notice instead of posts — the client
// mirrors the server-side rule rather than teasing content it cannot read.

export default function UserPage() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const userHandle = (handle ?? "").toLowerCase();
  const profile = useQuery(api.users.getByHandle, EXPO_PUBLIC_CONVEX_URL ? { handle: userHandle } : "skip");
  const relationship = useQuery(
    api.social.relationship,
    EXPO_PUBLIC_CONVEX_URL && userHandle ? { handle: userHandle } : "skip"
  );
  const postsCanRead =
    profile != null && (!profile.isPrivate || relationship?.following || relationship?.isSelf);
  const posts = useQuery(
    api.posts.listByAuthor,
    EXPO_PUBLIC_CONVEX_URL && postsCanRead ? { handle: userHandle, limit: 30 } : "skip"
  );

  const toggleFollow = useMutation(api.social.toggleUserFollow);
  const block = useMutation(api.social.block);
  const mute = useMutation(api.social.mute);

  async function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  }

  if (profile === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ShimmerList rows={4} />
      </Screen>
    );
  }

  if (profile === null) {
    return (
      <Screen className="px-4 pt-16">
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState copy="We couldn't find that account." cta="Back" onCta={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
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
            <Pressable
              onPress={() => setMenu(true)}
              accessibilityRole="button"
              accessibilityLabel="Account options"
              className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
            >
              <T variant="secondary">⋯</T>
            </Pressable>
          </Row>

          <Row className="mt-4 items-start">
            <Avatar name={profile.displayName} size={64} />
            <View className="ml-4 flex-1">
              <Row className="flex-wrap">
                <T variant="h1">{profile.displayName}</T>
                {profile.verified ? <Badge label="VERIFIED" tone="brand" className="ml-2" /> : null}
                {profile.isOfficial ? <Badge label="OFFICIAL" tone="coral" className="ml-2" /> : null}
                {profile.isPrivate ? <Badge label="PRIVATE" tone="muted" className="ml-2" /> : null}
              </Row>
              <T variant="tertiary">@{profile.handle}</T>
            </View>
          </Row>

          {profile.bio ? (
            <T variant="body" className="mt-3 text-text-secondary">
              {profile.bio}
            </T>
          ) : null}

          <Row className="mt-3">
            <T variant="secondary">{profile.postCount} posts</T>
            <Pressable
              className="ml-4"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/follows", params: { handle: profile.handle, kind: "followers" } })}
            >
              <T variant="secondary">{profile.followerCount} followers</T>
            </Pressable>
            <Pressable
              className="ml-4"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/follows", params: { handle: profile.handle, kind: "following" } })}
            >
              <T variant="secondary">{profile.followingCount} following</T>
            </Pressable>
          </Row>

          {relationship?.isSelf ? (
            <Button
              variant="secondary"
              label="Edit profile"
              className="mt-4"
              onPress={() => router.push("/edit-profile")}
            />
          ) : (
            <Row className="mt-4">
              <Button
                label={relationship?.following ? "Following" : "Follow"}
                variant={relationship?.following ? "secondary" : "primary"}
                disabled={busy}
                onPress={async () => {
                  setBusy(true);
                  try {
                    const res = await toggleFollow({ handle: profile.handle });
                    flash(res.following ? `Following @${profile.handle}.` : `Unfollowed @${profile.handle}.`);
                  } catch {
                    flash("Couldn't update that follow right now.");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
              <Button
                variant="secondary"
                label="Report"
                className="ml-2"
                onPress={() =>
                  setReport({
                    targetType: "user",
                    targetId: profile._id,
                    label: `@${profile.handle}`,
                  })
                }
              />
            </Row>
          )}

          {notice ? (
            <Card className="mt-3 p-3">
              <T variant="secondary">{notice}</T>
            </Card>
          ) : null}
        </View>

        <Divider className="mt-5" />

        <View className="mt-4">
          {!postsCanRead ? (
            <Card className="mx-4 p-5">
              <T variant="h3">This account is private</T>
              <T variant="secondary" className="mt-1">
                Follow @{profile.handle} to see their posts. Private accounts gate
                content at read time, so nothing is downloaded and hidden.
              </T>
            </Card>
          ) : posts === undefined ? (
            <ShimmerList rows={3} />
          ) : posts.length === 0 ? (
            <EmptyState copy="No posts yet." />
          ) : (
            posts.map((post) => (
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

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setMenu(false)} />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-[20px] border border-line bg-surface p-4 pb-8">
          <T variant="h3">Account options</T>
          <Button
            variant="secondary"
            label="Report account"
            className="mt-4"
            onPress={() => {
              setMenu(false);
              setReport({ targetType: "user", targetId: profile._id, label: `@${profile.handle}` });
            }}
          />
          {relationship?.isSelf ? null : (
            <>
              <Button
                variant="secondary"
                label={`Mute @${profile.handle}`}
                className="mt-2"
                onPress={async () => {
                  setMenu(false);
                  await mute({ targetType: "user", targetId: profile.handle });
                  flash("Muted — their posts are filtered out of your feeds.");
                }}
              />
              <Button
                variant="secondary"
                label={`Block @${profile.handle}`}
                className="mt-2"
                onPress={async () => {
                  setMenu(false);
                  await block({ handle: profile.handle });
                  flash("Blocked — their posts are hidden from you.");
                }}
              />
            </>
          )}
          <Button variant="ghost" label="Cancel" className="mt-3" onPress={() => setMenu(false)} />
        </View>
      </Modal>

      <ReportSheet target={report} onClose={() => setReport(null)} />
    </Screen>
  );
}
