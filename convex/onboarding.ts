import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireViewer } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Onboarding suggestions (Spec §34): the curated starting set. Real ranked
// suggestions arrive with recommendations in M4; this is honest seed-based
// discovery, never fake counts.
export const suggestions = query({
  args: {},
  handler: async (ctx) => {
    await requireViewer(ctx);

    const dramas = await ctx.db
      .query("dramas")
      .withIndex("by_status", (q) => q.eq("status", "airing"))
      .take(12);
    const actors = await ctx.db.query("actors").take(12);
    const communities = await ctx.db.query("communities").take(12);

    return {
      dramas: dramas.map((d) => ({
        _id: d._id,
        slug: d.slug,
        title: d.title,
        titleKr: d.titleKr,
        genres: d.genres,
        status: d.status,
      })),
      actors: actors.map((a) => ({ _id: a._id, slug: a.slug, name: a.name, nameKr: a.nameKr })),
      communities: communities.map((c) => ({
        _id: c._id,
        slug: c.slug,
        name: c.name,
        isPrivate: c.isPrivate,
        memberCount: c.memberCount,
      })),
    };
  },
});

// Entity-typed search for the onboarding search bars (M4 generalizes this).
export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    await requireViewer(ctx);
    const term = q.trim();
    if (term.length < 2) {
      return { dramas: [], actors: [], communities: [] };
    }

    const dramas = await ctx.db
      .query("dramas")
      .withSearchIndex("search_title", (s) => s.search("title", term))
      .take(8);

    const actors = await ctx.db
      .query("actors")
      .withSearchIndex("search_name", (s) => s.search("name", term))
      .take(8);

    // Communities are name-prefiltered in-memory (small seed set); FTS when
    // volume justifies it.
    const allCommunities = await ctx.db.query("communities").take(50);
    const lower = term.toLowerCase();
    const communities = allCommunities.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.slug.includes(lower)
    ).slice(0, 8);

    return { dramas, actors, communities };
  },
});

export const toggleFollow = mutation({
  args: {
    targetType: v.union(v.literal("drama"), v.literal("actor")),
    targetId: v.string(), // slug
  },
  handler: async (ctx, { targetType, targetId }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "follow:toggle", viewer._id);

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) =>
        q.eq("followerId", viewer._id).eq("targetType", targetType).eq("targetId", targetId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      if (targetType === "drama") await decrDramaFollowers(ctx, targetId);
      return { following: false };
    }
    await ctx.db.insert("follows", {
      followerId: viewer._id,
      targetType,
      targetId,
      createdAt: Date.now(),
    });
    if (targetType === "drama") await incrDramaFollowers(ctx, targetId);
    await track(ctx, viewer._id, targetType === "drama" ? "drama_followed" : "user_followed", targetId);
    return { following: true };
  },
});

export const complete = mutation({
  args: { interests: v.array(v.string()) },
  handler: async (ctx, { interests }) => {
    const viewer = await requireViewer(ctx);
    await ctx.db.patch(viewer._id, {
      interests: interests.slice(0, 20),
      onboardingComplete: true,
    });
    await track(ctx, viewer._id, "onboarding_completed", undefined);
    return { ok: true };
  },
});

// ---- helpers ----
async function getDramaBySlug(ctx: MutationCtx, slug: string): Promise<Doc<"dramas"> | null> {
  return await ctx.db.query("dramas").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
}

async function incrDramaFollowers(ctx: MutationCtx, slug: string) {
  const drama = await getDramaBySlug(ctx, slug);
  if (drama) await ctx.db.patch(drama._id, { followerCount: drama.followerCount + 1 });
}

async function decrDramaFollowers(ctx: MutationCtx, slug: string) {
  const drama = await getDramaBySlug(ctx, slug);
  if (drama && drama.followerCount > 0) {
    await ctx.db.patch(drama._id, { followerCount: drama.followerCount - 1 });
  }
}

export async function track(
  ctx: MutationCtx,
  profileId: Id<"profiles"> | undefined,
  event: string,
  context?: string
) {
  await ctx.db.insert("analyticsEvents", { profileId, event, context, createdAt: Date.now() });
}
