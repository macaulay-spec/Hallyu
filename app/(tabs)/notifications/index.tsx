import { Stack, Link, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Screen,
  T,
  Row,
  Card,
  Badge,
  Button,
  Divider,
  ShimmerList,
  EmptyState,
} from "@/components/ui";
import { EMPTY_COPY } from "@/lib/copy";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Notifications (SCREEN_NAVIGATION_MAP #25, Spec §18). Grouped Critical /
// Important / Optional with real unread state, a quiet-hours indicator, and a
// deep link on every row — the payload route is resolved by Expo Router, so a
// tap lands on the actual object.

const GROUP_META = {
  critical: { title: "Critical", hint: "Episode releases, replies, mentions" },
  important: { title: "Important", hint: "Community announcements, official updates" },
  optional: { title: "Optional", hint: "Trending, recommendations, milestones" },
} as const;

const TYPE_ICON: Record<string, string> = {
  episode_release: "📺",
  comment_reply: "💬",
  post_reply: "💬",
  mention: "@",
  community_member_joined: "✦",
  community_request_approved: "✓",
  community_request_declined: "✕",
  moderation_action: "⚑",
  moderation_outcome: "⚑",
  report_outcome: "⚑",
  appeal_outcome: "⚖",
};

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Notifications() {
  const router = useRouter();
  const inbox = useQuery(api.notifications.list, EXPO_PUBLIC_CONVEX_URL ? { limit: 80 } : "skip");
  const quiet = useQuery(api.notifications.quietNow, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  function open(route: string | null, id: Id<"notifications">) {
    markRead({ notificationId: id }).catch(() => {});
    if (route) router.push(route as never);
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <View>
              <T variant="h1">Notifications</T>
              {inbox && inbox.total > 0 ? (
                <T variant="tertiary">
                  {inbox.unread} unread of {inbox.total}
                </T>
              ) : null}
            </View>
            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notification settings"
                className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
              >
                <T variant="secondary">⚙</T>
              </Pressable>
            </Link>
          </Row>

          {quiet ? (
            <Card className="mt-3 p-3">
              <T variant="secondary">
                🌙 Quiet hours are active — nothing is being pushed right now. Your
                inbox still collects everything.
              </T>
            </Card>
          ) : null}

          {inbox && inbox.unread > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              label="Mark all as read"
              className="mt-3 self-start"
              onPress={() => markAllRead().catch(() => {})}
            />
          ) : null}
        </View>

        {inbox === undefined ? (
          <ShimmerList rows={4} />
        ) : inbox.total === 0 ? (
          <EmptyState copy={EMPTY_COPY.notifications} />
        ) : (
          (["critical", "important", "optional"] as const).map((group) =>
            inbox[group].length === 0 ? null : (
              <View key={group} className="mt-6">
                <View className="px-4 mb-2">
                  <Row className="justify-between">
                    <T variant="h3">{GROUP_META[group].title}</T>
                    <T variant="tertiary">{GROUP_META[group].hint}</T>
                  </Row>
                </View>
                {inbox[group].map((n) => (
                  <Pressable
                    key={n._id}
                    accessibilityRole="button"
                    onPress={() => open(n.route, n._id)}
                  >
                    <Card className="mx-4 mb-2 p-3.5">
                      <Row>
                        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-card-elevated">
                          <T variant="secondary">{TYPE_ICON[n.type] ?? "•"}</T>
                        </View>
                        <View className="flex-1 pr-2">
                          <Row>
                            {!n.read ? (
                              <View className="mr-2 h-2 w-2 rounded-full bg-brand" />
                            ) : null}
                            <T variant="body">{n.text ?? n.type.replace(/_/g, " ")}</T>
                          </Row>
                          <T variant="tertiary">
                            {timeAgo(n.createdAt)}
                            {n.quiet ? " · queued during quiet hours" : ""}
                          </T>
                        </View>
                        {n.read ? null : <Badge label="NEW" tone="brand" />}
                      </Row>
                    </Card>
                  </Pressable>
                ))}
                <Divider className="mx-4 mt-2" />
              </View>
            )
          )
        )}
      </ScrollView>
    </Screen>
  );
}
