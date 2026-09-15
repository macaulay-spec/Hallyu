import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer, getViewerProfile } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { notifyMentions } from "./lib/notify";
import { spoilerGuard, SpoilerDecision } from "./lib/spoiler";
import { track } from "./onboarding";
import { Doc, Id } from "./_generated/dataModel";

const CATEGORIES = [
  "reaction", "discussion", "theory", "recommendation",
  "meme", "news", "question", "fan_content",
] as const;

const MAX_BODY = 5000; // Spec §10

// Assemble the read-model for a post: author + drama context. Used by every
// stream so the client renders one PostCard shape everywhere.
export async function assemble(
  ctx: { db: any },
  post: Doc<"posts">,
  viewer: Doc<"profiles"> | null
) {
  const author = await ctx.db.get(post.authorId);
  if (!author) return null;

  // Blocks: a blocked author's posts vanish for the viewer (server-side, §28).
  if (viewer) {
    const blocked = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q: any) =>
        q.eq("blockerId", viewer._id).eq("blockedProfileId", post.authorId)
      )
      .first();
    if (blocked) return null;
  }

  let drama: { slug: string; title: string; titleKr: string | null } | null = null;
  if (post.dramaId) {
    const d = await ctx.db.get(post.dramaId);
    if (d) drama = { slug: d.slug, title: d.title, titleKr: d.titleKr ?? null };
  }

  // Per-user spoiler engine (M3, D-10): the decision compares the post's
  // tagging against the viewer's watch progress + spoiler preference. The
  // body never leaves the server for guarded posts — the client cannot leak
  // what it never received.
  const watchRow = viewer && post.dramaId
    ? await ctx.db
        .query("watchingStatus")
        .withIndex("by_profile_drama", (q: any) =>
          q.eq("profileId", viewer._id).eq("dramaId", post.dramaId)
        )
        .first()
    : null;
  const decision: SpoilerDecision = spoilerGuard({
    spoilerLevel: post.spoilerLevel,
    contentEpisode: post.episodeNumber ?? null,
    viewerWatchedThrough: watchRow?.watchedThrough ?? null,
    viewerPreference: viewer?.spoilerPreference ?? "balanced",
  });
  const guarded = decision.guarded;
  const viewerReacted = viewer
    ? !!(await ctx.db
        .query("postReactions")
        .withIndex("by_post", (q: any) =>
          q.eq("postId", post._id).eq("profileId", viewer._id)
        )
        .first())
    : false;
  const viewerBookmarked = viewer
    ? !!(await ctx.db
        .query("bookmarks")
        .withIndex("by_post", (q: any) =>
          q.eq("postId", post._id).eq("profileId", viewer._id)
        )
        .first())
    : false;

  const hashtags = await ctx.db
    .query("postHashtags")
    .withIndex("by_post", (q: any) => q.eq("postId", post._id))
    .collect();

  return {
    _id: post._id,
    author: { handle: author.handle, displayName: author.displayName, verified: author.verified },
    category: post.category,
    body: guarded ? "" : post.body,
    spoilerGuarded: guarded,
    spoilerReason: decision.reason,
    spoilerLevel: post.spoilerLevel,
    drama,
    episodeNumber: post.episodeNumber ?? null,
    communityId: post.communityId ?? null,
    official: post.official,
    reactionCount: post.reactionCount,
    commentCount: post.commentCount,
    repostCount: post.repostCount,
    bookmarkCount: post.bookmarkCount,
    createdAt: post.createdAt,
    hashtags: hashtags.length,
    viewerReacted,
    viewerBookmarked,
  };
}

/** Drops nulls (blocked authors, deleted rows) and narrows the type so the
 * client never has to juggle `| null` items from a stream. */
export function compact<T>(rows: Array<T | null>): T[] {
  return rows.filter((row): row is T => row !== null);
}

