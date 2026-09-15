import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, getViewerProfile, requireViewer } from "./lib/guards";
import { spoilerGuard } from "./lib/spoiler";
import { track } from "./onboarding";
import { Doc } from "./_generated/dataModel";
import { artUrl } from "../lib/art";

// Drama hub assembly (Spec §7): hero data, viewer relationship (follow +
// watch status), cast, and episode summary. Fictional seed data per D-05;
// TMDB sync enriches these rows later without changing the shape.

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const viewer = await getViewerProfile(ctx);
    const drama = await ctx.db
      .query("dramas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!drama) return null;

    // Viewer relationship: follow edge + watching row (the two inputs the
    // hub's action row renders from).
    let viewerFollowing = false;
    let viewerWatch: {
      status: Doc<"watchingStatus">["status"];
      watchedThrough: number;
    } | null = null;

    if (viewer) {
      const follow = await ctx.db
        .query("follows")
        .withIndex("by_follower_target", (q) =>
          q.eq("followerId", viewer._id).eq("targetType", "drama").eq("targetId", slug)
        )
        .first();
      viewerFollowing = !!follow;

      const watch = await ctx.db
        .query("watchingStatus")
        .withIndex("by_profile_drama", (q) =>
          q.eq("profileId", viewer._id).eq("dramaId", drama._id)
        )
        .first();
      if (watch) {
        viewerWatch = { status: watch.status, watchedThrough: watch.watchedThrough };
      }
    }

    // Cast, in billing order.
    const castRows = await ctx.db
      .query("dramaCast")
      .withIndex("by_drama_order", (q) => q.eq("dramaId", drama._id))
      .collect();
    const cast = [];
    for (const c of castRows) {
      const actor = await ctx.db.get(c.actorId);
      if (actor) {
        cast.push({
          actorId: actor._id,
          slug: actor.slug,
          name: actor.name,
          nameKr: actor.nameKr,
          characterName: c.characterName,
        });
      }
    }

    // Episode summary — the hub shows the boundary at a glance; the full
    // list with watched marks comes from episodes.listForDrama.
    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_drama_number", (q) => q.eq("dramaId", drama._id))
      .collect();
    const episodeCount = episodes.length;
    const latestAired = episodes.reduce((acc, e) => Math.max(acc, e.number), 0);

    // Spoiler boundary context for the hub banner: the viewer's own progress
    // vs. the latest aired episode (only meaningful while signed in).
    const spoilerBoundary =
      viewerWatch && viewerWatch.status === "watching" && latestAired > viewerWatch.watchedThrough
        ? {
            latestAired,
            watchedThrough: viewerWatch.watchedThrough,
            line: `Latest aired: Ep ${latestAired} — you've watched through Ep ${viewerWatch.watchedThrough}`,
          }
        : null;

    return {
      _id: drama._id,
      slug: drama.slug,
      title: drama.title,
      titleKr: drama.titleKr,
      synopsis: drama.synopsis,
      status: drama.status,
      genres: drama.genres,
      network: drama.network,
      releaseSchedule: drama.releaseSchedule,
      nextEpisodeAt: drama.nextEpisodeAt,
      year: drama.year,
      posterUrl: artUrl(drama.tmdbPosterPath),
      followerCount: drama.followerCount,
      episodeCount,
      latestAired,
      viewerFollowing,
      viewerWatch,
      spoilerBoundary,
      cast,
    };
  },
});

// Explore rails (Spec §6/§13): currently airing + upcoming, real data, no
// fake counts. M4 adds trending from the trendScores cron.
export const listAiring = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const dramas = await ctx.db
      .query("dramas")
      .withIndex("by_status", (q) => q.eq("status", "airing"))
      .take(Math.min(limit, 30));
    return dramas.map((d) => ({
      slug: d.slug,
      title: d.title,
      titleKr: d.titleKr,
      genres: d.genres,
      network: d.network,
      releaseSchedule: d.releaseSchedule,
      nextEpisodeAt: d.nextEpisodeAt,
    }));
  },
});

