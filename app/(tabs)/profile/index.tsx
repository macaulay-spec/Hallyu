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
  Button,
  Badge,
  Avatar,
  Bar,
  Segmented,
  SectionHeader,
  Rail,
  Divider,
  ShimmerList,
  EmptyState,
} from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { EMPTY_COPY } from "@/lib/copy";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Profile (SCREEN_NAVIGATION_MAP #26, Spec §18). Own-profile variant: stats,
// Currently Watching rail (the spoiler engine's control surface), then
// Posts / Saved / Communities / About tabs. Every tab has its own empty state.

type Tab = "posts" | "saved" | "communities" | "about";

const STATUS_LABEL: Record<string, string> = {
  watching: "Watching",
  planning: "Planning",
  completed: "Completed",
  dropped: "Dropped",
  on_hold: "On hold",
};

const SPOILER_COPY: Record<string, string> = {
  strict: "Strict — every episode-tagged post stays hidden until you reveal it.",
  balanced: "Balanced — hidden only while it's beyond your watch progress.",
  relaxed: "Relaxed — nothing is hidden from you.",
};

export default function Profile() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("posts");

  const me = useQuery(api.users.me, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const watching = useQuery(api.watching.listMine, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const posts = useQuery(
    api.posts.listByAuthor,
    EXPO_PUBLIC_CONVEX_URL && me ? { handle: me.handle, limit: 30 } : "skip"
  );
  const saved = useQuery(api.engagement.listBookmarked, EXPO_PUBLIC_CONVEX_URL ? { limit: 30 } : "skip");
  const communities = useQuery(api.communities.list, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const role = useQuery(api.moderation.myRole, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");

  const myCommunities = (communities ?? []).filter((c) => c.viewerState === "active");

  if (me === null) {
    return (
      <Screen className="px-4 pt-16">
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState copy="You're signed out." cta="Sign in" onCta={() => router.push("/login")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <T variant="h1">Profile</T>
            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
              >
                <T variant="secondary">⚙</T>
              </Pressable>
            </Link>
          </Row>

          {me === undefined ? (
            <ShimmerList rows={2} />
          ) : (
            <>
              <Row className="mt-4 items-start">
                <Avatar name={me.displayName} size={64} />
                <View className="ml-4 flex-1">
                  <Row className="flex-wrap">
                    <T variant="h2">{me.displayName}</T>
                    {me.verified ? <Badge label="VERIFIED" tone="brand" className="ml-2" /> : null}
                    {me.isOfficial ? <Badge label="OFFICIAL" tone="coral" className="ml-2" /> : null}
                    {me.isPrivate ? <Badge label="PRIVATE" tone="muted" className="ml-2" /> : null}
                  </Row>
                  <T variant="tertiary">@{me.handle}</T>
                  <T variant="secondary" className="mt-1">
                    {me.postCount} posts · {me.followerCount} followers · {me.followingCount} following
                  </T>
                </View>
              </Row>

              {me.bio ? (
                <T variant="body" className="mt-3 text-text-secondary">
                  {me.bio}
                </T>
              ) : (
                <T variant="tertiary" className="mt-3">
                  No bio yet.
                </T>
              )}

              {me.interests.length > 0 ? (
                <Row className="mt-3 flex-wrap">
                  {me.interests.slice(0, 6).map((i) => (
                    <Badge key={i} label={i.toUpperCase()} tone="muted" className="mr-2 mb-1" />
                  ))}
                </Row>
              ) : null}

              <Row className="mt-4">
                <Button variant="secondary" label="Edit profile" onPress={() => router.push("/edit-profile")} />
                <Button
                  variant="secondary"
                  label="Settings"
                  className="ml-2"
                  onPress={() => router.push("/settings")}
                />
              </Row>
            </>
          )}
        </View>

        {/* Currently Watching (§9/§13) — the spoiler engine's control surface */}
        <View className="mt-7">
          <SectionHeader
            title="Currently Watching"
            subtitle="Your progress decides what gets hidden"
            action="Manage"
            onAction={() => router.push("/watching")}
          />
          {watching === undefined ? (
            <ShimmerList rows={1} />
          ) : watching.length === 0 ? (
            <Card className="mx-4 p-4">
              <T variant="secondary">{EMPTY_COPY.watching}</T>
            </Card>
          ) : (
            <Rail>
              {watching.map((w) => (
                <Link key={w.dramaSlug} href={`/drama/${w.dramaSlug}`} asChild>
                  <Pressable accessibilityRole="button" className="mr-3 w-52">
                    <Card className="p-3.5">
                      <Row className="justify-between">
                        <Badge label={STATUS_LABEL[w.status] ?? w.status} tone="brand" />
                        <T variant="tertiary">Ep {w.watchedThrough}</T>
                      </Row>
                      <T variant="h3" className="mt-2" numberOfLines={2}>
                        {w.title}
                      </T>
                      <Bar value={w.watchedThrough} max={16} className="mt-2" />
                      <T variant="tertiary" className="mt-1">
                        watched through Ep {w.watchedThrough}
                      </T>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </Rail>
          )}
        </View>

        <View className="px-4 mt-6">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "posts", label: "Posts" },
              { value: "saved", label: "Saved" },
              { value: "communities", label: "Communities" },
              { value: "about", label: "About" },
            ]}
          />
        </View>

        {tab === "posts" ? (
          <View className="mt-4">
            {posts === undefined ? (
              <ShimmerList rows={3} />
            ) : posts.length === 0 ? (
              <EmptyState
                copy="You haven't posted yet."
                cta="Write a post"
                onCta={() => router.push("/create")}
              />
            ) : (
              posts.map((post) => <PostCard key={post._id} post={post as PostCardData} />)
            )}
          </View>
        ) : null}

        {tab === "saved" ? (
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
              saved.map((post) => <PostCard key={post._id} post={post as PostCardData} />)
            )}
          </View>
        ) : null}

        {tab === "communities" ? (
          <View className="mt-4 px-4">
            {communities === undefined ? (
              <ShimmerList rows={3} />
            ) : myCommunities.length === 0 ? (
              <EmptyState
                copy="You haven't joined a community yet."
                cta="Find one"
                onCta={() => router.push("/explore")}
              />
            ) : (
              myCommunities.map((c) => (
                <Card key={c.slug} className="mb-2 p-3.5">
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(`/community/${c.slug}`)}
                  >
                    <Row className="justify-between">
                      <View className="flex-1 pr-3">
                        <T variant="h3">{c.name}</T>
                        <T variant="tertiary">{c.memberCount} members</T>
                      </View>
                      {c.isPrivate ? <Badge label="PRIVATE" tone="muted" /> : null}
                    </Row>
                  </Pressable>
                </Card>
              ))
            )}
          </View>
        ) : null}

        {tab === "about" && me ? (
          <View className="mt-4 px-4">
            <Card className="p-4">
              <T variant="h3">Spoiler protection</T>
              <T variant="secondary" className="mt-1">
                {SPOILER_COPY[me.spoilerPreference] ?? me.spoilerPreference}
              </T>
              <Button
                variant="secondary"
                size="sm"
                label="Change in settings"
                className="mt-3 self-start"
                onPress={() => router.push("/settings")}
              />
            </Card>
            <Card className="mt-3 p-4">
              <T variant="h3">Interests</T>
              <T variant="secondary" className="mt-1">
                {me.interests.length > 0 ? me.interests.join(", ") : "None selected yet."}
              </T>
            </Card>
            <Card className="mt-3 p-4">
              <T variant="h3">Account</T>
              <T variant="secondary" className="mt-1">
                {me.isPrivate ? "Private account" : "Public account"} · onboarding{" "}
                {me.onboardingComplete ? "complete" : "incomplete"}
              </T>
            </Card>
            {role ? (
              <Card className="mt-3 p-4">
                <T variant="h3">Moderation</T>
                <T variant="secondary" className="mt-1">
                  You have the {role === "admin" ? "admin" : "platform moderator"} role.
                </T>
                <Button
                  variant="secondary"
                  size="sm"
                  label="Open moderation queue"
                  className="mt-3 self-start"
                  onPress={() => router.push("/moderation")}
                />
              </Card>
            ) : null}
            <Divider className="mt-4" />
            <T variant="tertiary" className="mt-3">
              Hallyu · where the wave lives. Fictional seed data only; real metadata
              syncs from TMDB when configured.
            </T>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
