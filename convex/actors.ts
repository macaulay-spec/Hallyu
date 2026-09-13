import { query } from "./_generated/server";
import { v } from "convex/values";
import { getViewerProfile } from "./lib/guards";

// Actor pages (SCREEN_NAVIGATION_MAP #19): filmography from dramaCast +
// follower relationship. Fictional seed per D-05 until TMDB sync enriches.
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const viewer = await getViewerProfile(ctx);
    const actor = await ctx.db
      .query("actors")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!actor) return null;

    let viewerFollowing = false;
    if (viewer) {
      const follow = await ctx.db
        .query("follows")
        .withIndex("by_follower_target", (q) =>
          q.eq("followerId", viewer._id).eq("targetType", "actor").eq("targetId", slug)
        )
        .first();
      viewerFollowing = !!follow;
    }

    // Filmography: cast rows for this actor, with drama context.
    const castRows = await ctx.db
      .query("dramaCast")
      .withIndex("by_actor", (q) => q.eq("actorId", actor._id))
      .collect();

    const credits = [];
    for (const c of castRows) {
      const drama = await ctx.db.get(c.dramaId);
      if (drama) {
        credits.push({
          dramaSlug: drama.slug,
          title: drama.title,
          titleKr: drama.titleKr,
          status: drama.status,
          year: drama.year,
          characterName: c.characterName,
        });
      }
    }

    return {
      _id: actor._id,
      slug: actor.slug,
      name: actor.name,
      nameKr: actor.nameKr,
      bio: actor.bio,
      followerCount: actor.followerCount,
      viewerFollowing,
      credits: credits.sort((a, b) => (b.year ?? 0) - (a.year ?? 0)),
    };
  },
});
