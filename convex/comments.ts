import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { spoilerGuard } from "./lib/spoiler";
import { track } from "./onboarding";
import { Doc } from "./_generated/dataModel";

const MAX_DEPTH = 2; // 0,1,2 => 3 levels (Spec §11)
const MAX_BODY = 2000;

export const create = mutation({
  args: {
    postId: v.id("posts"),
    body: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    spoilerLevel: v.union(v.literal("none"), v.literal("episode"), v.literal("explicit")),
  },
  handler: async (ctx, { postId, body, parentCommentId, spoilerLevel }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "comment:create", viewer._id);

    const post = await ctx.db.get(postId);
    if (!post || post.moderationState !== "visible") throw new ConvexError("NOT_FOUND");

    const text = body.trim();
    if (text.length === 0) throw new ConvexError("COMMENT_EMPTY");
    if (text.length > MAX_BODY) throw new ConvexError("COMMENT_TOO_LONG");

    let depth = 0;
    if (parentCommentId) {
      const parent = await ctx.db.get(parentCommentId);
      if (!parent || parent.postId !== postId) throw new ConvexError("NOT_FOUND");
      depth = parent.depth + 1;
      if (depth > MAX_DEPTH) throw new ConvexError("COMMENT_DEPTH_EXCEEDED");
    }

    const commentId = await ctx.db.insert("comments", {
      postId,
      authorId: viewer._id,
      parentCommentId,
      depth,
      body: text,
      spoilerLevel,
      moderationState: "visible",
      reactionCount: 0,
      createdAt: Date.now(),
    });

    await ctx.db.patch(postId, { commentCount: post.commentCount + 1 });
    await track(ctx, viewer._id, "comment_created");
    return { commentId };
  },
});

// Audited comment spoiler reveal (D-10, §9): "Show anyway" consent model —
// the second explicit call returns the guarded body and writes an audit log
// entry with the viewer's engine decision for the record.
export const revealSpoiler = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const viewer = await requireViewer(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) throw new ConvexError("NOT_FOUND");
    if (comment.spoilerLevel === "none") return { body: comment.body };

    const post = await ctx.db.get(comment.postId);
    const postDramaId = post?.dramaId;
    const watchRow = postDramaId
      ? await ctx.db
          .query("watchingStatus")
          .withIndex("by_profile_drama", (q) =>
            q.eq("profileId", viewer._id).eq("dramaId", postDramaId)
          )
          .first()
      : null;
    const decision = spoilerGuard({
      spoilerLevel: comment.spoilerLevel,
      contentEpisode: post?.episodeNumber ?? null,
      viewerWatchedThrough: watchRow?.watchedThrough ?? null,
      viewerPreference: viewer.spoilerPreference,
    });

    await ctx.db.insert("auditLogs", {
      actorId: viewer._id,
      event: "spoiler_reveal_comment",
      context: JSON.stringify({
        commentId,
        spoilerLevel: comment.spoilerLevel,
        decision: decision.reason,
      }),
      createdAt: Date.now(),
    });
    return { body: comment.body };
  },
});

export const listForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const viewer = await requireViewer(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return [];

    // Per-viewer progress against the post's drama (M3 engine).
    const postDramaId = post.dramaId;
    const watchRow = postDramaId
      ? await ctx.db
          .query("watchingStatus")
          .withIndex("by_profile_drama", (q) =>
            q.eq("profileId", viewer._id).eq("dramaId", postDramaId)
          )
          .first()
      : null;
    const watchedThrough = watchRow?.watchedThrough ?? null;

    const rows = await ctx.db
      .query("comments")
      .withIndex("by_post_state_created", (q) =>
        q.eq("postId", postId).eq("moderationState", "visible")
      )
      .order("asc")
      .take(200);

    const assembled = [];
    for (const c of rows) {
      const author = await ctx.db.get(c.authorId);
      if (!author) continue;
      const decision = spoilerGuard({
        spoilerLevel: c.spoilerLevel,
        contentEpisode: post.episodeNumber ?? null,
        viewerWatchedThrough: watchedThrough,
        viewerPreference: viewer.spoilerPreference,
      });
      assembled.push({
        _id: c._id,
        postId: c.postId,
        parentCommentId: c.parentCommentId ?? null,
        depth: c.depth,
        body: decision.guarded ? "" : c.body,
        spoilerGuarded: decision.guarded,
        spoilerReason: decision.reason,
        spoilerLevel: c.spoilerLevel,
        reactionCount: c.reactionCount,
        createdAt: c.createdAt,
        author: { handle: author.handle, displayName: author.displayName, verified: author.verified },
      });
    }
    return assembled;
  },
});
