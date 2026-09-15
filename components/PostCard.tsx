import { useState } from "react";
import { Link } from "expo-router";
import { Modal, Pressable, Share, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArtImage,
  ArtStat,
  Avatar,
  Badge,
  Button,
  Card,
  Row,
  SpoilerOverlay,
  T,
  cn,
} from "@/components/ui";
import { errorCopy } from "@/lib/copy";

// PostCard — the shared feed unit (Spec §51 "Home feed" + SCREEN_NAVIGATION_MAP
// "PostCard"), redrawn image-first per the owner's reference design: full-bleed
// drama art, caption overlaid bottom-left in bold white, engagement pills
// sitting on the image. Everything shown is a real server value; guarded bodies
// arrive empty and only the audited reveal can fetch them (the art is also
// hidden for guarded posts so the overlay can't be read off the imagery).
//
// Posts without a drama context render as a classic text card — there is no
// artwork to attach, and fabricating one is banned (Spec §39).

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
  drama: {
    slug: string;
    title: string;
    titleKr: string | null;
    posterUrl: string | null;
  } | null;
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

function compactCount(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}K`;
  }
  return String(n);
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
  const [reaction, setReaction] = useState<string | null>(post.viewerReacted ? "heart" : null);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [bookmarked, setBookmarked] = useState(post.viewerBookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(post.repostCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
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
    setPickerOpen(false);
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

  const guarded = post.spoilerGuarded && !revealed;
  const imageFirst = !!post.drama;

  // ---------- Image-first card (posts tied to a drama) ----------
  if (imageFirst) {
    return (
      <Card className="mx-4 mb-4 rounded-2xl border-line shadow-lg shadow-black/40">
        <ArtImage
          uri={post.drama!.posterUrl}
          seed={post.drama!.slug}
          label={post.drama!.title}
          ratio={4 / 3}
          scrim
        >
          {/* Top overlay: author row + optional ranking reason */}
          <View className="p-3">
            {showReason && post.reason ? (
              <View className="self-start rounded-full bg-black/40 border border-white/15 px-2.5 py-1 mb-2">
                <T className="text-white/85 text-[11px]" numberOfLines={2}>✦ {post.reason}</T>
              </View>
            ) : null}
            <Row className="justify-between">
              <Row className="flex-1 pr-2">
                <Link href={`/user/${post.author.handle}`} asChild>
                  <Pressable accessibilityRole="button" accessibilityLabel={`@${post.author.handle}`}>
                    <Avatar name={post.author.displayName} size={34} />
                  </Pressable>
                </Link>
                <View className="ml-2.5 flex-1">
                  <Row className="flex-wrap">
                    <Link href={`/user/${post.author.handle}`} asChild>
                      <Pressable className="flex-row items-center">
                        <T className="text-white text-[14px] font-semibold">{post.author.displayName}</T>
                        {post.author.verified || post.official ? (
                          <View className="ml-1.5 h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-ocean">
                            <T className="text-white text-[8px] font-bold">✓</T>
                          </View>
                        ) : null}
                      </Pressable>
                    </Link>
                  </Row>
                  <T className="text-white/70 text-[11px]">
                    {timeAgo(post.createdAt)}
                    {post.episodeNumber ? ` · Ep ${post.episodeNumber}` : ""}
                  </T>
                </View>
              </Row>
              <Pressable
                onPress={() => setMenuOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Post options"
                className="h-8 w-8 items-center justify-center rounded-full bg-black/30 border border-white/15"
              >
                <T className="text-white">⋯</T>
              </Pressable>
            </Row>
          </View>

          {/* Bottom overlay: caption + engagement */}
          <View className="px-3.5 pb-3.5" style={{ paddingTop: 96 }}>
            {guarded ? (
              <View className="rounded-xl bg-black/45 border border-white/15 p-3">
                <T variant="coral">Spoiler ahead</T>
                <T className="text-white/85 text-[12px] mt-0.5">
                  {SPOILER_REASON[post.spoilerReason ?? ""] ?? "it may reveal plot details"}
                </T>
                <Button
                  size="sm"
                  variant="gradient"
                  label="Show anyway"
                  className="mt-2.5 self-start"
                  onPress={onReveal}
                />
              </View>
            ) : (
              <Link href={`/post/${post._id}`} asChild>
                <Pressable accessibilityRole="button">
                  <T className="text-white text-[19px] font-bold leading-[24px]" numberOfLines={2}>
                    {revealed ? body : post.body || post.drama!.title}
                  </T>
                </Pressable>
              </Link>
            )}
            <Row className="mt-3 justify-between">
              <Row>
                <ArtStat
                  glyph={reaction === "heart" ? "❤️" : "♡"}
                  count={compactCount(reactionCount)}
                  active={!!reaction}
                  label="React"
                  onLongPress={() => setPickerOpen(!pickerOpen)}
                  onPress={() => {
                    if (reaction === null || reaction === "heart") {
                      onReaction("heart");
                    } else {
                      setPickerOpen(!pickerOpen);
                    }
                  }}
                />
                <View className="ml-2">
                  <Link href={`/post/${post._id}`} asChild>
                    <Pressable accessibilityRole="button" accessibilityLabel="Comments">
                      <ArtStat glyph="💬" count={compactCount(post.commentCount)} label="Comments" />
                    </Pressable>
                  </Link>
                </View>
                <View className="ml-2">
                  <ArtStat
                    glyph={reposted ? "🔁" : "⇄"}
                    count={compactCount(repostCount)}
                    label="Repost"
                    onPress={onRepost}
                  />
                </View>
                <View className="ml-2">
                  <ArtStat
                    glyph={bookmarked ? "🔖" : "📑"}
                    label="Bookmark"
                    onPress={onBookmark}
                  />
                </View>
              </Row>
              {post.pinned ? <Badge label="PINNED" tone="brand" /> : null}
              {post.locked ? <Badge label="LOCKED" tone="warn" /> : null}
            </Row>
            {pickerOpen ? (
              <Row className="mt-2 flex-wrap">
                {REACTIONS.map((r) => (
                  <Pressable
                    key={r.kind}
                    onPress={() => onReaction(r.kind)}
                    accessibilityRole="button"
                    accessibilityLabel={`React ${r.kind.replace("_", " ")}`}
                    className={cn(
                      "mr-1.5 rounded-full px-2 py-1",
                      reaction === r.kind ? "bg-white/40" : "bg-black/40 border border-white/15"
                    )}
                  >
                    <T>{r.glyph}</T>
                  </Pressable>
                ))}
              </Row>
            ) : null}
          </View>
        </ArtImage>

        {toast ? (
          <View className="px-3.5 pb-3 pt-2">
            <View className="rounded-[12px] bg-card-elevated px-3 py-2">
              <T variant="secondary">{toast}</T>
            </View>
          </View>
        ) : null}

        <PostMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          handle={post.author.handle}
          onReport={() => {
            setMenuOpen(false);
            onReport?.(post);
          }}
          onMute={onMute}
          onBlock={onBlock}
          onShare={onShare}
        />
      </Card>
    );
  }

  // ---------- Text card (no drama context → no fabricated art) ----------
  return (
    <Card className="mx-4 mb-4 p-4 rounded-2xl">
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
        {post.episodeNumber ? <Badge label={`EP ${post.episodeNumber}`} tone="muted" className="mr-2" /> : null}
      </Row>

      {guarded ? (
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
              {body}
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
          {REACTIONS.slice(0, 6).map((r) => (
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
          <Pressable
            onPress={onBookmark}
            accessibilityRole="button"
            accessibilityLabel="Bookmark"
            className="mr-3"
          >
            <T variant="tertiary">{bookmarked ? "🔖" : "📑"} {bookmarkCount}</T>
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

      <PostMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        handle={post.author.handle}
        onReport={() => {
          setMenuOpen(false);
          onReport?.(post);
        }}
        onMute={onMute}
        onBlock={onBlock}
        onShare={onShare}
      />
    </Card>
  );
}

function PostMenu({
  open,
  onClose,
  handle,
  onReport,
  onMute,
  onBlock,
  onShare,
}: {
  open: boolean;
  onClose: () => void;
  handle: string;
  onReport: () => void;
  onMute: () => void;
  onBlock: () => void;
  onShare: () => void;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60" onPress={onClose} />
      <View
        className="absolute bottom-0 left-0 right-0 rounded-t-[24px] border border-line bg-card p-4"
        style={{ paddingBottom: 40 }}
      >
        <View className="self-center mb-3 h-1 w-10 rounded-full bg-line-strong" />
        <T variant="h3">Post options</T>
        <Button variant="secondary" label="Report post" className="mt-4" onPress={onReport} />
        <Button variant="secondary" label={`Mute @${handle}`} className="mt-2" onPress={onMute} />
        <Button variant="secondary" label={`Block @${handle}`} className="mt-2" onPress={onBlock} />
        <Button variant="secondary" label="Share" className="mt-2" onPress={onShare} />
        <Button variant="ghost" label="Cancel" className="mt-3" onPress={onClose} />
      </View>
    </Modal>
  );
}
