import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Data access for the TMDB sync, split out of tmdb.ts so the action module
// doesn't create a circular type reference against its own generated api.

// Rows carrying a tmdbRef — the only ones the sync may touch. Internal: the
// sync sweep is the only caller.
export const listEnrichable = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows: Array<{ _id: Doc<"dramas">["_id"]; tmdbRef: string }> = [];
    for await (const d of ctx.db.query("dramas")) {
      if (d.tmdbRef) rows.push({ _id: d._id, tmdbRef: d.tmdbRef });
    }
    return rows;
  },
});

export const applyDrama = internalMutation({
  args: {
    dramaId: v.id("dramas"),
    overview: v.union(v.string(), v.null()),
    year: v.union(v.number(), v.null()),
    posterPath: v.union(v.string(), v.null()),
    backdropPath: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { dramaId, overview, year, posterPath, backdropPath }) => {
    const drama = await ctx.db.get(dramaId);
    if (!drama) return;
    // Never blank out curated fictional fields (D-05): null means "keep".
    const patch: Partial<Doc<"dramas">> = {};
    if (overview) patch.synopsis = overview;
    if (year != null && !Number.isNaN(year)) patch.year = year;
    if (posterPath) patch.tmdbPosterPath = posterPath;
    if (backdropPath) patch.tmdbBackdropPath = backdropPath;
    if (Object.keys(patch).length > 0) await ctx.db.patch(dramaId, patch);
  },
});
