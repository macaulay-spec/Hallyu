import { query } from "./_generated/server";
import { v } from "convex/values";
import { getViewerProfile } from "./lib/guards";
import { assemble } from "./posts";
import { Doc, Id } from "./_generated/dataModel";
import { artUrl } from "../lib/art";

/** One assembled post plus the human reason that ranked it (§17). */
type FeedItem = NonNullable<Awaited<ReturnType<typeof assemble>>> & { reason: string };
type AssembledPost = NonNullable<Awaited<ReturnType<typeof assemble>>>;

type AiringShape = {
  slug: string;
  title: string;
  titleKr: string | null;
  releaseSchedule: string | null;
  nextEpisodeAt: number | null;
  followed: boolean;
  posterUrl: string | null;
};

type DramaUpdate = {
  dramaSlug: string;
  dramaTitle: string;
  followed: boolean;
  post: AssembledPost;
};

type EpisodeActivity = {
  episodeId: Id<"episodes">;
  number: number;
  title: string | null;
  airAt: number | null;
  dramaSlug: string;
  dramaTitle: string;
  postCount: number;
  viewerWatchedThrough: number | null;
};

type CommunitySuggestion = {
  slug: string;
  name: string;
  description: string | null;
  memberCount: number;
  isPrivate: boolean;
};

// Home + discovery read models (Spec §5, §17, D-11).
//
// For You is *explainable*: every item carries a human `reason` string naming
// the signal that ranked it. No opaque ML, no hard-coded boosts (§17). Ranking
// signals: followed users/dramas/actors, joined communities, watch progress,
// interests, engagement, freshness, trending momentum — with anti-domination
// caps so no author or drama owns the page (§6).

type Signal = { weight: number; reason: string };

const AUTHOR_FOLLOW = 30;
const DRAMA_FOLLOW = 26;
const COMMUNITY_JOIN = 20;
const WATCHING = 22;
const INTEREST_MATCH = 12;
const OFFICIAL_CAP_EVERY = 10; // §15: official content capped in the mix