export const create = mutation({
  args: {
    body: v.string(),
    category: v.union(...CATEGORIES.map((c) => v.literal(c))),
    dramaSlug: v.optional(v.string()),
    episodeNumber: v.optional(v.number()),
    communitySlug: v.optional(v.string()),
    spoilerLevel: v.union(v.literal("none"), v.literal("episode"), v.literal("explicit")),
    hashtags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "post:create", viewer._id);

    const body = args.body.trim();
    if (body.length === 0) throw new ConvexError("POST_EMPTY");
    if (body.length > MAX_BODY) throw new ConvexError("POST_TOO_LONG");

    let dramaId: Id<"dramas"> | undefined;
    if (args.dramaSlug) {
      const d = await ctx.db
        .query("dramas")
        .withIndex("by_slug", (q) => q.eq("slug", args.dramaSlug!))
        .first();
      if (!d) throw new ConvexError("NOT_FOUND");
      dramaId = d._id;
    }
    // Episode context requires a drama context (§19 flow order).
    const episodeNumber =
      args.episodeNumber && dramaId ? args.episodeNumber : undefined;
    if (args.episodeNumber && !dramaId) throw new ConvexError("EPISODE_NEEDS_DRAMA");
    if (spoilerOf(args.spoilerLevel) !== "none" && !dramaId) {
      throw new ConvexError("SPOILER_NEEDS_DRAMA");
    }

    let communityId: Id<"communities"> | undefined;
    if (args.communitySlug) {
      const c = await ctx.db
        .query("communities")
        .withIndex("by_slug", (q) => q.eq("slug", args.communitySlug!))
        .first();
      if (!c) throw new ConvexError("NOT_FOUND");
      const membership = await ctx.db
        .query("communityMembers")
        .withIndex("by_community_profile", (q) =>
          q.eq("communityId", c._id).eq("profileId", viewer._id)
        )
        .first();
      if (!membership || membership.state === "banned") throw new ConvexError("NOT_MEMBER");
      communityId = c._id;
    }

    const postId = await ctx.db.insert("posts", {
      authorId: viewer._id,
      category: args.category,
      body,
      spoilerLevel: args.spoilerLevel,
      dramaId,
      episodeNumber,
      communityId,
      moderationState: "visible",
      official: viewer.isOfficial,
      reactionCount: 0,
      commentCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      createdAt: Date.now(),
    });

    // Hashtags (§10): normalized, deduped, counted.
    const tags = new Set(
      (args.hashtags ?? [])
        .map((t) => t.replace(/^#/, "").trim().toLowerCase())
        .filter((t) => /^[a-z0-9_]{1,40}$/.test(t))
    );
    for (const tag of tags) {
      const existing = await ctx.db
        .query("hashtags")
        .withIndex("by_tag", (q) => q.eq("tag", tag))
        .first();
      const hashtagId = existing
        ? (await ctx.db.patch(existing._id, { useCount: existing.useCount + 1 }), existing._id)
        : await ctx.db.insert("hashtags", { tag, useCount: 1 });
      await ctx.db.insert("postHashtags", { postId, hashtagId });
    }

    await ctx.db.patch(viewer._id, { postCount: viewer.postCount + 1 });
    await track(ctx, viewer._id, "post_created", args.category);

    // Mentions are critical notifications (§18) and deep-link to the post.
    await notifyMentions(ctx, { actorId: viewer._id, body, route: `/post/${postId}` });
    // Episode discussions are first-class (§8): a post tagged to an episode bumps
    // that episode's discussion activity so the Episode Activity rail is real.
    if (dramaId && episodeNumber) {
      const episode = await ctx.db
        .query("episodes")
        .withIndex("by_drama_number", (q) =>
          q.eq("dramaId", dramaId!).eq("number", episodeNumber)
        )
        .first();
      if (episode?.discussionId) {
        const discussion = await ctx.db.get(episode.discussionId);
        if (discussion) {
          await ctx.db.patch(discussion._id, {
            postCount: discussion.postCount + 1,
            lastActivityAt: Date.now(),
          });
        }
      }
    }
    return { postId };
  },
});

function spoilerOf(level: "none" | "episode" | "explicit") {
  return level;
}

// Single post with the same read model as streams. Returns "removed" for
// moderated content so the client can render the §38 copy distinctly.
export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const viewer = await getViewerProfile(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return null;
    if (post.moderationState === "removed") return "removed" as const;
    return await assemble(ctx, post, viewer);
  },
});

// Global recent stream — powers "Everything" + acts as the For You fallback
// until M4's explainable ranking lands (never labeled as personalized when
// it isn't).
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const viewer = await getViewerProfile(ctx);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_state_created", (q) => q.eq("moderationState", "visible"))
      .order("desc")
      .take(Math.min(limit, 50));
    const assembled = await Promise.all(posts.map((p) => assemble(ctx, p, viewer)));
    return compact(assembled);
  },
});

