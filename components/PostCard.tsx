import { useState } from "react";
import { Link } from "expo-router";
import { Modal, Pressable, Share, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, Badge, Button, Card, Row, SpoilerOverlay, T, cn } from "@/components/ui";
import { errorCopy } from "@/lib/copy";

// PostCard — the shared feed unit (Spec §51 "Home feed" + SCREEN_NAVIGATION_MAP
// "PostCard"). Everything it shows is a real value from the server read model;
// guarded bodies arrive empty and only the audited reveal can fetch them.

const REACTIONS = [
  { kind: "heart", glyph: "❤️" },
  { kind: "fire", glyph: "🔥" },
  { kind: "cry", glyph: "😭" },
  { kind: "laugh", glyph: "😂" },
  { kind: "shock", glyph: "😱" },
  { kind: "white_heart", glyph: "🤍" },
] as const;

const SPOILER_REASON: Record<string, string> = {
  explicit_tag: "the author tagged this as major spoilers",
  beyond_progress: "it goes past your watch progress",
  strict_preference: "your spoiler protection is set to Strict",
  no_progress_context: "no watch progress is recorded for this drama yet",
};

export type PostCardData = {
  _id: Id<"posts">;
  author: { handle: string; displayName: string; verified: boolean };
  category: string;
  body: string;
  spoilerGuarded: boolean;
  spoilerReason?: string;
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
  /** Feeds attach the ranking signal that surfaced this item (§17). */
  reason?: string;
  pinned?: boolean;
  locked?: boolean;
};

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toISOString().slice(0, 10);
}

const CATEGORY_LABEL: Record<string, string> = {
  reaction: "Reaction",
  discussion: "Discussion",
  theory: "Theory",
  recommendation: "Recommendation",
  meme: "Meme",
  news: "News",
  question: "Question",
  fan_content: "Fan content",
};

