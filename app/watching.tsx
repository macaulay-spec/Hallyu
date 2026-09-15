import { useState } from "react";
import { Stack, Link, useRouter } from "expo-router";
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
  Bar,
  Chip,
  ShimmerList,
  EmptyState,
} from "@/components/ui";
import { EXPO_PUBLIC_CONVEX_URL } from "@/lib/brand";
import { EMPTY_COPY } from "@/lib/copy";

// Currently Watching (SCREEN_NAVIGATION_MAP #27, Spec §13/§9). This is the
// control panel for the spoiler engine: "watched through Ep X" is what decides
// whether episode-tagged posts are stripped before they reach you. Progress is
// clamped to the real episode count and synced to the per-episode ledger
// server-side, so the boundary can never claim more than the drama has.

const STATUSES = [
  { value: "watching", label: "Watching" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
] as const;

export default function Watching() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useQuery(api.watching.listMine, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const setStatus = useMutation(api.watching.setStatus);
  const syncEpisodes = useMutation(api.watching.syncWatchedEpisodes);

  async function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  }

  async function changeProgress(slug: string, next: number, max: number, status: string) {
    const clamped = Math.max(0, Math.min(max, next));
    setBusy(`${slug}:progress`);
    try {
      await syncEpisodes({ dramaSlug: slug, watchedThrough: clamped });
      flash(`Progress saved: watched through Ep ${clamped}. Guarded posts update live.`);
    } catch {
      flash("Couldn't save progress. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function changeStatus(slug: string, status: string, watchedThrough: number) {
    setBusy(`${slug}:${status}`);
    try {
      await setStatus({ dramaSlug: slug, status: status as never, watchedThrough });
      flash(`Marked as ${status.replace("_", " ")}.`);
    } catch {
      flash("Couldn't update that status.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <View className="flex-1 pr-3">
              <T variant="h1">Currently Watching</T>
              <T variant="tertiary">
                Your progress here decides which posts are hidden from you.
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
          {notice ? (
            <Card className="mt-3 p-3">
              <T variant="secondary">{notice}</T>
            </Card>
          ) : null}
        </View>

        {rows === undefined ? (
          <ShimmerList rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState
            copy={EMPTY_COPY.watching}
            cta="Explore dramas"
            onCta={() => router.push("/explore")}
          />
        ) : (
          rows.map((row) => {
            const max = Math.max(row.episodeCount, row.watchedThrough, 1);
            const atEnd = row.latestEpisode > 0 && row.watchedThrough >= row.latestEpisode;
            return (
              <Card key={row.dramaSlug} className="mx-4 mb-3 p-4">
                <Row className="justify-between">
                  <Link href={`/drama/${row.dramaSlug}`} asChild>
                    <Pressable accessibilityRole="button" className="flex-1 pr-3">
                      <T variant="h3">{row.title}</T>
                      <T variant="tertiary">
                        {row.titleKr ? `${row.titleKr} · ` : ""}
                        {row.episodeCount > 0
                          ? `${row.episodeCount} episodes in the graph`
                          : "No episode list yet"}
                      </T>
                    </Pressable>
                  </Link>
                  <Badge label={row.status.replace("_", " ").toUpperCase()} tone="brand" />
                </Row>

                <Row className="mt-3 justify-between">
                  <T variant="secondary">Watched through Ep {row.watchedThrough}</T>
                  {atEnd ? <Badge label="CAUGHT UP" tone="success" /> : null}
                </Row>
                <Bar value={row.watchedThrough} max={max} className="mt-2" />

                <Row className="mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    label="− 1"
                    disabled={busy === `${row.dramaSlug}:progress` || row.watchedThrough <= 0}
                    onPress={() =>
                      changeProgress(row.dramaSlug, row.watchedThrough - 1, max, row.status)
                    }
                  />
                  <Button
                    size="sm"
                    label="+ 1"
                    className="ml-2"
                    disabled={busy === `${row.dramaSlug}:progress`}
                    onPress={() =>
                      changeProgress(row.dramaSlug, row.watchedThrough + 1, max, row.status)
                    }
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    label="+ 5"
                    className="ml-2"
                    disabled={busy === `${row.dramaSlug}:progress`}
                    onPress={() =>
                      changeProgress(row.dramaSlug, row.watchedThrough + 5, max, row.status)
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    label="Back to 0"
                    className="ml-2"
                    disabled={busy === `${row.dramaSlug}:progress` || row.watchedThrough === 0}
                    onPress={() => changeProgress(row.dramaSlug, 0, max, row.status)}
                  />
                </Row>

                <Row className="mt-3 flex-wrap">
                  {STATUSES.map((s) => (
                    <Chip
                      key={s.value}
                      label={s.label}
                      active={row.status === s.value}
                      onPress={() =>
                        changeStatus(row.dramaSlug, s.value, row.watchedThrough)
                      }
                    />
                  ))}
                </Row>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
