import { query } from "./_generated/server";
import { v } from "convex/values";
import { getViewerProfile } from "./lib/guards";
import { assemble } from "./posts";

// Entity-typed search (Spec §16). One entry point, grouped results, so the
// search screen can render Dramas / Actors / Users / Communities / Hashtags /
// Posts sections (and filter chips) from a single reactive query.
//
// Search indexes are used where the schema declares them; the two tables
// without one (hashtags, profiles) use a bounded scan with an explicit cap —
// honest about its limits rather than pretending to be a search engine.

const MAX = 12;

export const all = query({
  args: {
    q: v.string(),
    entity: v.optional(
      v.union(
        v.literal("all"),
        v.literal("dramas"),
        v.literal("actors"),
        v.literal("users"),
        v.literal("communities"),
        v.literal("hashtags"),
        v.literal("posts")
      )
    ),
  },
  handler: async (ctx, { q, entity = "all" }) => {
    const term = q.trim();
    const empty = { dramas: [], actors: [], users: [], communities: [], hashtags: [], posts: [] };
    if (term.length < 2) return empty;
    const viewer = await getViewerProfile(ctx);
    const wants = (e: string) => entity === "all" || entity === e;

    const lower = term.toLowerCase();

    const dramas = wants("dramas")
      ? (
          await ctx.db
            .query("dramas")
            .withSearchIndex("search_title", (s) => s.search("title", term))
            .take(MAX)
        ).map((d) => ({
          slug: d.slug,
          title: d.title,
          titleKr: d.titleKr ?? null,
          genres: d.genres,
          status: d.status,
          year: d.year ?? null,
          followerCount: d.followerCount,
        }))
      : [];

    const actors = wants("actors")
      ? (
          await ctx.db
            .query("actors")
            .withSearchIndex("search_name", (s) => s.search("name", term))
            .take(MAX)
        ).map((a) => ({ slug: a.slug, name: a.name, nameKr: a.nameKr ?? null, followerCount: a.followerCount }))
      : [];

    const communities = wants("communities")
      ? (
          await ctx.db
            .query("communities")
            .withSearchIndex("search_name", (s) => s.search("name", term))
            .take(MAX)
        ).map((c) => ({
          slug: c.slug,
          name: c.name,
          description: c.description ?? null,
          memberCount: c.memberCount,
          isPrivate: c.isPrivate,
        }))
      : [];

    // Users: profiles has no search index (handles are the identity), so this is
    // a bounded scan matched on handle OR display name.
    const users = wants("users")
      ? (await ctx.db.query("profiles").take(300))
          .filter(
            (p) => p.handle.includes(lower) || p.displayName.toLowerCase().includes(lower)
          )
          .slice(0, MAX)
          .map((p) => ({
            handle: p.handle,
            displayName: p.displayName,
            verified: p.verified,
            official: p.isOfficial,
            followerCount: p.followerCount,
          }))
      : [];

    // Hashtags: bounded scan (the table is small and append-only in practice).
    const hashtags = wants("hashtags")
      ? (await ctx.db.query("hashtags").take(500))
          .filter((h) => h.tag.includes(lower))
          .sort((a, b) => b.useCount - a.useCount)
          .slice(0, MAX)
          .map((h) => ({ tag: h.tag, useCount: h.useCount }))
      : [];

    const postDocs = wants("posts")
      ? await ctx.db
          .query("posts")
          .withSearchIndex("search_body", (s) =>
            s.search("body", term).eq("moderationState", "visible")
          )
          .take(MAX)
      : [];
    const posts = [];
    for (const post of postDocs) {
      const assembled = await assemble(ctx, post, viewer);
      if (assembled) posts.push(assembled);
    }

    return { dramas, actors, users, communities, hashtags, posts };
  },
});

// Search landing content (Spec §16): trending searches derived from real
// hashtag usage + followed drama volume, never an invented list.
export const trendingSearches = query({
  args: {},
  handler: async (ctx) => {
    const tags = await ctx.db.query("hashtags").take(500);
    const topTags = tags
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 6)
      .map((t) => ({ kind: "hashtag" as const, label: `#${t.tag}`, value: t.tag }));

    const dramas = await ctx.db.query("dramas").withIndex("by_status", (q) => q.eq("status", "airing")).take(20);
    const topDramas = dramas
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, 4)
      .map((d) => ({ kind: "drama" as const, label: d.title, value: d.title }));

    return [...topDramas, ...topTags];
  },
});

// Genre browsing (Spec §6/§51): Explore chips filter the drama rails.
export const genres = query({
  args: {},
  handler: async (ctx) => {
    const dramas = await ctx.db.query("dramas").take(200);
    const counts = new Map<string, number>();
    for (const d of dramas) {
      for (const g of d.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  },
});

export const byGenre = query({
  args: { genre: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { genre, limit = 20 }) => {
    const dramas = await ctx.db.query("dramas").take(200);
    return dramas
      .filter((d) => d.genres.includes(genre))
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, limit)
      .map((d) => ({
        slug: d.slug,
        title: d.title,
        titleKr: d.titleKr ?? null,
        genres: d.genres,
        status: d.status,
        year: d.year ?? null,
      }));
  },
});
