import { query } from "./_generated/server";
import { v } from "convex/values";

// Explore rails (Spec §6, §51). Read-only discovery queries over the real drama
// graph — no invented metrics: ordering is by actual follower counts and real
// hashtag usage.

export const popularDramas = query({
  args: { limit: v.optional(v.number()), genre: v.optional(v.string()) },
  handler: async (ctx, { limit = 10, genre }) => {
    const dramas = await ctx.db.query("dramas").take(200);
    return dramas
      .filter((d) => (genre ? d.genres.includes(genre) : true))
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, limit)
      .map((d) => ({
        slug: d.slug,
        title: d.title,
        titleKr: d.titleKr ?? null,
        genres: d.genres,
        status: d.status,
        network: d.network ?? null,
        year: d.year ?? null,
        releaseSchedule: d.releaseSchedule ?? null,
        followerCount: d.followerCount,
      }));
  },
});

export const popularActors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const actors = await ctx.db.query("actors").take(100);
    return actors
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, limit)
      .map((a) => ({
        slug: a.slug,
        name: a.name,
        nameKr: a.nameKr ?? null,
        followerCount: a.followerCount,
      }));
  },
});

// Official accounts (§15). The badge is cosmetic: `isOfficial` is set on the
// profile, and org details live in officialAccounts. Verification never grants
// moderation power (D-14).
export const officialAccounts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 8 }) => {
    const rows = await ctx.db.query("officialAccounts").take(50);
    const out = [];
    for (const row of rows) {
      const profile = await ctx.db.get(row.profileId);
      if (!profile) continue;
      out.push({
        handle: profile.handle,
        displayName: profile.displayName,
        orgName: row.orgName,
        kind: row.kind,
        followerCount: profile.followerCount,
      });
    }
    return out.slice(0, limit);
  },
});

// Topics / hashtags rail (§6): ordered by real usage counts.
export const topics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const tags = await ctx.db.query("hashtags").take(500);
    return tags
      .filter((t) => t.useCount > 0)
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, limit)
      .map((t) => ({ tag: t.tag, useCount: t.useCount }));
  },
});

// Note: trending *posts* are served by trending.list, which runs the full
// spoiler engine (assemble) before any body leaves the server. Discovery never
// exposes raw post bodies — a shortcut here would break the product's core
// promise (Spec §9, D-10).