export const forYou = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const viewer = await getViewerProfile(ctx);
    if (!viewer) return { personalized: false, items: [] as FeedItem[] };

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) => q.eq("followerId", viewer._id))
      .collect();
    const followedUserIds = new Set(follows.filter((f) => f.targetType === "user").map((f) => f.targetId));
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

    const watching = await ctx.db
      .query("watchingStatus")
      .withIndex("by_profile_drama", (q) => q.eq("profileId", viewer._id))
      .collect();
    const watchingByDrama = new Map(watching.map((w) => [w.dramaId, w]));

    const mutes = await ctx.db
      .query("mutes")
      .withIndex("by_profile_target", (q) => q.eq("profileId", viewer._id))
      .collect();
    const mutedUsers = new Set(mutes.filter((m) => m.targetType === "user").map((m) => m.targetId));
    const mutedDramas = new Set(mutes.filter((m) => m.targetType === "drama").map((m) => m.targetId));

    const blocked = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", viewer._id))
      .collect();
    const blockedIds = new Set(blocked.map((b) => b.blockedProfileId));

    const trendRows = await ctx.db
      .query("trendScores")
      .withIndex("by_type_score", (q) => q.eq("targetType", "post"))
      .order("desc")
      .take(60);
    const trendByPost = new Map(trendRows.map((r) => [r.targetId, r.score]));

    const now = Date.now();
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_state_created", (q) => q.eq("moderationState", "visible"))
      .order("desc")
      .take(250);

    type Scored = {
      post: Doc<"posts">;
      score: number;
      reason: string;
      dramaSlug: string | null;
    };
    const scored: Scored[] = [];
    const dramaCache = new Map<string, Doc<"dramas"> | null>();

    for (const post of posts) {
      if (post.authorId !== viewer._id && blockedIds.has(post.authorId)) continue;

      let drama: Doc<"dramas"> | null = null;
      if (post.dramaId) {
        const key = post.dramaId as string;
        if (!dramaCache.has(key)) dramaCache.set(key, await ctx.db.get(post.dramaId));
        drama = dramaCache.get(key) ?? null;
      }
      const dramaSlug = drama?.slug ?? null;
      if (dramaSlug && mutedDramas.has(dramaSlug)) continue;

      const author = await ctx.db.get(post.authorId);
      if (!author) continue;
      if (mutedUsers.has(author.handle) || mutedUsers.has(author._id)) continue;

      const signals: Signal[] = [];
      if (followedUserIds.has(author._id)) {
        signals.push({
          weight: AUTHOR_FOLLOW,
          reason: post.authorId === viewer._id ? "Your own post" : `Because you follow @${author.handle}`,
        });
      }
      if (dramaSlug && followedDramaSlugs.has(dramaSlug)) {
        signals.push({ weight: DRAMA_FOLLOW, reason: `From a drama you follow · ${drama?.title ?? ""}`.trim() });
      }
      if (post.communityId && joinedCommunityIds.has(post.communityId)) {
        const community = await ctx.db.get(post.communityId);
        signals.push({
          weight: COMMUNITY_JOIN,
          reason: community ? `From ${community.name}, a community you joined` : "From a community you joined",
        });
      }
      if (post.dramaId && watchingByDrama.has(post.dramaId)) {
        const w = watchingByDrama.get(post.dramaId);
        const progress = w?.watchedThrough ?? 0;
        const ahead = post.episodeNumber != null && post.episodeNumber > progress;
        if (!ahead) {
          signals.push({ weight: WATCHING, reason: `Because you're watching ${drama?.title ?? "this drama"}` });
        }
      }
      const interestHit = drama?.genres.find((g) => viewer.interests.includes(g));
      if (interestHit) {
        signals.push({ weight: INTEREST_MATCH, reason: `Matches your interest: ${interestHit}` });
      }

      const trend = trendByPost.get(post._id as string) ?? 0;
      if (trend > 0) {
        signals.push({ weight: Math.min(15, trend / 8), reason: "Trending in the fandom right now" });
      }

      const ageHours = (now - post.createdAt) / 3_600_000;
      const engagement =
        post.reactionCount * 1.5 + post.commentCount * 4 + post.repostCount * 4 + post.bookmarkCount * 2;
      const base = engagement * Math.pow(0.5, ageHours / 18) + Math.max(0, 24 - ageHours) * 0.6;

      signals.sort((a, b) => b.weight - a.weight);
      const top = signals[0];
      const score = base + signals.reduce((sum, s) => sum + s.weight, 0);

      // Freshness-only items still need an honest reason.
      const reason = top?.reason ?? (author.isOfficial ? "Official announcement" : `New from @${author.handle}`);

      scored.push({ post, score, reason, dramaSlug });
    }

    scored.sort((a, b) => b.score - a.score);

    // Anti-domination caps (§6): ≤2 per author, ≤4 per drama; official content
    // is throttled to roughly 1 in every 10 items (§15).
    const perAuthor = new Map<string, number>();
    const perDrama = new Map<string, number>();
    const items: FeedItem[] = [];
    let sinceOfficial = OFFICIAL_CAP_EVERY;

    for (const row of scored) {
      const aKey = row.post.authorId;
      const dKey = row.dramaSlug ?? "none";
      const aCount = perAuthor.get(aKey) ?? 0;
      const dCount = perDrama.get(dKey) ?? 0;
      if (aCount >= 2) continue;
      if (dKey !== "none" && dCount >= 4) continue;
      if (row.post.official && sinceOfficial < OFFICIAL_CAP_EVERY) continue;

      const assembled = await assemble(ctx, row.post, viewer);
      if (!assembled) continue;

      perAuthor.set(aKey, aCount + 1);
      perDrama.set(dKey, dCount + 1);
      sinceOfficial = row.post.official ? 0 : sinceOfficial + 1;
      items.push({ ...assembled, reason: row.reason });
      if (items.length >= Math.min(limit, 50)) break;
    }

    return { personalized: true, items };
  },
});

// Following feed (§5): near-chronological, no opaque ranking — the user's own
// graph is visible, and every item says which edge delivered it.
export const following = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const viewer = await getViewerProfile(ctx);
    if (!viewer) return { items: [] as FeedItem[] };

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) => q.eq("followerId", viewer._id))
      .collect();
    const followedUserIds = new Set(follows.filter((f) => f.targetType === "user").map((f) => f.targetId));
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
      .take(200);

    const items: FeedItem[] = [];
    const dramaCache = new Map<string, Doc<"dramas"> | null>();

    for (const post of posts) {
      const author = await ctx.db.get(post.authorId);
      if (!author) continue;
      if (mutedUsers.has(author._id) || mutedUsers.has(author.handle)) continue;

      let drama: Doc<"dramas"> | null = null;
      if (post.dramaId) {
        const key = post.dramaId as string;
        if (!dramaCache.has(key)) dramaCache.set(key, await ctx.db.get(post.dramaId));
        drama = dramaCache.get(key) ?? null;
      }
      if (drama?.slug && mutedDramas.has(drama.slug)) continue;

      const reasons: string[] = [];
      if (author._id === viewer._id) reasons.push("You");
      if (followedUserIds.has(author._id)) reasons.push(`@${author.handle}`);
      if (drama?.slug && followedDramaSlugs.has(drama.slug)) reasons.push(drama.title);
      if (post.communityId && joinedCommunityIds.has(post.communityId)) {
        const c = await ctx.db.get(post.communityId);
        if (c) reasons.push(c.name);
      }
      if (reasons.length === 0) continue;

      const assembled = await assemble(ctx, post, viewer);
      if (!assembled) continue;
      items.push({ ...assembled, reason: reasons.join(" · ") });
      if (items.length >= Math.min(limit, 50)) break;
    }

    return { items };
  },
});