// Following feed (§5): posts from followed users/dramas/actors + joined
// communities, near-chronological, mutes + blocks filtered server-side.
export const listFollowing = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const viewer = await requireViewer(ctx);
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) => q.eq("followerId", viewer._id))
      .collect();

    const followedUserIds = new Set(
      follows.filter((f) => f.targetType === "user").map((f) => f.targetId)
    );
    const followedDramaSlugs = new Set(
      follows.filter((f) => f.targetType === "drama").map((f) => f.targetId)
    );

    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    const joinedCommunityIds = new Set(
      memberships.filter((m) => m.state === "active").map((m) => m.communityId)
    );

    const mutes = await ctx.db
      .query("mutes")
      .withIndex("by_profile_target", (q) => q.eq("profileId", viewer._id))
      .collect();
    const mutedUsers = new Set(mutes.filter((m) => m.targetType === "user").map((m) => m.targetId));
    const mutedDramas = new Set(mutes.filter((m) => m.targetType === "drama").map((m) => m.targetId));

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_state_created", (q) => q.eq("moderationState", "visible"))
      .order("desc")
      .take(150);

    const dramaIdToSlug = new Map<string, string>();
    const filtered = [];
    for (const p of posts) {
      if (p.authorId !== viewer._id) {
        const author = await ctx.db.get(p.authorId);
        if (!author) continue;
        const isFollowed = followedUserIds.has(author._id) || followedUserIds.has(author.handle);
        const isJoined = p.communityId ? joinedCommunityIds.has(p.communityId) : false;
        const dramaSlug = p.dramaId
          ? (dramaIdToSlug.get(p.dramaId) ??
            (await ctx.db.get(p.dramaId))?.slug ??
            "")
          : "";
        if (p.dramaId && dramaSlug) dramaIdToSlug.set(p.dramaId, dramaSlug);
        const isDramaFollowed = dramaSlug ? followedDramaSlugs.has(dramaSlug) : false;
        if (!isFollowed && !isJoined && !isDramaFollowed) continue;
        if (mutedUsers.has(author.handle) || mutedDramas.has(dramaSlug)) continue;
      }
      filtered.push(p);
      if (filtered.length >= Math.min(limit, 50)) break;
    }

    const assembled = await Promise.all(filtered.map((p) => assemble(ctx, p, viewer)));
    return assembled.filter(Boolean);
  },
});

// Drama hub community area (Spec §7): Discussions / Trending / Theories /
// Memes / Edits / Official are the same stream filtered by category, so one
// indexed query serves every tab instead of six bespoke ones.
export const listByDrama = query({
  args: {
    slug: v.string(),
    limit: v.optional(v.number()),
    category: v.optional(v.union(...CATEGORIES.map((c) => v.literal(c)))),
  },
  handler: async (ctx, { slug, limit = 30, category }) => {
    const viewer = await getViewerProfile(ctx);
    const drama = await ctx.db
      .query("dramas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!drama) return [];
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_drama_state_created", (q) =>
        q.eq("dramaId", drama._id).eq("moderationState", "visible")
      )
      .order("desc")
      .take(Math.min(limit, 50));
    const filtered = category ? posts.filter((p) => p.category === category) : posts;
    const assembled = await Promise.all(filtered.map((p) => assemble(ctx, p, viewer)));
    return compact(assembled);
  },
});

export const listByHashtag = query({
  args: { tag: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { tag, limit = 30 }) => {
    const viewer = await getViewerProfile(ctx);
    const t = tag.replace(/^#/, "").toLowerCase();
    const hashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", t))
      .first();
    if (!hashtag) return [];
    const links = await ctx.db
      .query("postHashtags")
      .withIndex("by_hashtag", (q) => q.eq("hashtagId", hashtag._id))
      .take(Math.min(limit, 50));
    const assembled = await Promise.all(
      links.map(async (l) => {
        const p = await ctx.db.get(l.postId);
        if (!p || p.moderationState !== "visible") return null;
        return await assemble(ctx, p, viewer);
      })
    );
    return compact(assembled).sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listByAuthor = query({
  args: { handle: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { handle, limit = 30 }) => {
    const viewer = await getViewerProfile(ctx);
    const author = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!author) return [];
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author_state_created", (q) =>
        q.eq("authorId", author._id).eq("moderationState", "visible")
      )
      .order("desc")
      .take(Math.min(limit, 50));
    const assembled = await Promise.all(posts.map((p) => assemble(ctx, p, viewer)));
    return compact(assembled);
  },
});