export function PostCard({
  post,
  showReason = false,
  onReport,
}: {
  post: PostCardData;
  showReason?: boolean;
  onReport?: (post: PostCardData) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [body, setBody] = useState(post.body);
  const [reaction, setReaction] = useState<string | null>(null);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [bookmarked, setBookmarked] = useState(post.viewerBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toggleReaction = useMutation(api.engagement.toggleReaction);
  const toggleBookmark = useMutation(api.engagement.toggleBookmark);
  const toggleRepost = useMutation(api.engagement.toggleRepost);
  const revealSpoiler = useMutation(api.engagement.revealSpoiler);
  const block = useMutation(api.social.block);
  const mute = useMutation(api.social.mute);

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  // Optimistic updates with honest rollback (Spec §31).
  async function onReaction(kind: string) {
    const wasActive = reaction === kind;
    const prevReaction = reaction;
    const prevCount = reactionCount;
    setReaction(wasActive ? null : kind);
    setReactionCount(wasActive ? Math.max(0, prevCount - 1) : prevCount + (prevReaction ? 0 : 1));
    try {
      const res = await toggleReaction({ postId: post._id, kind: kind as never });
      setReaction(res.active ? kind : null);
      setReactionCount(res.reactionCount);
    } catch (e) {
      setReaction(prevReaction);
      setReactionCount(prevCount);
      flash(errorCopy(e instanceof Error && e.message.includes("RATE") ? "RATE_LIMITED" : "UNKNOWN").title);
    }
  }

  async function onBookmark() {
    const prev = bookmarked;
    const prevCount = bookmarkCount;
    setBookmarked(!prev);
    setBookmarkCount(prev ? Math.max(0, prevCount - 1) : prevCount + 1);
    try {
      const res = await toggleBookmark({ postId: post._id });
      setBookmarked(res.bookmarked);
      setBookmarkCount(res.bookmarkCount);
    } catch {
      setBookmarked(prev);
      setBookmarkCount(prevCount);
    }
  }

  async function onRepost() {
    const prev = reposted;
    const prevCount = repostCount;
    setReposted(!prev);
    setRepostCount(prev ? Math.max(0, prevCount - 1) : prevCount + 1);
    try {
      const res = await toggleRepost({ postId: post._id });
      setReposted(res.reposted);
      setRepostCount(res.repostCount);
    } catch {
      setReposted(prev);
      setRepostCount(prevCount);
    }
  }

  async function onReveal() {
    try {
      const res = await revealSpoiler({ postId: post._id }); // audited (D-10)
      setBody(res.body);
      setRevealed(true);
    } catch {
      flash("Couldn't load this right now.");
    }
  }

  async function onShare() {
    try {
      await Share.share({ message: `hallyu://post/${post._id}` });
    } catch {
      // Web has no system share sheet — say so rather than fail silently.
      flash("Sharing isn't available on this platform yet.");
    }
  }

  async function onBlock() {
    setMenuOpen(false);
    try {
      await block({ handle: post.author.handle });
      flash(`Blocked @${post.author.handle}. Their posts are hidden from you.`);
    } catch {
      flash("Couldn't block that account right now.");
    }
  }

  async function onMute() {
    setMenuOpen(false);
    try {
      await mute({ targetType: "user", targetId: post.author.handle });
      flash(`Muted @${post.author.handle} in your feeds.`);
    } catch {
      flash("Couldn't mute that account right now.");
    }
  }

  return (
    <Card className="mx-4 mb-3 p-4">
      {showReason && post.reason ? (
        <T variant="brand" className="mb-2">
          ✦ {post.reason}
        </T>
      ) : null}

      <Row className="justify-between items-start">
        <Row className="flex-1 pr-2">
          <Link href={`/user/${post.author.handle}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`@${post.author.handle}`}>
              <Avatar name={post.author.displayName} size={36} />
            </Pressable>
          </Link>
          <View className="ml-3 flex-1">
            <Link href={`/user/${post.author.handle}`} asChild>
              <Pressable className="flex-row items-center flex-wrap">
                <T variant="h3">{post.author.displayName}</T>
                {post.author.verified ? <Badge label="VERIFIED" tone="brand" className="ml-2" /> : null}
                {post.official ? <Badge label="OFFICIAL" tone="coral" className="ml-2" /> : null}
              </Pressable>
            </Link>
            <T variant="tertiary">
              @{post.author.handle} · {timeAgo(post.createdAt)}
            </T>
          </View>
        </Row>
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Post options"
          className="px-1"
        >
          <T variant="tertiary">⋯</T>
        </Pressable>
      </Row>

      <Row className="mt-2.5 flex-wrap items-center">
        {post.pinned ? <Badge label="PINNED" tone="brand" className="mr-2" /> : null}
        {post.locked ? <Badge label="LOCKED" tone="warn" className="mr-2" /> : null}
        <Badge label={CATEGORY_LABEL[post.category] ?? post.category} tone="muted" className="mr-2" />
        {post.drama ? (
          <Link href={`/drama/${post.drama.slug}`} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${post.drama.title}${post.episodeNumber ? ` episode ${post.episodeNumber}` : ""}`}
              className="rounded-full bg-card-elevated px-3 py-1"
            >
              <T variant="tertiary">
                📺 {post.drama.title}
                {post.episodeNumber ? ` · Ep ${post.episodeNumber}` : ""}
              </T>
            </Pressable>
          </Link>
        ) : null}
      </Row>

      {post.spoilerGuarded && !revealed ? (
        <View className="mt-3">
          <SpoilerOverlay
            drama={post.drama?.title ?? "This post"}
            episode={post.episodeNumber}
            note={SPOILER_REASON[post.spoilerReason ?? ""] ?? "it may reveal plot details"}
            onReveal={onReveal}
          />
        </View>
      ) : (
        <Link href={`/post/${post._id}`} asChild>
          <Pressable accessibilityRole="button">
            <T variant="body" className="mt-3 leading-6">
              {revealed ? `⚠️ ${body}` : body}
            </T>
          </Pressable>
        </Link>
      )}

      {post.locked ? (
        <T variant="tertiary" className="mt-2">
          🔒 Comments are closed on this post (moderator lock).
        </T>
      ) : null}

      <Row className="mt-3 justify-between">
        <Row className="flex-wrap">
          {REACTIONS.map((r) => (
            <Pressable
              key={r.kind}
              onPress={() => onReaction(r.kind)}
              accessibilityRole="button"
              accessibilityLabel={`React ${r.kind.replace("_", " ")}`}
              className={cn(
                "mr-1.5 rounded-full px-2 py-1.5",
                reaction === r.kind ? "bg-brand" : "bg-card-elevated"
              )}
            >
              <T variant="secondary">{r.glyph}</T>
            </Pressable>
          ))}
        </Row>
        <Row>
          <Link href={`/post/${post._id}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Comments" className="mr-3">
              <T variant="tertiary">💬 {post.commentCount}</T>
            </Pressable>
          </Link>
          <Pressable
            onPress={onRepost}
            accessibilityRole="button"
            accessibilityLabel="Repost"
            className="mr-3"
          >
            <T variant="tertiary">
              {reposted ? "🔁" : "↻"} {repostCount}
            </T>
          </Pressable>
          <Pressable onPress={onBookmark} accessibilityRole="button" accessibilityLabel="Bookmark" className="mr-3">
            <T variant="tertiary">
              {bookmarked ? "🔖" : "📑"} {bookmarkCount}
            </T>
          </Pressable>
          <Pressable onPress={onShare} accessibilityRole="button" accessibilityLabel="Share">
            <T variant="tertiary">↗</T>
          </Pressable>
        </Row>
      </Row>

      {reactionCount > 0 || post.commentCount > 0 ? (
        <T variant="tertiary" className="mt-2">
          {reactionCount > 0 ? `${reactionCount} reactions` : ""}
          {reactionCount > 0 && post.commentCount > 0 ? " · " : ""}
          {post.commentCount > 0 ? `${post.commentCount} comments` : ""}
        </T>
      ) : null}

      {toast ? (
        <View className="mt-2 rounded-[12px] bg-card-elevated px-3 py-2">
          <T variant="secondary">{toast}</T>
        </View>
      ) : null}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setMenuOpen(false)} />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-[20px] border border-line bg-surface p-4 pb-8">
          <T variant="h3">Post options</T>
          <Button
            variant="secondary"
            label="Report post"
            className="mt-4"
            onPress={() => {
              setMenuOpen(false);
              onReport?.(post);
            }}
          />
          <Button variant="secondary" label={`Mute @${post.author.handle}`} className="mt-2" onPress={onMute} />
          <Button variant="secondary" label={`Block @${post.author.handle}`} className="mt-2" onPress={onBlock} />
          <Button variant="ghost" label="Cancel" className="mt-3" onPress={() => setMenuOpen(false)} />
        </View>
      </Modal>
    </Card>
  );
}
