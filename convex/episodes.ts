import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { track } from "./onboarding";

// Episode read model + per-episode watched toggle (Spec §8, §13).
// The discussion query returns drama context, viewer progress, and the
// boundary line so the client can render the spoiler banner verbatim.

export const getWithDiscussion = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const viewer = await requireViewer(ctx);
    const episode = await ctx.db.get(episodeId);
    if (!episode) return null;
    const drama = await ctx.db.get(episode.dramaId);
    if (!drama) return null;

    let discussion = null;
    if (episode.discussionId) {
      const d = await ctx.db.get(episode.discussionId);
      if (d) discussion = { postCount: d.postCount, lastActivityAt: d.lastActivityAt };
    }

    const watchRow = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) =>
        q.eq("profileId", viewer._id).eq("dramaId", drama._id)
      )
      .first();
    const watchedThrough = watchRow?.watchedThrough ?? null;

    const watchedRow = await ctx.db
      .query("watchedEpisodes")
      .withIndex("by_profile_episode", (q) =>
        q.eq("profileId", viewer._id).eq("episodeId", episodeId)
      )
      .first();

    return {
      _id: episode._id,
      number: episode.number,
      title: episode.title,
      synopsis: episode.synopsis,
      airAt: episode.airAt,
      runtimeMinutes: episode.runtimeMinutes,
      discussion,
      drama: { _id: drama._id, slug: drama.slug, title: drama.title, titleKr: drama.titleKr },
      viewerWatchedThrough: watchedThrough,
      viewerWatchedThisEpisode: !!watchedRow,
      viewerStatus: watchRow?.status ?? null,
    };
  },
});

// Toggle the viewer's watched mark for one episode. Watched marks above the
// declared watchedThrough bump it up (progress only ever advances via the
// stepper; individual marks above it sync the headline number), un-watching
// the current top episode lowers it to keep the spoiler boundary honest.
export const toggleWatched = mutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "episode:watch", viewer._id);

    const episode = await ctx.db.get(episodeId);
    if (!episode) throw new ConvexError("NOT_FOUND");
    const drama = await ctx.db.get(episode.dramaId);
    if (!drama) throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("watchedEpisodes")
      .withIndex("by_profile_episode", (q) =>
        q.eq("profileId", viewer._id).eq("episodeId", episodeId)
      )
      .first();

    let row = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) =>
        q.eq("profileId", viewer._id).eq("dramaId", drama._id)
      )
      .first();
    if (!row) {
      const newId = await ctx.db.insert("watchingStatus", {
        profileId: viewer._id,
        dramaId: drama._id,
        status: "watching",
        watchedThrough: 0,
        updatedAt: Date.now(),
      });
      row = await ctx.db.get(newId);
      if (!row) throw new ConvexError("NOT_FOUND");
    }

    const now = Date.now();
    if (existing) {
      await ctx.db.delete(existing._id);
      // Un-watching the top episode lowers the boundary so we never claim
      // progress the viewer no longer has.
      if (row.watchedThrough === episode.number) {
        let top = 0;
        const remaining = await ctx.db
          .query("watchedEpisodes")
          .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
          .collect();
        const remainingIds = new Set(
          remaining.filter((r) => r._id !== existing._id).map((r) => r.episodeId)
        );
        for (const id of remainingIds) {
          const ep = await ctx.db.get(id);
          if (ep && ep.dramaId === drama._id && ep.number > top) top = ep.number;
        }
        await ctx.db.patch(row._id, { watchedThrough: top, updatedAt: now });
      }
      await track(ctx, viewer._id, "episode_unwatched", drama.slug);
      return { watched: false, watchedThrough: Math.max(0, row.watchedThrough === episode.number ? Math.max(0, row.watchedThrough - 0) : row.watchedThrough) };
    }

    await ctx.db.insert("watchedEpisodes", {
      profileId: viewer._id,
      episodeId,
      watchedAt: now,
    });

    let watchedThrough = row.watchedThrough;
    if (episode.number > watchedThrough) watchedThrough = episode.number;
    await ctx.db.patch(row._id, { watchedThrough, updatedAt: now });

    await track(ctx, viewer._id, "episode_watched", `${drama.slug}:${episode.number}`);
    return { watched: true, watchedThrough };
  },
});

// Episode list for the drama hub — includes viewer watched marks so the hub
// can render checkmarks and the spoiler boundary per row.
export const listForDrama = query({
  args: { dramaId: v.id("dramas") },
  handler: async (ctx, { dramaId }) => {
    const viewer = await requireViewer(ctx);
    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_drama_number", (q) => q.eq("dramaId", dramaId))
      .collect();

    const watchRow = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) =>
        q.eq("profileId", viewer._id).eq("dramaId", dramaId)
      )
      .first();

    const watchedRows = await ctx.db
      .query("watchedEpisodes")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    const watchedSet = new Set(watchedRows.map((r) => r.episodeId));

    return {
      watchedThrough: watchRow?.watchedThrough ?? 0,
      viewerStatus: watchRow?.status ?? null,
      episodes: episodes
        .sort((a, b) => a.number - b.number)
        .map((e) => ({
          _id: e._id,
          number: e.number,
          title: e.title,
          airAt: e.airAt,
          discussionId: e.discussionId,
          viewerWatched: watchedSet.has(e._id),
        })),
    };
  },
});
