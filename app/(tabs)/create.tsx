import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Screen, T, Button, Row, cn } from "@/components/ui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const CATEGORIES = [
  "reaction", "discussion", "theory", "recommendation",
  "meme", "news", "question", "fan_content",
] as const;

const SPOILER_LEVELS = [
  { value: "none", label: "No spoiler" },
  { value: "episode", label: "Episode spoilers" },
  { value: "explicit", label: "Major spoilers" },
] as const;

const MAX = 5000; // Spec §10

// Composer (SCREEN_NAVIGATION_MAP #24): fast post flow — write, tag drama,
// spoiler status, hashtags, publish. Media attach lands with the storage
// pipeline; the button below only appears when it actually works (§39).
export default function Create() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("reaction");
  const [spoilerLevel, setSpoilerLevel] = useState<"none" | "episode" | "explicit">("none");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dramaQuery, setDramaQuery] = useState("");
  const [pickedDrama, setPickedDrama] = useState<{ slug: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createPost = useMutation(api.posts.create);
  const dramaSearch = useQuery(
    api.onboarding.search,
    dramaQuery.trim().length >= 2 ? { q: dramaQuery.trim() } : "skip"
  );

  const canPost = body.trim().length > 0 && body.length <= MAX && !busy;
  const overLimit = body.length > MAX;

  const remaining = useMemo(() => MAX - body.length, [body.length]);

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      await createPost({
        body: body.trim(),
        category,
        spoilerLevel,
        dramaSlug: pickedDrama?.slug,
        hashtags: tags,
      });
      router.replace("/(tabs)/home");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "UNKNOWN";
      setError(
        msg.includes("RATE_LIMITED")
          ? "Posting too fast — take a breath and try again in a minute."
          : msg.includes("SPOILER_NEEDS_DRAMA")
            ? "Spoilers need a drama tag so we can guard them properly."
            : "Couldn't publish. Check your connection and try again."
      );
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false, presentation: "modal" }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <T variant="h2">New post</T>

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What's happening in your fandom?"
          placeholderTextColor="#6B6B6B"
          multiline
          className="mt-4 min-h-[120px] rounded-[12px] bg-card border border-line p-4 text-[15px] text-text-primary"
        />
        <Row className="justify-end mt-1">
          <T variant="tertiary" className={overLimit ? "text-coral" : ""}>
            {remaining} characters left
          </T>
        </Row>

        <T variant="h3" className="mt-4">Category</T>
        <View className="flex-row flex-wrap gap-2 mt-2">
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              className={cn("rounded-full border px-3 py-1.5", category === c ? "border-brand bg-brand" : "border-line bg-card")}
            >
              <T variant="tertiary" className={category === c ? "text-white" : ""}>{c.replace("_", " ")}</T>
            </Pressable>
          ))}
        </View>

        <T variant="h3" className="mt-5">Tag a drama</T>
        {pickedDrama ? (
          <Row className="mt-2 justify-between rounded-[12px] bg-card border border-line p-3">
            <T variant="body">📺 {pickedDrama.title}</T>
            <Pressable onPress={() => setPickedDrama(null)}>
              <T variant="tertiary" className="text-coral">Remove</T>
            </Pressable>
          </Row>
        ) : (
          <>
            <TextInput
              value={dramaQuery}
              onChangeText={setDramaQuery}
              placeholder="Search dramas…"
              placeholderTextColor="#6B6B6B"
              className="mt-2 h-11 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
            />
            {dramaSearch && dramaSearch.dramas.length > 0 ? (
              <View className="mt-2">
                {dramaSearch.dramas.slice(0, 4).map((d) => (
                  <Pressable
                    key={d._id}
                    onPress={() => {
                      setPickedDrama({ slug: d.slug, title: d.title });
                      setDramaQuery("");
                    }}
                    className="rounded-[12px] bg-card border border-line p-3 mb-2"
                  >
                    <T variant="body">{d.title}</T>
                    <T variant="tertiary">{d.genres.join(" · ")}</T>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}

        {pickedDrama ? (
          <>
            <T variant="h3" className="mt-5">Spoiler level</T>
            <View className="flex-row flex-wrap gap-2 mt-2">
              {SPOILER_LEVELS.map((s) => (
                <Pressable
                  key={s.value}
                  onPress={() => setSpoilerLevel(s.value)}
                  className={cn("rounded-full border px-3 py-1.5", spoilerLevel === s.value ? "border-coral bg-coral" : "border-line bg-card")}
                >
                  <T variant="tertiary" className={spoilerLevel === s.value ? "text-white" : ""}>{s.label}</T>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <T variant="h3" className="mt-5">Hashtags</T>
        <Row className="mt-2 gap-2">
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag…"
            placeholderTextColor="#6B6B6B"
            autoCapitalize="none"
            className="flex-1 h-11 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
          />
          <Button
            label="Add"
            size="sm"
            variant="secondary"
            onPress={() => {
              const t = tagInput.replace(/^#/, "").trim().toLowerCase();
              if (/^[a-z0-9_]{1,40}$/.test(t) && !tags.includes(t)) setTags([...tags, t]);
              setTagInput("");
            }}
          />
        </Row>
        {tags.length > 0 ? (
          <Row className="flex-wrap gap-2 mt-2">
            {tags.map((t) => (
              <Pressable key={t} onPress={() => setTags(tags.filter((x) => x !== t))} className="rounded-full bg-card border border-line px-3 py-1.5">
                <T variant="tertiary">#{t} ✕</T>
              </Pressable>
            ))}
          </Row>
        ) : null}

        <T variant="h3" className="mt-5">Media</T>
        <T variant="tertiary" className="mt-1">
          Image attach arrives with the storage pipeline (M2 hardening). Video
          and polls are coming in v1.1 — intentionally not offered yet (Spec §22).
        </T>

        {error ? <T variant="secondary" className="text-coral mt-4">{error}</T> : null}

        <Button
          label={busy ? "Publishing…" : "Publish"}
          onPress={publish}
          disabled={!canPost}
          className="mt-6"
        />
      </ScrollView>
    </Screen>
  );
}
