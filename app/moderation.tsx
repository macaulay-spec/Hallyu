import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Screen,
  T,
  Row,
  Card,
  Button,
  Badge,
  Divider,
  ShimmerList,
  EmptyState,
} from "@/components/ui";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";

// Moderation queue (SCREEN_NAVIGATION_MAP #32, Spec §27/§37). Permission-gated:
// the server refuses the queue query for non-moderators, so this screen shows an
// honest explanation instead of an empty list that pretends to be a feature.
// Every decision is written to moderationLogs + auditLogs and notifies both the
// reporter and the affected author (who may appeal).

const ACTION_LABEL: Record<string, string> = {
  dismiss: "Dismiss",
  warn: "Warn",
  hide: "Hide",
  remove: "Remove",
  restore: "Restore",
  ban_user: "Ban user",
};

export default function ModerationQueue() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const role = useQuery(api.moderation.myRole, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const bootstrapAvailable = useQuery(
    api.moderation.bootstrapAvailable,
    EXPO_PUBLIC_CONVEX_URL ? {} : "skip"
  );
  const queue = useQuery(
    api.moderation.queue,
    EXPO_PUBLIC_CONVEX_URL && role ? {} : "skip"
  );
  const audit = useQuery(
    api.moderation.auditLog,
    EXPO_PUBLIC_CONVEX_URL && role === "admin" ? { limit: 30 } : "skip"
  );

  const bootstrap = useMutation(api.moderation.bootstrapFirstAdmin);
  const decide = useMutation(api.moderation.decide);
  const decideAppeal = useMutation(api.moderation.decideAppeal);

  async function act(reportId: Id<"reports">, action: string) {
    setBusy(`${reportId}:${action}`);
    setNotice(null);
    try {
      await decide({ reportId, action: action as never, note: note.trim() || undefined });
      setNotice(`Recorded: ${ACTION_LABEL[action] ?? action}. Both parties notified.`);
      setNote("");
    } catch {
      setNotice("That decision failed. Please try again.");
    } finally {
      setBusy(null);
      setTimeout(() => setNotice(null), 3500);
    }
  }

  if (role === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ShimmerList rows={4} />
      </Screen>
    );
  }

  if (role === null) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-4 pt-14">
            <Row className="justify-between">
              <T variant="h1">Moderation</T>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Back"
                className="h-10 w-10 items-center justify-center rounded-full bg-card border border-line"
              >
                <T variant="secondary">‹</T>
              </Pressable>
            </Row>
            <Card className="mt-4 p-4">
              <T variant="h3">Moderators only</T>
              <T variant="secondary" className="mt-1">
                This surface is gated on a platform role, which is separate from
                community moderation and from a verification badge (Spec §26).
              </T>
              {bootstrapAvailable ? (
                <>
                  <T variant="tertiary" className="mt-3">
                    This deployment has no platform roles yet. The first claim creates
                    the initial admin — after that, roles can only be granted by an
                    admin from the audit surface.
                  </T>
                  <Button
                    label="Claim initial admin role"
                    className="mt-4"
                    disabled={busy === "bootstrap"}
                    onPress={async () => {
                      setBusy("bootstrap");
                      try {
                        await bootstrap();
                        setNotice("Admin role created. Reloading the queue…");
                      } catch {
                        setNotice("That role has already been claimed.");
                      } finally {
                        setBusy(null);
                      }
                    }}
                  />
                </>
              ) : (
                <T variant="tertiary" className="mt-3">
                  Ask a platform admin to grant you a role.
                </T>
              )}
              {notice ? (
                <T variant="coral" className="mt-3">
                  {notice}
                </T>
              ) : null}
            </Card>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <View>
              <T variant="h1">Moderation queue</T>
              <T variant="tertiary">
                {role === "admin" ? "Admin" : "Platform moderator"} ·{" "}
                {queue ? `${queue.items.length} open · ${queue.decidedCount} decided` : "loading"}
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

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Decision note (shown to the affected user)"
            placeholderTextColor="#6B6B6B"
            className="mt-3 h-11 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
          />

          {notice ? (
            <Card className="mt-3 p-3">
              <T variant="secondary">{notice}</T>
            </Card>
          ) : null}
        </View>

        {queue === undefined ? (
          <ShimmerList rows={4} />
        ) : queue.items.length === 0 ? (
          <EmptyState copy="Queue is clear." />
        ) : (
          queue.items.map((item) => (
            <Card key={item._id} className="mx-4 mb-3 p-4">
              <Row className="justify-between">
                <Row>
                  <Badge
                    label={(item.severity ?? "low").toUpperCase()}
                    tone={item.severity === "high" ? "danger" : item.severity === "medium" ? "warn" : "muted"}
                  />
                  <Badge label={item.reason.replace(/_/g, " ").toUpperCase()} tone="muted" className="ml-2" />
                  {item.autoAction ? <Badge label="AUTO" tone="coral" className="ml-2" /> : null}
                </Row>
                <T variant="tertiary">{item.answered}</T>
              </Row>

              <T variant="h3" className="mt-2">
                {item.preview.title}
              </T>
              <T variant="secondary" className="mt-1">
                {item.preview.body}
              </T>
              <T variant="tertiary" className="mt-1">
                reported by @{item.reporterHandle} · classifier {item.aiClass}
              </T>
              {item.details ? (
                <T variant="tertiary" className="mt-1">
                  reporter note: {item.details}
                </T>
              ) : null}
              {item.appealStatus ? (
                <Row className="mt-2">
                  <Badge
                    label={`APPEAL ${item.appealStatus.toUpperCase()}`}
                    tone={item.appealStatus === "pending" ? "warn" : "muted"}
                  />
                </Row>
              ) : null}
              {item.appealStatus === "pending" ? (
                <Row className="mt-2">
                  <Button
                    size="sm"
                    label="Uphold decision"
                    onPress={async () => {
                      await decideAppeal({ reportId: item._id, uphold: true, note: note || undefined });
                      setNotice("Appeal upheld.");
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    label="Reverse action"
                    className="ml-2"
                    onPress={async () => {
                      await decideAppeal({ reportId: item._id, uphold: false, note: note || undefined });
                      setNotice("Appeal reversed — content restored.");
                    }}
                  />
                </Row>
              ) : (
                <Row className="mt-3 flex-wrap">
                  {(["dismiss", "warn", "hide", "remove", "restore"] as const).map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant={action === "remove" ? "coral" : action === "dismiss" ? "ghost" : "secondary"}
                      label={ACTION_LABEL[action]!}
                      className="mr-2 mb-2"
                      disabled={busy === `${item._id}:${action}`}
                      onPress={() => act(item._id, action)}
                    />
                  ))}
                </Row>
              )}
            </Card>
          ))
        )}

        {role === "admin" && audit ? (
          <View className="px-4 mt-6">
            <T variant="h2">Audit log</T>
            <T variant="tertiary" className="mb-3">
              Every privileged action, newest first.
            </T>
            {audit.map((row) => (
              <View key={row._id} className="mb-2">
                <Row className="justify-between">
                  <T variant="body">{row.event.replace(/_/g, " ")}</T>
                  <T variant="tertiary">@{row.actorHandle}</T>
                </Row>
                <T variant="tertiary" numberOfLines={2}>
                  {row.context ?? "—"}
                </T>
                <T variant="tertiary">{new Date(row.createdAt).toISOString().slice(0, 16).replace("T", " ")}</T>
                <Divider className="mt-2" />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
