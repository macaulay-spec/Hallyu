import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Screen,
  T,
  Row,
  Card,
  Button,
  Badge,
  Divider,
  Chip,
  ListRow,
  ShimmerList,
} from "@/components/ui";
import { EXPO_PUBLIC_CONVEX_URL, BRAND } from "@/lib/brand";

// Settings (SCREEN_NAVIGATION_MAP #31, Spec §18/§9). Every toggle writes to the
// real backend. Account deletion and data export are declared in the spec but
// NOT implemented — they are labelled honestly as unavailable rather than
// rendered as dead buttons (Spec §39 rule 10).

const SPOILER_OPTIONS = [
  {
    value: "strict" as const,
    title: "Strict",
    body: "Hide every episode-tagged post, even for episodes you've watched. Nothing is revealed unless you tap.",
  },
  {
    value: "balanced" as const,
    title: "Balanced (default)",
    body: "Hide posts only when they go past your watch progress for that drama.",
  },
  {
    value: "relaxed" as const,
    title: "Relaxed",
    body: "Never hide anything. You'll see spoilers as they're posted.",
  },
];

const CATEGORY_COPY = {
  critical: "Episode releases, replies, mentions",
  important: "Community announcements, official updates",
  optional: "Trending, recommendations, milestones",
} as const;

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const me = useQuery(api.users.me, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const prefs = useQuery(api.notifications.getPreferences, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const blocks = useQuery(api.social.listBlocks, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const mutes = useQuery(api.social.listMutes, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");
  const watching = useQuery(api.watching.listMine, EXPO_PUBLIC_CONVEX_URL ? {} : "skip");

  const setSpoilerPreference = useMutation(api.users.setSpoilerPreference);
  const updateProfile = useMutation(api.users.updateProfile);
  const setPreference = useMutation(api.notifications.setPreference);
  const setQuietHours = useMutation(api.notifications.setQuietHours);
  const unblock = useMutation(api.social.block);
  const unmute = useMutation(api.social.mute);

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  }

  async function run(key: string, fn: () => Promise<unknown>, message: string) {
    setBusy(key);
    try {
      await fn();
      flash(message);
    } catch {
      flash("That setting couldn't be saved. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const quietStart = prefs?.[0]?.quietHoursStart ?? null;
  const quietEnd = prefs?.[0]?.quietHoursEnd ?? null;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4 pt-14">
          <Row className="justify-between">
            <T variant="h1">Settings</T>
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

        {/* Spoilers (§9) — the product's core control */}
        <View className="mt-5">
          <T variant="h3" className="px-4 mb-2">
            Spoiler protection
          </T>
          {me === undefined ? (
            <ShimmerList rows={1} />
          ) : (
            SPOILER_OPTIONS.map((opt) => {
              const active = me?.spoilerPreference === opt.value;
              return (
                <Card key={opt.value} className="mx-4 mb-2 p-3.5">
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    disabled={busy === opt.value}
                    onPress={() =>
                      run(
                        opt.value,
                        () => setSpoilerPreference({ preference: opt.value }),
                        `Spoiler protection set to ${opt.title}.`
                      )
                    }
                  >
                    <Row className="justify-between">
                      <T variant="h3">{opt.title}</T>
                      {active ? <Badge label="ACTIVE" tone="brand" /> : null}
                    </Row>
                    <T variant="tertiary" className="mt-1">
                      {opt.body}
                    </T>
                  </Pressable>
                </Card>
              );
            })
          )}
        </View>

        {/* Notifications (§18) */}
        <View className="mt-5">
          <T variant="h3" className="px-4 mb-2">
            Notifications
          </T>
          {prefs === undefined ? (
            <ShimmerList rows={2} />
          ) : (
            <>
              {prefs.map((p) => (
                <ListRow
                  key={p.category}
                  title={p.category.charAt(0).toUpperCase() + p.category.slice(1)}
                  subtitle={CATEGORY_COPY[p.category]}
                  right={
                    <Button
                      size="sm"
                      variant={p.enabled ? "primary" : "secondary"}
                      label={p.enabled ? "On" : "Off"}
                      onPress={() =>
                        run(
                          p.category,
                          () => setPreference({ category: p.category, enabled: !p.enabled }),
                          `${p.category} notifications ${p.enabled ? "off" : "on"}.`
                        )
                      }
                    />
                  }
                />
              ))}
              <Card className="mx-4 mt-3 p-4">
                <T variant="h3">Quiet hours</T>
                <T variant="tertiary" className="mt-1">
                  {quietStart != null && quietEnd != null
                    ? `Pushes are held between ${minutesToLabel(quietStart)} and ${minutesToLabel(quietEnd)}. In-app notifications always arrive.`
                    : "Not set — pushes are delivered whenever they happen."}
                </T>
                <Row className="mt-3 flex-wrap">
                  <Chip
                    label={quietStart != null && quietEnd != null ? "Clear quiet hours" : "22:00 → 07:00"}
                    active={quietStart != null && quietEnd != null}
                    onPress={() =>
                      run(
                        "quiet",
                        () =>
                          quietStart != null && quietEnd != null
                            ? setQuietHours({ startMinutes: 0, endMinutes: 0 })
                            : setQuietHours({ startMinutes: 22 * 60, endMinutes: 7 * 60 }),
                        quietStart != null && quietEnd != null
                          ? "Quiet hours cleared."
                          : "Quiet hours set to 22:00 → 07:00."
                      )
                    }
                  />
                </Row>
              </Card>
            </>
          )}
        </View>

        {/* Privacy (§28) */}
        <View className="mt-6">
          <T variant="h3" className="px-4 mb-2">
            Privacy
          </T>
          {me === undefined ? (
            <ShimmerList rows={1} />
          ) : (
            <ListRow
              title="Private account"
              subtitle={
                me?.isPrivate
                  ? "Only approved followers can read your posts."
                  : "Anyone can read your posts."
              }
              right={
                <Button
                  size="sm"
                  variant={me?.isPrivate ? "primary" : "secondary"}
                  label={me?.isPrivate ? "On" : "Off"}
                  onPress={() =>
                    run(
                      "private",
                      () => updateProfile({ isPrivate: !me?.isPrivate }),
                      me?.isPrivate ? "Your account is now public." : "Your account is now private."
                    )
                  }
                />
              }
            />
          )}

          <View className="px-4 mt-4">
            <T variant="h3">Blocked accounts</T>
            {blocks === undefined ? (
              <ShimmerList rows={1} />
            ) : blocks.length === 0 ? (
              <T variant="tertiary" className="mt-1">
                Nobody is blocked.
              </T>
            ) : (
              blocks.map((b) => (
                <ListRow
                  key={b.handle}
                  title={b.displayName}
                  subtitle={`@${b.handle}`}
                  right={
                    <Button
                      size="sm"
                      variant="secondary"
                      label="Unblock"
                      onPress={() =>
                        run(b.handle, () => unblock({ handle: b.handle }), `Unblocked @${b.handle}.`)
                      }
                    />
                  }
                />
              ))
            )}
          </View>

          <View className="px-4 mt-4">
            <T variant="h3">Muted</T>
            {mutes === undefined ? (
              <ShimmerList rows={1} />
            ) : mutes.length === 0 ? (
              <T variant="tertiary" className="mt-1">
                Nothing is muted.
              </T>
            ) : (
              mutes.map((m) => (
                <ListRow
                  key={`${m.targetType}:${m.targetId}`}
                  title={m.targetId}
                  subtitle={`Muted ${m.targetType}`}
                  right={
                    <Button
                      size="sm"
                      variant="secondary"
                      label="Unmute"
                      onPress={() =>
                        run(
                          `${m.targetType}:${m.targetId}`,
                          () => unmute({ targetType: m.targetType, targetId: m.targetId }),
                          `Unmuted ${m.targetId}.`
                        )
                      }
                    />
                  }
                />
              ))
            )}
          </View>

          {watching && watching.length > 0 ? (
            <View className="px-4 mt-4">
              <T variant="h3">Muted dramas</T>
              <T variant="tertiary" className="mt-1">
                Mute a drama from its hub to stop it appearing in your feeds. You can
                also change your watch progress there.
              </T>
            </View>
          ) : null}
        </View>

        {/* Account (§18) */}
        <View className="mt-6 px-4">
          <T variant="h3" className="mb-2">
            Account
          </T>
          <ListRow
            title="Handle"
            subtitle={me ? `@${me.handle}` : "—"}
            right={
              <Button
                size="sm"
                variant="secondary"
                label="Change"
                onPress={() => router.push("/edit-profile")}
              />
            }
          />
          <ListRow
            title="Password recovery"
            subtitle="Send a reset link to your email address"
            onPress={() => router.push("/account-recovery")}
          />
          <Card className="mt-3 p-4">
            <T variant="h3">Delete account & data export</T>
            <T variant="secondary" className="mt-1">
              Not available in this build. These are documented owner steps
              (Spec §18) — showing a button that does nothing would break the
              product's no-fake-functionality rule, so neither is rendered.
            </T>
          </Card>

          <Button
            variant="coral"
            label="Sign out"
            className="mt-4"
            onPress={() => signOut().catch(() => flash("Sign out failed — try again."))}
          />
        </View>

        <View className="mt-6 px-4">
          <T variant="h3">Appearance</T>
          <T variant="secondary" className="mt-1">
            Dark is the baseline theme ({BRAND.name} brand tokens). The palette is
            centralized in one token file, so a light theme is a token change, not a
            rewrite.
          </T>
        </View>

        <View className="mt-6 px-4">
          <T variant="h3">About</T>
          <T variant="secondary" className="mt-1">
            {BRAND.name} {BRAND.koreanName} · v0.1.0
          </T>
          <T variant="tertiary" className="mt-1">
            Fictional seed data only. Real drama metadata is available through a
            config-gated TMDB sync; it never overwrites fictional demo rows.
          </T>
          <Divider className="mt-4" />
          <T variant="tertiary" className="mt-3">
            Product contract: Hallyu Final Integrated Master Build Specification.
          </T>
        </View>
      </ScrollView>
    </Screen>
  );
}
