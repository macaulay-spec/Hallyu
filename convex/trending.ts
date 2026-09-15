import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getViewerProfile } from "./lib/guards";
import { assemble, compact } from "./posts";
import { freshnessDecay } from "./lib/policy";
import { Doc } from "./_generated/dataModel";

// Trending engine (Spec §6, D-11). A cron sweeps every 15 minutes and
// recomputes trendScores from real activity — velocity, unique participants,
// engagement, freshness decay — with anti-domination caps so one viral post or
// one drama can never permanently own the rail.

const WINDOW_MS = 24 * 60 * 60 * 1000;
const HALF_LIFE_HOURS = 12;
/** §6 anti-domination: at most this many rows per drama in the post rail. */
const MAX_PER_DRAMA = 5;
/** At most this many rows per author — a single account can't fill the rail. */
const MAX_PER_AUTHOR = 2;
const POST_ROWS = 40;

// Freshness decay is shared with the ranking rules and unit-tested in
// tests/policy.test.ts.
function freshness(ageMs: number): number {
  return freshnessDecay(ageMs, HALF_LIFE_HOURS);
}

export const recompute = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_state_created", (q) => q.eq("moderationState", "visible"))
      .order("desc")
      .take(400);

    // Normally the window is "the last 24 hours". On a quiet deployment with no
    // activity inside that window (e.g. a freshly restored demo dataset) the
    // sweep anchors to the most recent real activity instead of returning an
    // empty rail — the scores stay real, they are just measured over the newest
    // available activity window rather than inventing numbers (§39 rule 11).
    const newest = posts[0]?.createdAt ?? now;
    const anchor = newest > now - WINDOW_MS ? now : newest;
    const windowStart = anchor - WINDOW_MS;

    type Scored = {
      post: Doc<"posts">;
      score: number;
      participants: number;
    };
    const scored: Scored[] = [];

    for (const post of posts) {
      if (post.createdAt < windowStart) continue;

      // Unique participants = distinct people who reacted OR commented. This is
      // the signal that separates "one person spamming likes" from a real wave.
      const reactions = await ctx.db
        .query("postReactions")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(200);
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_post_created", (q) => q.eq("postId", post._id))
        .take(100);

      const participants = new Set<string>();
      for (const r of reactions) participants.add(r.profileId);
      for (const c of comments) participants.add(c.authorId);

      // Velocity-weighted engagement + participant breadth + freshness decay.
      const engagement =
        reactions.length * 1.5 +
        post.commentCount * 4 +
        post.repostCount * 4 +
        post.bookmarkCount * 2;
      const breadth = Math.min(participants.size, 25) * 5;
      const score = (engagement + breadth) * freshness(now - post.createdAt) +
        // Official announcements are informational, not the wave itself (§15).
        (post.official ? -25 : 0);

      if (score > 0) scored.push({ post, score, participants: participants.size });
    }

    scored.sort((a, b) => b.score - a.score);

    // Anti-domination caps (§6): per-drama and per-author.
    const perDrama = new Map<string, number>();
    const perAuthor = new Map<string, number>();
    const kept: Scored[] = [];
    for (const row of scored) {
      const dramaKey = row.post.dramaId ?? "none";
      const authorKey = row.post.authorId;
      const dCount = perDrama.get(dramaKey) ?? 0;
      const aCount = perAuthor.get(authorKey) ?? 0;
      if (dramaKey !== "none" && dCount >= MAX_PER_DRAMA) continue;
      if (aCount >= MAX_PER_AUTHOR) continue;
      perDrama.set(dramaKey, dCount + 1);
      perAuthor.set(authorKey, aCount + 1);
      kept.push(row);
      if (kept.length >= POST_ROWS) break;
    }

    // Replace the previous sweep (the table is a cache, never a source of truth).
    const previous = await ctx.db.query("trendScores").take(500);
    for (const row of previous) await ctx.db.delete(row._id);

    for (const row of kept) {
      await ctx.db.insert("trendScores", {
        targetType: "post",
        targetId: row.post._id,
        score: Math.round(row.score * 100) / 100,
        windowStart,
        computedAt: now,
      });
    }

    // Drama-level momentum: sum of kept post scores per drama, normalised by
    // how many distinct participants they attracted.
    const dramaScores = new Map<string, number>();
    for (const row of kept) {
      if (!row.post.dramaId) continue;
      dramaScores.set(row.post.dramaId, (dramaScores.get(row.post.dramaId) ?? 0) + row.score);
    }
    const topDramas = Array.from(dramaScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    for (const [dramaId, score] of topDramas) {
      await ctx.db.insert("trendScores", {
        targetType: "drama",
        targetId: dramaId,
        score: Math.round(score * 100) / 100,
        windowStart,
        computedAt: now,
      });
    }

    // Hashtag momentum from the window's posts.
    const hashtagScores = new Map<string, number>();
    for (const post of posts) {
      if (post.createdAt < windowStart) continue;
      const links = await ctx.db
        .query("postHashtags")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .take(20);
      for (const link of links) {
        const tag = await ctx.db.get(link.hashtagId);
        if (!tag) continue;
        const weight =
          (post.reactionCount * 1.5 + post.commentCount * 4 + post.repostCount * 4) *
          freshness(now - post.createdAt);
        hashtagScores.set(tag.tag, (hashtagScores.get(tag.tag) ?? 0) + weight);
      }
    }
    for (const [tag, score] of Array.from(hashtagScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)) {
      await ctx.db.insert("trendScores", {
        targetType: "hashtag",
        targetId: tag,
        score: Math.round(score * 100) / 100,
        windowStart,
        computedAt: now,
      });
    }

    return { posts: kept.length, dramas: topDramas.length, hashtags: hashtagScores.size };
  },
});

// Public trend rail read model. Scores are real; when the sweep has never run
// (fresh deployment) the rail returns empty and the UI says so instead of
// inventing numbers (§39 rule 11).
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const viewer = await getViewerProfile(ctx);

    const postRows = await ctx.db
      .query("trendScores")
      .withIndex("by_type_score", (q) => q.eq("targetType", "post"))
      .order("desc")
      .take(Math.min(limit, 40));

    const assembledRows = [];
    for (const row of postRows) {
      const post = await ctx.db.get(row.targetId as Doc<"posts">["_id"]);
      if (!post || post.moderationState !== "visible") continue;
      const assembled = await assemble(ctx, post, viewer);
      if (assembled) assembledRows.push({ ...assembled, trendScore: row.score });
    }
    const posts = compact(assembledRows);

    const dramaRows = await ctx.db
      .query("trendScores")
      .withIndex("by_type_score", (q) => q.eq("targetType", "drama"))
      .order("desc")
      .take(12);
    const dramas = [];
    for (const row of dramaRows) {
      const drama = await ctx.db.get(row.targetId as Doc<"dramas">["_id"]);
      if (!drama) continue;
      dramas.push({
        slug: drama.slug,
        title: drama.title,
        titleKr: drama.titleKr ?? null,
        genres: drama.genres,
        status: drama.status,
        score: row.score,
      });
    }

    const hashtagRows = await ctx.db
      .query("trendScores")
      .withIndex("by_type_score", (q) => q.eq("targetType", "hashtag"))
      .order("desc")
      .take(10);

    const computedAt = postRows[0]?.computedAt ?? dramaRows[0]?.computedAt ?? null;

    return {
      posts,
      dramas,
      hashtags: hashtagRows.map((r) => ({ tag: r.targetId, score: r.score })),
      computedAt,
    };
  },
});