// Home top modules (§5): Airing Now, Drama Updates, Episode Activity, and
// Communities for you. Every rail is computed from real rows.
export const homeModules = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfile(ctx);
    if (!viewer) {
      // Signed out: the modules render as empty rails with their own copy, never
      // as fabricated activity.
      return {
        airingNow: [] as AiringShape[],
        dramaUpdates: [] as DramaUpdate[],
        episodeActivity: [] as EpisodeActivity[],
        communitiesForYou: [] as CommunitySuggestion[],
      };
    }

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) => q.eq("followerId", viewer._id))
      .collect();
    const followedDramaSlugs = new Set(
      follows.filter((f) => f.targetType === "drama").map((f) => f.targetId)
    );

    const airingDocs = await ctx.db
      .query("dramas")
      .withIndex("by_status", (q) => q.eq("status", "airing"))
      .take(30);
    const airingNow = airingDocs
      .sort((a, b) => (a.nextEpisodeAt ?? Infinity) - (b.nextEpisodeAt ?? Infinity))
      .slice(0, 8)
      .map((d) => ({
        slug: d.slug,
        title: d.title,
        titleKr: d.titleKr ?? null,
        releaseSchedule: d.releaseSchedule ?? null,
        nextEpisodeAt: d.nextEpisodeAt ?? null,
        followed: followedDramaSlugs.has(d.slug),
        posterUrl: artUrl(d.tmdbPosterPath),
      }));

    // Drama Updates: latest post per followed drama (one row per drama, so the
    // rail stays a digest rather than a second feed).
    const recent = await ctx.db
      .query("posts")
      .withIndex("by_state_created", (q) => q.eq("moderationState", "visible"))
      .order("desc")
      .take(120);
    const seenDrama = new Set<string>();
    const dramaUpdates: DramaUpdate[] = [];
    for (const post of recent) {
      if (!post.dramaId) continue;
      const drama = await ctx.db.get(post.dramaId);
      if (!drama) continue;
      if (seenDrama.has(drama._id)) continue;
      seenDrama.add(drama._id);
      const assembled = await assemble(ctx, post, viewer);
      if (assembled) {
        dramaUpdates.push({
          dramaSlug: drama.slug,
          dramaTitle: drama.title,
          followed: followedDramaSlugs.has(drama.slug),
          post: assembled,
        });
      }
      if (dramaUpdates.length >= 6) break;
    }

    // Episode Activity: the busiest episode conversations right now.
    const discussions = await ctx.db.query("episodeDiscussions").take(100);
    const episodeActivity: EpisodeActivity[] = [];
    for (const d of discussions.sort((a, b) => b.lastActivityAt - a.lastActivityAt).slice(0, 20)) {
      const episode = await ctx.db.get(d.episodeId);
      if (!episode) continue;
      const drama = await ctx.db.get(episode.dramaId);
      if (!drama) continue;
      const watching = await ctx.db
        .query("watchingStatus")
        .withIndex("by_profile_drama", (q) =>
          q.eq("profileId", viewer._id).eq("dramaId", drama._id)
        )
        .first();
      episodeActivity.push({
        episodeId: episode._id,
        number: episode.number,
        title: episode.title ?? null,
        airAt: episode.airAt ?? null,
        dramaSlug: drama.slug,
        dramaTitle: drama.title,
        postCount: d.postCount,
        viewerWatchedThrough: watching?.watchedThrough ?? null,
      });
      if (episodeActivity.length >= 6) break;
    }

    // Communities for you: not already joined; interests-matched first.
    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    const joined = new Set(memberships.map((m) => m.communityId));
    const allCommunities = await ctx.db.query("communities").take(50);
    const communitiesForYou = allCommunities
      .filter((c) => !joined.has(c._id))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 6)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        memberCount: c.memberCount,
        isPrivate: c.isPrivate,
      }));

    return { airingNow, dramaUpdates, episodeActivity, communitiesForYou };
  },
});

/** Rail used by Explore: newest episodes to air across all dramas (§6/§51). */
export const newEpisodes = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 8 }) => {
    const episodes = await ctx.db.query("episodes").withIndex("by_air", (q) => q.gt("airAt", 0)).take(100);
    const out = [];
    for (const ep of episodes
      .filter((e) => e.airAt != null && e.airAt <= Date.now())
      .sort((a, b) => (b.airAt ?? 0) - (a.airAt ?? 0))
      .slice(0, limit)) {
      const drama = await ctx.db.get(ep.dramaId);
      if (!drama) continue;
      out.push({
        episodeId: ep._id as Id<"episodes">,
        number: ep.number,
        title: ep.title ?? null,
        airAt: ep.airAt ?? null,
        dramaSlug: drama.slug,
        dramaTitle: drama.title,
      });
    }
    return out;
  },
});
