import { useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Screen, T, Row, Button, WaveProgress, SpoilerOverlay, cn } from "@/components/ui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { EMPTY_COPY } from "@/lib/copy";

type CommentItem = {
  _id: Id<"comments">;
  postId: Id<"posts">;
  parentCommentId: Id<"comments"> | null;
  depth: number;
  body: string;
  spoilerGuarded: boolean;
  spoilerLevel: string;
  reactionCount: number;
  createdAt: number;
  author: { handle: string; displayName: string; verified: boolean };
};

// Post detail (SCREEN_NAVIGATION_MAP #21/22): full post, audited spoiler
// reveal, 3-level comments (Spec §11), reply composer. Comment spoiler
// reveals are also audited server-side.
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = id as Id<"posts">;

  const post = useQuery(api.posts.getById, { postId });
  const comments = useQuery(api.comments.listForPost, { postId });
  const createComment = useMutation(api.comments.create);
  const revealPostSpoiler = useMutation(api.engagement.revealSpoiler);
  const revealCommentSpoiler = useMutation(api.comments.revealSpoiler);

  const [reply, setReply] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: Id<"comments">; handle: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postBody, setPostBody] = useState<string | null>(null);
  const [revealedComments, setRevealedComments] = useState<Record<string, string>>({});

  if (post === undefined || comments === undefined) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <WaveProgress className="mt-24" />
      </Screen>
    );
  }
  if (post === "removed" || post === null) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <T variant="h3" className="px-6 pt-20 text-center">
          This post was removed.
        </T>
      </Screen>
    );
  }

  async function send() {
    if (!reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createComment({
        postId,
        body: reply.trim(),
        parentCommentId: replyTo?.id,
        spoilerLevel: "none",
      });
      setReply("");
      setReplyTo(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(
        msg.includes("DEPTH")
          ? "Replies nest 3 levels deep max — start a fresh thread instead."
          : "Couldn't post your reply. Try again."
      );
    } finally {
      setBusy(false);
    }
  }

  const threads = comments.filter((c) => c.depth === 0);
  const childrenOf = (pid: Id<"comments">) =>
    comments.filter((c) => c.parentCommentId === pid);

  function CommentNode({ c }: { c: CommentItem }) {
    const revealedBody = revealedComments[c._id];
    return (
      <View className={cn("mb-3", c.depth > 0 && "ml-6 border-l border-line pl-3")}>
        <Row className="justify-between">
          <T variant="secondary">
            {c.author.displayName} · @{c.author.handle}
          </T>
          <T variant="tertiary">
            {c.depth > 0 ? "↳ " : ""}{c.reactionCount > 0 ? `♥ ${c.reactionCount}` : ""}
          </T>
        </Row>
        {c.spoilerGuarded && revealedBody === undefined ? (
          <Button
            label="Spoiler — tap to reveal"
            size="sm"
            variant="secondary"
            className="mt-2 self-start"
            onPress={async () => {
              try {
                const res = await revealCommentSpoiler({ commentId: c._id });
                setRevealedComments((prev) => ({ ...prev, [c._id]: res.body }));
              } catch {
                // stay guarded on failure
              }
            }}
          />
        ) : (
          <T variant="body" className="mt-1">{revealedBody ?? c.body}</T>
        )}
        <Pressable
          onPress={() => setReplyTo({ id: c._id, handle: c.author.handle })}
          className="mt-1 self-start"
        >
          <T variant="tertiary">Reply to @{c.author.handle}</T>
        </Pressable>
        {childrenOf(c._id).map((child) => (
          <CommentNode key={child._id} c={child} />
        ))}
      </View>
    );
  }

  const postGuarded = post.spoilerGuarded && postBody === null;

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
        <T variant="h3">{post.author.displayName}</T>
        <T variant="tertiary">@{post.author.handle} · {post.category}</T>
        {post.drama ? (
          <Row className="mt-2">
            <T variant="brand">📺 {post.drama.title}{post.episodeNumber ? ` · Ep ${post.episodeNumber}` : ""}</T>
          </Row>
        ) : null}
        <View className="mt-3">
          {postGuarded ? (
            <SpoilerOverlay
              drama={post.drama?.title ?? "This content"}
              episode={post.episodeNumber}
              onReveal={async () => {
                try {
                  const res = await revealPostSpoiler({ postId });
                  setPostBody(res.body);
                } catch {
                  // stay guarded on failure
                }
              }}
            />
          ) : (
            <T variant="body">{postBody ?? post.body}</T>
          )}
        </View>

        <T variant="h3" className="mt-8">
          Comments {comments.length > 0 ? `(${comments.length})` : ""}
        </T>
        {comments.length === 0 ? (
          <T variant="secondary" className="mt-2">{EMPTY_COPY.comments}</T>
        ) : (
          threads.map((c) => <CommentNode key={c._id} c={c} />)
        )}
      </ScrollView>

      <View className="px-4 pb-6 pt-2 bg-surface border-t border-line">
        {replyTo ? (
          <Row className="justify-between mb-1">
            <T variant="tertiary">Replying to @{replyTo.handle}</T>
            <Pressable onPress={() => setReplyTo(null)}>
              <T variant="tertiary" className="text-coral">Cancel</T>
            </Pressable>
          </Row>
        ) : null}
        {error ? <T variant="tertiary" className="text-coral mb-1">{error}</T> : null}
        <Row>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="Add a comment…"
            placeholderTextColor="#6B6B6B"
            multiline
            className="flex-1 rounded-[12px] bg-card border border-line px-4 py-2 text-[15px] text-text-primary"
          />
          <Button
            label={busy ? "…" : "Send"}
            size="sm"
            onPress={send}
            disabled={!reply.trim() || busy}
            className="ml-2"
          />
        </Row>
      </View>
    </Screen>
  );
}
