import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
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
  Segmented,
  ListRow,
  ShimmerList,
  EmptyState,
  BrandBanner,
} from "@/components/ui";
import { PostCard, PostCardData } from "@/components/PostCard";
import { ReportSheet, ReportTarget } from "@/components/ReportSheet";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { EMPTY_COPY } from "@/lib/copy";

// Community page (SCREEN_NAVIGATION_MAP #19, Spec §14). Public communities join
// instantly, private ones post a request a moderator approves. Moderator tabs
// and actions only render for real moderators — the server enforces the same
// gate, so hiding the UI is convenience, not security.

type Tab = "feed" | "members" | "rules";

export default function CommunityPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("feed");
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const communitySlug = slug ?? "";
  const live = EXPO_PUBLIC_CONVEX_URL ? { slug: communitySlug } : "skip";
  const community = useQuery(api.communities.getBySlug, live);
  const feed = useQuery(api.communities.feed, EXPO_PUBLIC_CONVEX_URL ? { slug: communitySlug } : "skip");
  const members = useQuery(api.communities.members, EXPO_PUBLIC_CONVEX_URL ? { slug: communitySlug } : "skip");
  const requests = useQuery(
    api.communities.pendingMembers,
    EXPO_PUBLIC_CONVEX_URL && community?.isModerator ? { slug: communitySlug } : "skip"
  );

  const join = useMutation(api.communities.join);
  const leave = useMutation(api.communities.leave);
  const decideRequest = useMutation(api.communities.decideRequest);
  const moderatePost = useMutation(api.communities.moderatePost);

  async function run(label: string, fn: () => Promise<unknown>, success: string) {
    setPendingAction(label);
    setNotice(null);
    try {
      await fn();
      setNotice(success);
    } catch (e) {
      const code = e instanceof Error ? e.message : "UNKNOWN";
      setNotice(
        code.includes("RATE")
          ? "Slow down a moment — too many requests."
          : code.includes("FORBIDDEN")
            ? "You don't have permission for that."
            : "That action failed. Please try again."
      );
    } finally {
      setPendingAction(null);
      setTimeout(() => setNotice(null), 3500);
    }
  }

  if (community === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ShimmerList rows={4} />
      </Screen>
    );
  }

  if (community === null) {
    return (
      <Screen className="px-4 pt-16">
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState copy="This community no longer exists." cta="Back" onCta={() => router.back()} />
      </Screen>
    );
  }

  const joined = community.viewerState === "active";
  const requested = community.viewerState === "pending";

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View>
          <BrandBanner height={120} />
          <View className="absolute left-0 right-0 top-12 px-4">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="h-9 w-9 items-center justify-center rounded-full bg-black/50"
            >
              <T variant="secondary">‹</T>
            </Pressable>
          </View>
        </View>

        <View className="-mt-8 px-4">
          <Avatar name={community.name} size={64} />
          <Row className="mt-3 justify-between items-start">
            <View className="flex-1 pr-3">
              <Row className="flex-wrap">
                <T variant="h1">{community.name}</T>
                {community.isPrivate ? <Badge label="PRIVATE" tone="muted" className="ml-2" /> : null}
                {community.isModerator ? (
                  <Badge label={community.viewerRole === "owner" ? "OWNER" : "MODERATOR"} tone="brand" className="ml-2" />
                ) : null}
              </Row>
              <T variant="tertiary">
                {community.memberCount} members · since{" "}
                {new Date(community.createdAt).toISOString().slice(0, 10)}
              </T>
            </View>
          </Row>

          {community.description ? (
            <T variant="body" className="mt-3 text-text-secondary">
              {community.description}
            </T>
          ) : null}

          <View className="mt-4">
            {joined ? (
              <Row>
                <Button
                  variant="secondary"
                  label={pendingAction === "leave" ? "Leaving…" : "Leave"}
                  disabled={pendingAction === "leave"}
                  onPress={() => run("leave", () => leave({ slug: communitySlug }), "You left the community.")}
                />
              </Row>
            ) : requested ? (
              <Button variant="secondary" label="Request pending" disabled onPress={() => {}} />
            ) : (
              <Button
                label={community.isPrivate ? "Request to join" : "Join"}
                disabled={pendingAction === "join"}
                onPress={() =>
                  run(
                    "join",
                    () => join({ slug: communitySlug }),
                    community.isPrivate
                      ? "Request sent — a moderator will review it."
                      : "Joined."
                  )
                }
              />
            )}
          </View>

          {notice ? (
            <Card className="mt-3 p-3">
              <T variant="secondary">{notice}</T>
            </Card>
          ) : null}
        </View>

        <View className="px-4 mt-5">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "feed", label: "Feed" },
              { value: "members", label: "Members" },
              { value: "rules", label: "Rules" },
            ]}
          />
        </View>

        {tab === "feed" ? (
          <View className="mt-4">
            {feed === undefined ? (
              <ShimmerList rows={3} />
            ) : !feed.canRead ? (
              <Card className="mx-4 p-5">
                <T variant="h3">This community is private</T>
                <T variant="secondary" className="mt-1">
                  Request to join and a moderator will review it. Content stays hidden
                  until you're an active member.
                </T>
              </Card>
            ) : feed.items.length === 0 ? (
              <EmptyState
                copy="No posts in here yet — start the conversation."
                cta={joined ? "Write a post" : undefined}
                onCta={joined ? () => router.push("/create") : undefined}
              />
            ) : (
              <>
                {community.isModerator ? (
                  <Card className="mx-4 mb-3 p-3.5">
                    <T variant="brand">Moderator tools</T>
                    <T variant="tertiary" className="mt-1">
                      Pin, lock, hide or remove posts below. Every action is logged and
                      the author is notified.
                    </T>
                    {requests && requests.length > 0 ? (
                      <View className="mt-3">
                        <T variant="h3" className="mb-2">
                          Join requests ({requests.length})
                        </T>
                        {requests.map((r) => (
                          <Row key={r._id} className="justify-between mb-2">
                            <View className="flex-1 pr-2">
                              <T variant="body">{r.displayName}</T>
                              <T variant="tertiary">@{r.handle}</T>
                            </View>
                            <Row>
                              <Button
                                size="sm"
                                label="Approve"
                                disabled={pendingAction === r._id}
                                onPress={() =>
                                  run(
                                    r._id,
                                    () =>
                                      decideRequest({
                                        slug: communitySlug,
                                        profileId: r.profileId,
                                        approve: true,
                                      }),
                                    `Approved @${r.handle}.`
                                  )
                                }
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                label="Decline"
                                className="ml-2"
                                disabled={pendingAction === r._id}
                                onPress={() =>
                                  run(
                                    r._id,
                                    () =>
                                      decideRequest({
                                        slug: communitySlug,
                                        profileId: r.profileId,
                                        approve: false,
                                      }),
                                    `Declined @${r.handle}.`
                                  )
                                }
                              />
                            </Row>
                          </Row>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                ) : null}

                {feed.items.map((item) => (
                  <View key={item._id}>
                    <PostCard
                      post={item as PostCardData}
                      onReport={(post) =>
                        setReport({
                          targetType: "post",
                          targetId: post._id,
                          label: `post by @${post.author.handle}`,
                        })
                      }
                    />
                    {community.isModerator ? (
                      <Row className="mx-4 mb-3 flex-wrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          label={item.pinned ? "Unpin" : "Pin"}
                          className="mr-2"
                          onPress={() =>
                            run(
                              `${item._id}:pin`,
                              () =>
                                moderatePost({
                                  postId: item._id,
                                  action: item.pinned ? "unpin" : "pin",
                                }),
                              item.pinned ? "Unpinned." : "Pinned to the top."
                            )
                          }
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          label={item.locked ? "Unlock" : "Lock"}
                          className="mr-2"
                          onPress={() =>
                            run(
                              `${item._id}:lock`,
                              () =>
                                moderatePost({
                                  postId: item._id,
                                  action: item.locked ? "unlock" : "lock",
                                }),
                              item.locked ? "Unlocked." : "Locked — new comments are refused."
                            )
                          }
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          label="Hide"
                          className="mr-2"
                          onPress={() =>
                            run(
                              `${item._id}:hide`,
                              () => moderatePost({ postId: item._id, action: "hide" }),
                              "Hidden. The author was notified and can appeal."
                            )
                          }
                        />
                        <Button
                          size="sm"
                          variant="coral"
                          label="Remove"
                          onPress={() =>
                            run(
                              `${item._id}:remove`,
                              () => moderatePost({ postId: item._id, action: "remove" }),
                              "Removed. The author was notified and can appeal."
                            )
                          }
                        />
                      </Row>
                    ) : null}
                  </View>
                ))}
              </>
            )}
          </View>
        ) : null}

        {tab === "members" ? (
          <View className="mt-3">
            {members === undefined ? (
              <ShimmerList rows={4} />
            ) : members.length === 0 ? (
              <T variant="tertiary" className="px-4">
                No members to show.
              </T>
            ) : (
              members.map((m) => (
                <ListRow
                  key={m.handle}
                  title={m.displayName + (m.verified ? " ✓" : "")}
                  subtitle={`@${m.handle}${m.role !== "member" ? ` · ${m.role}` : ""}`}
                  onPress={() => router.push(`/user/${m.handle}`)}
                />
              ))
            )}
          </View>
        ) : null}

        {tab === "rules" ? (
          <View className="px-4 mt-4">
            {community.rules.length === 0 ? (
              <Card className="p-4">
                <T variant="h3">No rules published yet</T>
                <T variant="secondary" className="mt-1">
                  {community.isModerator
                    ? "Moderators can add up to 15 rules from the settings surface."
                    : "Moderators haven't published rules for this community."}
                </T>
              </Card>
            ) : (
              community.rules.map((rule, i) => (
                <Card key={rule + i} className="mb-2 p-3.5">
                  <Row className="items-start">
                    <T variant="brand" className="mr-3">
                      {i + 1}
                    </T>
                    <T variant="body" className="flex-1 text-text-secondary">
                      {rule}
                    </T>
                  </Row>
                </Card>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <ReportSheet target={report} onClose={() => setReport(null)} />
    </Screen>
  );
}
