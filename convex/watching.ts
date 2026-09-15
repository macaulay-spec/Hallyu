import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { track } from "./onboarding";
import { Doc, Id } from "./_generated/dataModel";

const STATUSES = ["watching", "planning", "completed", "dropped", "on_hold"] as const;

// Watching status + watch progress (Spec §9, §13, §25A). "watchedThrough" is
// the spoiler engine's input: the viewer declares "watched through Ep X" and
// every guarded read compares content against it. Setting watchedThrough also
// syncs the watchedEpisodes set so both views agree (single source of truth:
// watchedThrough; watchedEpisodes is the per-episode ledger for checkmarks).
export const setStatus = mutation({
  args: {
    dramaSlug: v.string(),
    status: v.union(...STATUSES.map((s) => v.literal(s))),
    watchedThrough: v.optional(v.number()),
  },
  handler: async (ctx, { dramaSlug, status, watchedThrough }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "watching:set", viewer._id);

    const drama = await ctx.db
      .query("dramas")
      .withIndex("by_slug", (q) => q.eq("slug", dramaSlug))
      .first();
    if (!drama) throw new ConvexError("NOT_FOUND");

    if (watchedThrough !== undefined && watchedThrough < 0) {
      throw new ConvexError("PROGRESS_INVALID");
    }
    if (watchedThrough !== undefined && watchedThrough > 200) {
      throw new ConvexError("PROGRESS_INVALID");
    }

    const existing = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) =>
        q.eq("profileId", viewer._id).eq("dramaId", drama._id)
      )
      .first();

    const now = Date.now();
    let rowId: Id<"watchingStatus">;
    if (existing) {
      rowId = existing._id;
      const patch: Partial<Doc<"watchingStatus">> = { status, updatedAt: now };
      if (watchedThrough !== undefined) patch.watchedThrough = watchedThrough;
      await ctx.db.patch(rowId, patch);
    } else {
      rowId = await ctx.db.insert("watchingStatus", {
        profileId: viewer._id,
        dramaId: drama._id,
        status,
        watchedThrough: watchedThrough ?? 0,
        updatedAt: now,
      });
    }

    await track(ctx, viewer._id, "watch_status_set", `${dramaSlug}:${status}`);
    return { ok: true, watchedThrough: watchedThrough ?? existing?.watchedThrough ?? 0 };
  },
});

// Sync the per-episode ledger to match watchedThrough: mark every episode
// ≤ X watched, clear every episode > X. Used by the stepper on the drama hub.
export const syncWatchedEpisodes = mutation({
  args: { dramaSlug: v.string(), watchedThrough: v.number() },
  handler: async (ctx, { dramaSlug, watchedThrough }) => {
    const viewer = await requireViewer(ctx);

    const drama = await ctx.db
      .query("dramas")
      .withIndex("by_slug", (q) => q.eq("slug", dramaSlug))
      .first();
    if (!drama) throw new ConvexError("NOT_FOUND");

    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_drama_number", (q) => q.eq("dramaId", drama._id))
      .collect();

    const watchedRows = await ctx.db
      .query("watchedEpisodes")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    const watchedByEpisode = new Map(watchedRows.map((r) => [r.episodeId, r._id]));
    const now = Date.now();

    for (const ep of episodes) {
      const shouldWatch = ep.number <= watchedThrough;
      const existingId = watchedByEpisode.get(ep._id);
      if (shouldWatch && !existingId) {
        await ctx.db.insert("watchedEpisodes", {
          profileId: viewer._id,
          episodeId: ep._id,
          watchedAt: now,
        });
      } else if (!shouldWatch && existingId) {
        await ctx.db.delete(existingId);
      }
    }

    const row = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) =>
        q.eq("profileId", viewer._id).eq("dramaId", drama._id)
      )
      .first();
    if (row) {
      await ctx.db.patch(row._id, { watchedThrough, updatedAt: now });
    } else {
      await ctx.db.insert("watchingStatus", {
        profileId: viewer._id,
        dramaId: drama._id,
        status: "watching",
        watchedThrough,
        updatedAt: now,
      });
    }
    return { ok: true, watchedThrough };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) => q.eq("profileId", viewer._id))
      .collect();

    const out = [];
    for (const row of rows) {
      const drama = await ctx.db.get(row.dramaId);
      if (!drama) continue;
      // Episode count lets the progress stepper clamp honestly instead of
      // letting a user "watch" episode 40 of a 16-episode drama.
      const episodes = await ctx.db
        .query("episodes")
        .withIndex("by_drama_number", (q) => q.eq("dramaId", drama._id))
        .collect();
      out.push({
        dramaSlug: drama.slug,
        title: drama.title,
        titleKr: drama.titleKr,
        status: row.status,
        watchedThrough: row.watchedThrough,
        dramaStatus: drama.status,
        episodeCount: episodes.length,
        latestEpisode: episodes.reduce((max, e) => Math.max(max, e.number), 0),
        updatedAt: row.updatedAt,
      });
    }
    return out.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});
