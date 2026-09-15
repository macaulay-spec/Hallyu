import { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Screen,
  T,
  Button,
  Row,
  Card,
  Chip,
  Badge,
  SpoilerOverlay,
} from "@/components/ui";

// Composer (SCREEN_NAVIGATION_MAP #23/#24, Spec §10/§19). Fast path: write →
// category → drama → episode context → spoiler level → hashtags → cross-post →
// preview → publish. The preview shows the actual spoiler card another viewer
// would see, so the author makes an informed tagging choice. Media attach is
// honestly labelled as pending the storage pipeline; video/polls are v1.1 and
// are not rendered as buttons (§39 rule 10, Spec §22).

const CATEGORIES = [
  "reaction",
  "discussion",
  "theory",
  "recommendation",
  "meme",
  "news",
  "question",
  "fan_content",
] as const;

const SPOILER_LEVELS = [
  { value: "none", label: "No spoiler", hint: "Safe for everyone" },
  { value: "episode", label: "Episode spoilers", hint: "Guard against watch progress" },
  { value: "explicit", label: "Major spoilers", hint: "Guarded for everyone but Relaxed" },
] as const;

const MAX = 5000; // Spec §10

type PickedDrama = { _id: Id<"dramas">; slug: string; title: string };

export default function Create() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("reaction");
  const [spoilerLevel, setSpoilerLevel] = useState<"none" | "episode" | "explicit">("none");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dramaQuery, setDramaQuery] = useState("");
  const [pickedDrama, setPickedDrama] = useState<PickedDrama | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState<number | null>(null);
  const [communitySlug, setCommunitySlug] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createPost = useMutation(api.posts.create);
  const dramaSearch = useQuery(
    api.onboarding.search,
    dramaQuery.trim().length >= 2 ? { q: dramaQuery.trim() } : "skip"
  );
  const episodes = useQuery(
    api.episodes.listForDrama,
    pickedDrama ? { dramaId: pickedDrama._id } : "skip"
  );
  const communities = useQuery(api.communities.list);
  const topics = useQuery(api.discovery.topics, { limit: 10 });

  const myCommunities = (communities ?? []).filter((c) => c.viewerState === "active");
  const remaining = useMemo(() => MAX - body.length, [body.length]);
  const overLimit = body.length > MAX;
  const canPost = body.trim().length > 0 && !overLimit && !busy;

  function addTag(raw: string) {
    const t = raw.replace(/^#/, "").trim().toLowerCase();
    if (/^[a-z0-9_]{1,40}$/.test(t) && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      await createPost({
        body: body.trim(),
        category,
        spoilerLevel,
        dramaSlug: pickedDrama?.slug,
        episodeNumber: episodeNumber ?? undefined,
        communitySlug: communitySlug ?? undefined,
        hashtags: tags,
      });
      router.replace("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "UNKNOWN";
      setError(
        msg.includes("RATE_LIMITED")
          ? "Posting too fast — take a breath and try again in a minute."
          : msg.includes("SPOILER_NEEDS_DRAMA")
            ? "Spoilers need a drama tag so the engine can guard them properly."
            : msg.includes("EPISODE_NEEDS_DRAMA")
              ? "Pick a drama before choosing an episode."
              : msg.includes("NOT_MEMBER")
                ? "You need to join that community before posting in it."
                : "Couldn't publish. Check your connection and try again."
      );
      setBusy(false);
    }
  }

  if (preview) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
          <Row className="justify-between">
            <T variant="h2">Preview</T>
            <Button variant="secondary" size="sm" label="Back to edit" onPress={() => setPreview(false)} />
          </Row>
          <T variant="tertiary" className="mt-1">
            This is exactly what other viewers see. Guarded bodies are stripped on the
            server, so the card below is the real thing — not a mock-up.
          </T>

          <Card className="mt-4 p-4">
            <Row className="flex-wrap">
              <Badge label={category.replace("_", " ").toUpperCase()} tone="muted" className="mr-2" />
              {pickedDrama ? (
                <Badge
                  label={`${pickedDrama.title}${episodeNumber ? ` · Ep ${episodeNumber}` : ""}`}
                  tone="brand"
                />
              ) : null}
              {communitySlug ? <Badge label={communitySlug} tone="success" className="ml-2" /> : null}
            </Row>
            {spoilerLevel === "none" ? (
              <T variant="body" className="mt-3">
                {body.trim()}
              </T>
            ) : (
              <View className="mt-3">
                <SpoilerOverlay
                  drama={pickedDrama?.title ?? "This post"}
                  episode={episodeNumber}
                  note={
                    spoilerLevel === "explicit"
                      ? "the author tagged this as major spoilers"
                      : "it may go past their watch progress"
                  }
                  onReveal={() => {}}
                />
              </View>
            )}
            {tags.length > 0 ? (
              <Row className="mt-3 flex-wrap">
                {tags.map((t) => (
                  <Chip key={t} label={`#${t}`} />
                ))}
              </Row>
            ) : null}
          </Card>

          {error ? (
            <T variant="coral" className="mt-4">
              {error}
            </T>
          ) : null}
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

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Row className="justify-between">
          <T variant="h2">New post</T>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close composer">
            <T variant="tertiary">✕</T>
          </Pressable>
        </Row>

        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="What's happening in your fandom?"
          placeholderTextColor="#6B6B6B"
          multiline
          className="mt-4 min-h-[140px] rounded-[12px] bg-card border border-line p-4 text-[15px] text-text-primary"
        />
        <Row className="justify-end mt-1">
          <T variant="tertiary" className={overLimit ? "text-coral" : ""}>
            {remaining} characters left
          </T>
        </Row>

        <T variant="h3" className="mt-4">
          Category
        </T>
        <View className="flex-row flex-wrap mt-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c.replace("_", " ")}
              active={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>

        <T variant="h3" className="mt-4">
          Tag a drama
        </T>
        {pickedDrama ? (
          <Row className="mt-2 justify-between rounded-[12px] bg-card border border-line p-3">
            <T variant="body">📺 {pickedDrama.title}</T>
            <Pressable
              onPress={() => {
                setPickedDrama(null);
                setEpisodeNumber(null);
                setSpoilerLevel("none");
              }}
            >
              <T variant="coral">Remove</T>
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
            {dramaSearch && dramaQuery.trim().length >= 2 && dramaSearch.dramas.length === 0 ? (
              <T variant="tertiary" className="mt-2">
                No matching dramas found.
              </T>
            ) : null}
            {dramaSearch && dramaSearch.dramas.length > 0 ? (
              <View className="mt-2">
                {dramaSearch.dramas.slice(0, 4).map((d) => (
                  <Pressable
                    key={d.slug}
                    onPress={() => {
                      setPickedDrama({ _id: d._id, slug: d.slug, title: d.title });
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
            <T variant="h3" className="mt-4">
              Episode context
            </T>
            <T variant="tertiary" className="mt-1">
              Tagging the episode is what lets the spoiler engine compare against each
              reader's watch progress.
            </T>
            {episodes === undefined ? (
              <T variant="tertiary" className="mt-2">
                Loading episodes…
              </T>
            ) : episodes.episodes.length === 0 ? (
              <T variant="tertiary" className="mt-2">
                This drama has no episode list yet, so episode-level guarding isn't
                available — the tag will stay drama-wide.
              </T>
            ) : (
              <View className="flex-row flex-wrap mt-2">
                <Chip label="None" active={episodeNumber === null} onPress={() => setEpisodeNumber(null)} />
                {episodes.episodes.map((e) => (
                  <Chip
                    key={e._id}
                    label={`Ep ${e.number}`}
                    active={episodeNumber === e.number}
                    onPress={() => setEpisodeNumber(e.number)}
                  />
                ))}
              </View>
            )}

            <T variant="h3" className="mt-4">
              Spoiler level
            </T>
            <View className="flex-row flex-wrap mt-2">
              {SPOILER_LEVELS.map((s) => (
                <Chip
                  key={s.value}
                  label={s.label}
                  active={spoilerLevel === s.value}
                  onPress={() => setSpoilerLevel(s.value)}
                />
              ))}
            </View>
            <T variant="tertiary" className="mt-1">
              {SPOILER_LEVELS.find((s) => s.value === spoilerLevel)?.hint}
            </T>
          </>
        ) : null}

        {myCommunities.length > 0 ? (
          <>
            <T variant="h3" className="mt-4">
              Post to a community
            </T>
            <View className="flex-row flex-wrap mt-2">
              <Chip label="Your profile" active={communitySlug === null} onPress={() => setCommunitySlug(null)} />
              {myCommunities.map((c) => (
                <Chip
                  key={c.slug}
                  label={c.name}
                  active={communitySlug === c.slug}
                  onPress={() => setCommunitySlug(c.slug)}
                />
              ))}
            </View>
          </>
        ) : null}

        <T variant="h3" className="mt-4">
          Hashtags
        </T>
        <Row className="mt-2">
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag…"
            placeholderTextColor="#6B6B6B"
            autoCapitalize="none"
            onSubmitEditing={() => addTag(tagInput)}
            className="flex-1 h-11 rounded-[12px] bg-card border border-line px-4 text-[15px] text-text-primary"
          />
          <Button label="Add" size="sm" variant="secondary" className="ml-2" onPress={() => addTag(tagInput)} />
        </Row>
        {tags.length > 0 ? (
          <Row className="flex-wrap mt-2">
            {tags.map((t) => (
              <Pressable key={t} onPress={() => setTags(tags.filter((x) => x !== t))}>
                <Chip label={`#${t} ✕`} active />
              </Pressable>
            ))}
          </Row>
        ) : null}
        {topics && topics.length > 0 ? (
          <>
            <T variant="tertiary" className="mt-2">
              Trending tags — tap to add
            </T>
            <View className="flex-row flex-wrap mt-2">
              {topics.slice(0, 8).map((t) => (
                <Chip key={t.tag} label={`#${t.tag}`} onPress={() => addTag(t.tag)} />
              ))}
            </View>
          </>
        ) : null}

        <T variant="h3" className="mt-5">
          Media
        </T>
        <Card className="mt-2 p-3.5">
          <T variant="secondary">
            Image attach arrives with the storage pipeline. Video and polls are planned
            for v1.1 and are deliberately not offered as buttons (Spec §22/§39).
          </T>
        </Card>

        {error ? (
          <T variant="coral" className="mt-4">
            {error}
          </T>
        ) : null}

        <Button label="Preview" variant="secondary" className="mt-6" onPress={() => setPreview(true)} disabled={!canPost} />
        <Button
          label={busy ? "Publishing…" : "Publish"}
          onPress={publish}
          disabled={!canPost}
          className="mt-3"
        />
      </ScrollView>
    </Screen>
  );
}
