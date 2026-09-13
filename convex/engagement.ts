import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { spoilerGuard } from "./lib/spoiler";
import { track } from "./onboarding";
import { Doc, Id } from "./_generated/dataModel";

const REACTION_KINDS = [
  "heart", "fire", "cry", "laugh", "shock", "white_heart",
] as const;

// Reactions (§10): one reaction row per user+post+kind; toggling kind swaps
// the row. Counters denormalized onto posts for feed reads (D-02 note).
export const toggleReaction = mutation({
  args: {
    postId: v.id("posts"),
    kind: v.union(...REACTION_KINDS.map((k) => v.literal(k))),
  },
  handler: async (ctx, { postId, kind }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "reaction:toggle", viewer._id);

    const post = await ctx.db.get(postId);
    if (!post || post.moderationState !== "visible") throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("postReactions")
      .withIndex("by_post", (q) => q.eq("postId", postId).eq("profileId", viewer._id))
      .first();

    let active: boolean;
    if (existing) {
      if (existing.kind === kind) {
        await ctx.db.delete(existing._id);
        active = false;
      } else {
        await ctx.db.patch(existing._id, { kind });
        active = true;
      }
    } else {
      await ctx.db.insert("postReactions", { profileId: viewer._id, postId, kind, createdAt: Date.now() });
      active = true;
    }

    const count = await ctx.db
      .query("postReactions")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
    await ctx.db.patch(postId, { reactionCount: count.length });

    if (active) await track(ctx, viewer._id, "reaction_added", kind);
    return { active, reactionCount: count.length };
  },
});

export const toggleBookmark = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const viewer = await requireViewer(ctx);
    const post = await ctx.db.get(postId);
    if (!post || post.moderationState !== "visible") throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", postId).eq("profileId", viewer._id))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(postId, { bookmarkCount: Math.max(0, post.bookmarkCount - 1) });
      return { bookmarked: false, bookmarkCount: post.bookmarkCount - 1 };
    }
    await ctx.db.insert("bookmarks", { profileId: viewer._id, postId, createdAt: Date.now() });
    await ctx.db.patch(postId, { bookmarkCount: post.bookmarkCount + 1 });
    await track(ctx, viewer._id, "bookmark_created");
    return { bookmarked: true, bookmarkCount: post.bookmarkCount + 1 };
  },
});

export const toggleRepost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const viewer = await requireViewer(ctx);
    const post = await ctx.db.get(postId);
    if (!post || post.moderationState !== "visible") throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("reposts")
      .withIndex("by_post", (q) => q.eq("postId", postId).eq("profileId", viewer._id))
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(postId, { repostCount: Math.max(0, post.repostCount - 1) });
      return { reposted: false, repostCount: post.repostCount - 1 };
    }
    await ctx.db.insert("reposts", { profileId: viewer._id, postId, createdAt: Date.now() });
    await ctx.db.patch(postId, { repostCount: post.repostCount + 1 });
    await track(ctx, viewer._id, "repost_created");
    return { reposted: true, repostCount: post.repostCount + 1 };
  },
});

// Spoiler reveal (§9, D-10): "Show anyway" is informed consent — reveal is
// always possible, never silent, and always audited. The M3 engine governs
// the default presentation (feed/discussion reads); the reveal is the
// explicit opt-in that logs who saw what, when, and why it was guarded.
export const revealSpoiler = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const viewer = await requireViewer(ctx);
    const post = await ctx.db.get(postId);
    if (!post) throw new ConvexError("NOT_FOUND");
    if (post.spoilerLevel === "none") return { body: post.body, blocked: false } as const;

    const postDramaId = post.dramaId;
    const watchRow = postDramaId
      ? await ctx.db
          .query("watchingStatus")
          .withIndex("by_profile_drama", (q) =>
            q.eq("profileId", viewer._id).eq("dramaId", postDramaId)
          )
          .first()
      : null;
    const decision = spoilerGuard({
      spoilerLevel: post.spoilerLevel,
      contentEpisode: post.episodeNumber ?? null,
      viewerWatchedThrough: watchRow?.watchedThrough ?? null,
      viewerPreference: viewer.spoilerPreference,
    });

    await ctx.db.insert("auditLogs", {
      actorId: viewer._id,
      event: "spoiler_reveal",
      context: JSON.stringify({
        postId,
        spoilerLevel: post.spoilerLevel,
        decision: decision.reason,
      }),
      createdAt: Date.now(),
    });

    return { body: post.body, blocked: false } as const;
  },
});

export const listBookmarkedIds = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("bookmarks")
      .withIndex("by_profile_created", (q) => q.eq("profileId", viewer._id))
      .order("desc")
      .take(50);
    return rows.map((r) => r.postId);
  },
});
