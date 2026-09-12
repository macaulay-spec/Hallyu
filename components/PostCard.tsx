import { useState } from "react";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { Card, Row, T, Button, SpoilerOverlay, cn } from "@/components/ui";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

const REACTIONS = [
  { kind: "heart", glyph: "❤️" },
  { kind: "fire", glyph: "🔥" },
  { kind: "cry", glyph: "😭" },
  { kind: "laugh", glyph: "😂" },
  { kind: "shock", glyph: "😱" },
  { kind: "white_heart", glyph: "🤍" },
] as const;

export type PostCardData = {
  _id: Id<"posts">;
  author: { handle: string; displayName: string; verified: boolean };
  category: string;
  body: string;
  spoilerGuarded: boolean;
  spoilerLevel: string;
  drama: { slug: string; title: string; titleKr: string | null } | null;
  episodeNumber: number | null;
  official: boolean;
  reactionCount: number;
  commentCount: number;
  repostCount: number;
  bookmarkCount: number;
  createdAt: number;
  viewerReacted: boolean;
  viewerBookmarked: boolean;
};

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function PostCard({ post }: { post: PostCardData }) {
  const [revealed, setRevealed] = useState(false);
  const [body, setBody] = useState(post.body);
  const [reacted, setReacted] = useState(post.viewerReacted);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [bookmarked, setBookmarked] = useState(post.viewerBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount);

  const toggleReaction = useMutation(api.engagement.toggleReaction);
  const toggleBookmark = useMutation(api.engagement.toggleBookmark);
  const toggleRepost = useMutation(api.engagement.toggleRepost);
  const revealSpoiler = useMutation(api.engagement.revealSpoiler);

  async function onReaction(kind: string) {
    // Optimistic update with server rollback (Spec §31).
    setReacted((prev) => !prev);
    setReactionCount((c) => (reacted ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await toggleReaction({ postId: post._id, kind: kind as never });
      setReacted(res.active);
      setReactionCount(res.reactionCount);
    } catch {
      setReacted(reacted);
      setReactionCount(reactionCount);
    }
  }

  async function onBookmark() {
    setBookmarked((p) => !p);
    setBookmarkCount((c) => (bookmarked ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await toggleBookmark({ postId: post._id });
      setBookmarked(res.bookmarked);
      setBookmarkCount(res.bookmarkCount);
    } catch {
      setBookmarked(bookmarked);
      setBookmarkCount(bookmarkCount);
    }
  }

  async function onRepost() {
    setReposted((p) => !p);
    setRepostCount((c) => (reposted ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await toggleRepost({ postId: post._id });
      setReposted(res.reposted);
      setRepostCount(res.repostCount);
    } catch {
      setReposted(reposted);
      setRepostCount(repostCount);
    }
  }

  async function onReveal() {
    try {
      const res = await revealSpoiler({ postId: post._id }); // audited (D-10)
      setBody(res.body);
      setRevealed(true);
    } catch {
      // reveal failed; stay guarded
    }
  }

  return (
    <Card className="mx-4 mb-3 p-4">
      <Row className="justify-between">
        <Link href={`/user/${post.author.handle}`} asChild>
          <Pressable>
            <Row>
              <T variant="h3">{post.author.displayName}</T>
              {post.author.verified ? <T variant="brand"> · verified</T> : null}
              {post.official ? <T variant="coral"> · official</T> : null}
            </Row>
            <T variant="tertiary">@{post.author.handle} · {timeAgo(post.createdAt)}</T>
          </Pressable>
        </Link>
        <T variant="tertiary">{post.category}</T>
      </Row>

      {post.drama ? (
        <Row className="mt-2">
          <Link href={`/drama/${post.drama.slug}`} asChild>
            <Pressable className="rounded-full bg-card-elevated px-3 py-1">
              <T variant="tertiary">
                📺 {post.drama.title}{post.episodeNumber ? ` · Ep ${post.episodeNumber}` : ""}
              </T>
            </Pressable>
          </Link>
        </Row>
      ) : null}

      {post.spoilerGuarded && !revealed ? (
        <View className="mt-3">
          <SpoilerOverlay
            drama={post.drama?.title ?? "This content"}
            episode={post.episodeNumber}
            onReveal={onReveal}
          />
        </View>
      ) : (
        <T variant="body" className="mt-3">
          {revealed ? `⚠️ ${body}` : body}
        </T>
      )}

      <Row className="mt-3 justify-between">
        <Row>
          {REACTIONS.slice(0, 4).map((r) => (
            <Pressable
              key={r.kind}
              onPress={() => onReaction(r.kind)}
              className={cn("mr-2 rounded-full px-2 py-1", reacted && r.kind === "heart" ? "bg-brand" : "")}
            >
              <T variant="secondary">{r.glyph}</T>
            </Pressable>
          ))}
          {reactionCount > 0 ? <T variant="tertiary">{reactionCount}</T> : null}
        </Row>
        <Row>
          <Link href={`/post/${post._id}`} asChild>
            <Pressable className="mr-3">
              <T variant="tertiary">💬 {post.commentCount}</T>
            </Pressable>
          </Link>
          <Pressable onPress={onRepost} className="mr-3">
            <T variant="tertiary">{reposted ? "🔁" : "↻"} {repostCount}</T>
          </Pressable>
          <Pressable onPress={onBookmark}>
            <T variant="tertiary">{bookmarked ? "🔖" : "📑"} {bookmarkCount}</T>
          </Pressable>
        </Row>
      </Row>
    </Card>
  );
}