export const listUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 8 }) => {
    const dramas = await ctx.db
      .query("dramas")
      .withIndex("by_status", (q) => q.eq("status", "upcoming"))
      .take(Math.min(limit, 30));
    return dramas.map((d) => ({
      slug: d.slug,
      title: d.title,
      titleKr: d.titleKr,
      genres: d.genres,
      network: d.network,
      year: d.year,
    }));
  },
});

// Follow/unfollow a drama from the hub (counters maintained transactionally).
export const toggleFollow = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const viewer = await requireViewer(ctx);
    const drama = await ctx.db
      .query("dramas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!drama) throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) =>
        q.eq("followerId", viewer._id).eq("targetType", "drama").eq("targetId", slug)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(drama._id, {
        followerCount: Math.max(0, drama.followerCount - 1),
      });
      return { following: false, followerCount: Math.max(0, drama.followerCount - 1) };
    }

    await ctx.db.insert("follows", {
      followerId: viewer._id,
      targetType: "drama",
      targetId: slug,
      createdAt: Date.now(),
    });
    await ctx.db.patch(drama._id, { followerCount: drama.followerCount + 1 });
    await track(ctx, viewer._id, "drama_followed", slug);
    return { following: true, followerCount: drama.followerCount + 1 };
  },
});

// Episode discussion stream (Spec §8): posts tagged to this episode, with
// the per-viewer spoiler decision applied server-side via the M3 engine.
// NOTE: import placed here to keep the module graph clean.
import { Id } from "./_generated/dataModel";

export const listDiscussion = query({
  args: { episodeId: v.id("episodes"), limit: v.optional(v.number()) },
  handler: async (ctx, { episodeId, limit = 30 }) => {
    const viewer = await getViewerProfile(ctx);
    const episode = await ctx.db.get(episodeId);
    if (!episode) return [];
    const drama = await ctx.db.get(episode.dramaId);
    if (!drama) return [];

    const watchRow = viewer
      ? await ctx.db
          .query("watchingStatus")
          .withIndex("by_profile_drama", (q) =>
            q.eq("profileId", viewer._id).eq("dramaId", drama._id)
          )
          .first()
      : null;
    const watchedThrough = watchRow?.watchedThrough ?? null;
    const preference = viewer?.spoilerPreference ?? "balanced";

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_drama_state_created", (q) =>
        q.eq("dramaId", drama._id).eq("moderationState", "visible")
      )
      .order("desc")
      .take(100);

    // Episode-scoped stream: posts explicitly tagged to this episode number.
    const scoped = posts
      .filter((p) => p.episodeNumber === episode.number)
      .slice(0, Math.min(limit, 50));

    const out = [];
    for (const p of scoped) {
      const author = await ctx.db.get(p.authorId);
      if (!author) continue;
      const decision = spoilerGuard({
        spoilerLevel: p.spoilerLevel,
        contentEpisode: p.episodeNumber ?? null,
        viewerWatchedThrough: watchedThrough,
        viewerPreference: preference,
      });
      out.push({
        _id: p._id,
        author: { handle: author.handle, displayName: author.displayName, verified: author.verified },
        category: p.category,
        body: decision.guarded ? "" : p.body,
        spoilerGuarded: decision.guarded,
        spoilerLevel: p.spoilerLevel,
        drama: { slug: drama.slug, title: drama.title, titleKr: drama.titleKr },
        episodeNumber: p.episodeNumber ?? null,
        official: p.official,
        reactionCount: p.reactionCount,
        commentCount: p.commentCount,
        repostCount: p.repostCount,
        bookmarkCount: p.bookmarkCount,
        createdAt: p.createdAt,
        viewerReacted: false,
        viewerBookmarked: false,
      });
    }
    return out;
  },
});
