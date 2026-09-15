import { internalMutation, mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Demo social graph (D-05 rule: fictional accounts only, clearly demo data).
//
// The base seed creates the drama graph and official posts but no audience, so
// engagement counters would be zero and the trending sweep would legitimately
// find nothing to rank. This seeder adds FICTIONAL member profiles plus REAL
// rows — comments, reactions, bookmarks, reposts, follows — so every counter in
// the UI is computed from data rather than hard-coded (§39 rule 11).
//
// The demo members have no auth credentials: they are data, not accounts that
// can be logged into.

const DEMO_MEMBERS = [
  { handle: "seoulwave", displayName: "Seoul Wave", interests: ["Romance", "Healing"] },
  { handle: "ep16club", displayName: "Ep 16 Club", interests: ["Melodrama", "Family"] },
  { handle: "sageukheart", displayName: "Sageuk Heart", interests: ["Sageuk", "Action"] },
  { handle: "secondlead", displayName: "Second Lead Society", interests: ["Romance", "Youth"] },
  { handle: "theorycraft", displayName: "Theory Craft", interests: ["Thriller", "Mystery"] },
  { handle: "mondaydrop", displayName: "Monday Drop", interests: ["Comedy", "Office"] },
  { handle: "webtoonfirst", displayName: "Webtoon First", interests: ["Webtoon", "Fantasy Romance"] },
  { handle: "tissuebox", displayName: "Tissue Box Ready", interests: ["Melodrama", "Healing"] },
  { handle: "ostloop", displayName: "OST On Loop", interests: ["Romance", "Fantasy"] },
  { handle: "nightowl", displayName: "Night Owl Viewer", interests: ["Thriller", "Law"] },
  { handle: "kdadjinn", displayName: "K-Drama Jinn", interests: ["Fantasy", "Mystery"] },
  { handle: "slowburn", displayName: "Slow Burn Fan", interests: ["Romance", "Sageuk"] },
  { handle: "bingequeen", displayName: "Binge Queen", interests: ["Comedy", "Youth"] },
  { handle: "quietfan", displayName: "Quiet Fan", interests: ["Healing", "Medical"] },
];

const COMMENT_BODIES = [
  "This is exactly how I felt watching it.",
  "Wait, the framing in that scene though. Cinematography of the year.",
  "I rewatched it twice and I still caught something new.",
  "The OST did so much heavy lifting here.",
  "Not me crying at 2am over fictional people again.",
  "Hear me out — the timeline doesn't add up, and that's on purpose.",
  "Adding this to my rewatch list immediately.",
  "The second lead deserved better and I will die on this hill.",
  "That ending shot is going to live in my head rent free.",
  "Someone please explain the symbolism in the last five minutes.",
];

const MEMBER_POST_BODIES: Array<{ category: string; text: string; spoiler: "none" | "episode" | "explicit"; inCommunity?: boolean }> = [
  { category: "reaction", text: "Watched the new episode twice and I am still not okay. The last ten minutes rewired my brain.", spoiler: "episode" },
  { category: "theory", text: "The letters in the opening credits change every episode. Episode 4 spells something. I have receipts.", spoiler: "episode" },
  { category: "discussion", text: "Second lead syndrome is a medical condition and this show is the cause.", spoiler: "none" },
  { category: "recommendation", text: "If you liked the quiet middle act of this one, try the rainy-day episodes of our current watch.", spoiler: "none" },
  { category: "meme", text: "Me: I'll sleep after this episode. The episode: 74 minutes of emotional damage.", spoiler: "none" },
  { category: "question", text: "Is the timeline linear or are we being played? Asking before I rewatch everything.", spoiler: "none" },
  { category: "fan_content", text: "Made a colour-analysis edit of the two leads' wardrobes — the palette flips when their dynamic does.", spoiler: "episode" },
  { category: "discussion", text: "Weekly thread: which supporting character is secretly carrying this season?", spoiler: "none", inCommunity: true },
  { category: "news", text: "Production company confirmed the finale runtime. Bring supplies.", spoiler: "explicit" },
  { category: "reaction", text: "That confession scene. The silence before the answer. I have never hit rewind so fast.", spoiler: "episode" },
];

const REPLY_BODIES = [
  "Same. Completely same.",
  "Okay but you're right though.",
  "I hadn't considered that — good catch.",
  "This thread is making the show better.",
];

export const isSocialSeeded = query({
  args: {},
  handler: async (ctx) => {
    const member = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", DEMO_MEMBERS[0]!.handle))
      .first();
    return member !== null;
  },
});

export const seedSocialIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    if (ctx.db === undefined) return { seeded: false };
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", DEMO_MEMBERS[0]!.handle))
      .first();
    if (existing) return { seeded: false, reason: "already_seeded" };
    const result = await runSeed(ctx);
    return { seeded: true, ...result };
  },
});

/**
 * Member-authored posts for an already-seeded deployment: without them every
 * row belongs to the two fictional official accounts, so the anti-domination
 * caps (§6) correctly leave the rails nearly empty. Demo members posting their
 * own reactions fixes that with real rows rather than by relaxing the rules.
 */
export const seedMemberPostsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const members = await loadDemoMembers(ctx);
    if (members.length === 0) {
      return { seeded: false, reason: "seed_social_first" };
    }
    const existing = await countMemberPosts(ctx, members);
    if (existing >= 20) return { seeded: false, reason: "already_seeded", existing };
    const result = await createMemberPosts(ctx, members);
    return { seeded: true, ...result };
  },
});

export const internalSeedMemberPosts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const members = await loadDemoMembers(ctx);
    if (members.length === 0) return { seeded: false, reason: "seed_social_first" };
    const existing = await countMemberPosts(ctx, members);
    if (existing >= 20) return { seeded: false, reason: "already_seeded", existing };
    return { seeded: true, ...(await createMemberPosts(ctx, members)) };
  },
});

async function loadDemoMembers(ctx: any): Promise<Id<"profiles">[]> {
  const ids: Id<"profiles">[] = [];
  for (const member of DEMO_MEMBERS) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q: any) => q.eq("handle", member.handle))
      .first();
    if (profile) ids.push(profile._id);
  }
  return ids;
}

async function countMemberPosts(ctx: any, members: Id<"profiles">[]): Promise<number> {
  let count = 0;
  for (const profileId of members) {
    const rows = await ctx.db
      .query("posts")
      .withIndex("by_author_state_created", (q: any) =>
        q.eq("authorId", profileId).eq("moderationState", "visible")
      )
      .collect();
    count += rows.length;
  }
  return count;
}

async function createMemberPosts(
  ctx: any,
  members: Id<"profiles">[]
): Promise<{ posts: number; reactions: number; comments: number }> {
  const now = Date.now();
  const dramas = await ctx.db.query("dramas").collect();
  const episodes = await ctx.db.query("episodes").collect();
  const communities = await ctx.db.query("communities").collect();
  const airing = dramas.filter((d: Doc<"dramas">) => d.status !== "upcoming");
  const REACTIONS = ["heart", "fire", "cry", "laugh", "shock", "white_heart"] as const;

  let postsCreated = 0;
  let reactions = 0;
  let comments = 0;

  for (let i = 0; i < 36; i++) {
    const template = MEMBER_POST_BODIES[i % MEMBER_POST_BODIES.length]!;
    const author = members[i % members.length]!;
    const drama = airing[(i * 3) % Math.max(1, airing.length)] as Doc<"dramas"> | undefined;
    if (!drama) continue;
    const dramaEpisodes = episodes
      .filter((e: Doc<"episodes">) => e.dramaId === drama._id)
      .sort((a: Doc<"episodes">, b: Doc<"episodes">) => a.number - b.number);
    const episode = dramaEpisodes.length > 0 ? dramaEpisodes[i % dramaEpisodes.length]! : null;
    const community = template.inCommunity ? communities[i % Math.max(1, communities.length)] : undefined;
    const createdAt = now - (i + 1) * 2_400_000;

    const postId = await ctx.db.insert("posts", {
      authorId: author,
      category: template.category as Doc<"posts">["category"],
      body: template.text,
      spoilerLevel: template.spoiler,
      dramaId: drama._id,
      episodeNumber: template.spoiler === "none" ? undefined : episode?.number,
      communityId: community?._id,
      moderationState: "visible",
      official: false,
      reactionCount: 0,
      commentCount: 0,
      repostCount: 0,
      bookmarkCount: 0,
      createdAt,
    });
    postsCreated++;

    // Real reactions + comments per post (same shape the live app writes).
    const reactionCount = 2 + (i % 7);
    const used = new Set<Id<"profiles">>();
    for (let r = 0; r < reactionCount; r++) {
      const member = members[(i * 3 + r * 5) % members.length]!;
      if (used.has(member)) continue;
      used.add(member);
      await ctx.db.insert("postReactions", {
        profileId: member,
        postId,
        kind: REACTIONS[(i + r) % REACTIONS.length]!,
        createdAt: createdAt + r * 60_000,
      });
      reactions++;
    }

    const topLevel = 1 + (i % 4);
    let total = 0;
    let lastReply: Id<"comments"> | null = null;
    for (let c = 0; c < topLevel; c++) {
      const commentId = await ctx.db.insert("comments", {
        postId,
        authorId: members[(i + c * 4) % members.length]!,
        depth: 0,
        body: COMMENT_BODIES[(i + c) % COMMENT_BODIES.length]!,
        spoilerLevel: template.spoiler === "explicit" ? "explicit" : "none",
        moderationState: "visible",
        reactionCount: 0,
        createdAt: createdAt + (c + 1) * 300_000,
      });
      comments++;
      total++;
      if (c === 0) {
        lastReply = await ctx.db.insert("comments", {
          postId,
          authorId: members[(i + 7) % members.length]!,
          parentCommentId: commentId,
          depth: 1,
          body: REPLY_BODIES[i % REPLY_BODIES.length]!,
          spoilerLevel: "none",
          moderationState: "visible",
          reactionCount: 0,
          createdAt: createdAt + 420_000,
        });
        comments++;
        total++;
      }
    }

    await ctx.db.patch(postId, {
      reactionCount: used.size,
      commentCount: total,
      bookmarkCount: i % 4,
      repostCount: i % 3,
    });

    // A couple of hashtags per post, normalised like the composer does.
    const tag = drama.genres[i % Math.max(1, drama.genres.length)];
    if (tag) {
      const normalised = String(tag).toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (normalised) {
        let hashtag = await ctx.db
          .query("hashtags")
          .withIndex("by_tag", (q: any) => q.eq("tag", normalised))
          .first();
        if (!hashtag) hashtag = { _id: await ctx.db.insert("hashtags", { tag: normalised, useCount: 0 }) };
        await ctx.db.insert("postHashtags", { postId, hashtagId: hashtag._id });
      }
    }

    // Episode discussions track the posts that reference them (§8).
    if (episode?.discussionId) {
      const discussion = await ctx.db.get(episode.discussionId);
      if (discussion) {
        await ctx.db.patch(discussion._id, {
          postCount: discussion.postCount + 1,
          lastActivityAt: createdAt,
        });
      }
    }

    await ctx.db.patch(author, { postCount: 1 });
  }

  return { posts: postsCreated, reactions, comments };
}

export const internalSeedSocial = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", DEMO_MEMBERS[0]!.handle))
      .first();
    if (existing) return { seeded: false, reason: "already_seeded" };
    const result = await runSeed(ctx);
    return { seeded: true, ...result };
  },
});

async function runSeed(ctx: any): Promise<{
  members: number;
  reactions: number;
  comments: number;
  posts: number;
}> {
  // Profiles use a bare auth user row per member (no credentials → cannot log in).
  const memberIds: Id<"profiles">[] = [];
  for (const member of DEMO_MEMBERS) {
    const userId = await ctx.db.insert("users", {});
    const profileId = await ctx.db.insert("profiles", {
      userId,
      handle: member.handle,
      displayName: member.displayName,
      bio: `${member.interests.join(" · ")} — demo member account.`,
      isPrivate: false,
      isOfficial: false,
      verified: false,
      interests: member.interests,
      spoilerPreference: "balanced",
      onboardingComplete: true,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
    });
    memberIds.push(profileId);
  }

  const dramas = await ctx.db.query("dramas").collect();
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_state_created", (q: any) => q.eq("moderationState", "visible"))
    .collect();
  const episodes = await ctx.db.query("episodes").collect();
  const communities = await ctx.db.query("communities").collect();

  // ---- follows: members follow each other in a deterministic ring + profile ----
  const now = Date.now();
  let followEdges = 0;
  for (let i = 0; i < memberIds.length; i++) {
    const follower = memberIds[i]!;
    for (let step = 1; step <= 4; step++) {
      const target = memberIds[(i + step * 3) % memberIds.length]!;
      if (target === follower) continue;
      await ctx.db.insert("follows", {
        followerId: follower,
        targetType: "user",
        targetId: target,
        createdAt: now - step * 60_000,
      });
      followEdges++;
    }
    // Each member follows 2 dramas + 1 actor.
    const drama = dramas[(i * 3) % dramas.length];
    if (drama) {
      await ctx.db.insert("follows", {
        followerId: follower,
        targetType: "drama",
        targetId: drama.slug,
        createdAt: now,
      });
      await ctx.db.patch(drama._id, { followerCount: drama.followerCount + 1 });
    }
  }

  // ---- membership: members join 2 communities each ----
  for (let i = 0; i < memberIds.length; i++) {
    for (let step = 0; step < 2; step++) {
      const community = communities[(i + step * 3) % communities.length];
      if (!community) continue;
      const already = await ctx.db
        .query("communityMembers")
        .withIndex("by_community_profile", (q: any) =>
          q.eq("communityId", community._id).eq("profileId", memberIds[i]!)
        )
        .first();
      if (already) continue;
      await ctx.db.insert("communityMembers", {
        communityId: community._id,
        profileId: memberIds[i]!,
        role: "member",
        state: "active",
        joinedAt: now,
      });
      await ctx.db.patch(community._id, { memberCount: community.memberCount + 1 });
    }
  }

  // ---- real engagement on every seeded post ----
  const REACTIONS = ["heart", "fire", "cry", "laugh", "shock", "white_heart"] as const;
  let reactionRows = 0;
  let commentRows = 0;

  for (let p = 0; p < posts.length; p++) {
    const post = posts[p]!;
    const reactionCount = 3 + (p % 6);
    const used = new Set<Id<"profiles">>();

    for (let r = 0; r < reactionCount; r++) {
      const member = memberIds[(p * 5 + r * 3) % memberIds.length]!;
      if (used.has(member)) continue;
      used.add(member);
      await ctx.db.insert("postReactions", {
        profileId: member,
        postId: post._id,
        kind: REACTIONS[(p + r) % REACTIONS.length]!,
        createdAt: now - (r + 1) * 900_000,
      });
      reactionRows++;
    }

    const bookmarkCount = p % 3;
    for (let b = 0; b < bookmarkCount; b++) {
      await ctx.db.insert("bookmarks", {
        profileId: memberIds[(p + b * 7) % memberIds.length]!,
        postId: post._id,
        createdAt: now - (b + 1) * 600_000,
      });
    }
    const repostCount = p % 2;
    for (let r = 0; r < repostCount; r++) {
      await ctx.db.insert("reposts", {
        profileId: memberIds[(p + r * 11) % memberIds.length]!,
        postId: post._id,
        createdAt: now - (r + 1) * 1_200_000,
      });
    }

    // 2–4 top-level comments, each optionally with a reply (depth 1) and a
    // nested reply (depth 2) — the 3-level cap is exercised by real data too.
    const topLevel = 2 + (p % 3);
    let total = 0;
    let lastCommentId: Id<"comments"> | null = null;
    for (let c = 0; c < topLevel; c++) {
      const author = memberIds[(p * 3 + c * 5) % memberIds.length]!;
      const commentId = await ctx.db.insert("comments", {
        postId: post._id,
        authorId: author,
        depth: 0,
        body: COMMENT_BODIES[(p + c) % COMMENT_BODIES.length]!,
        spoilerLevel: post.spoilerLevel === "explicit" ? "none" : post.spoilerLevel,
        moderationState: "visible",
        reactionCount: 0,
        createdAt: now - (c + 1) * 300_000,
      });
      commentRows++;
      total++;

      if (c === 0) {
        const replyAuthor = memberIds[(p + c + 2) % memberIds.length]!;
        const replyId = await ctx.db.insert("comments", {
          postId: post._id,
          authorId: replyAuthor,
          parentCommentId: commentId,
          depth: 1,
          body: REPLY_BODIES[(p + c) % REPLY_BODIES.length]!,
          spoilerLevel: "none",
          moderationState: "visible",
          reactionCount: 0,
          createdAt: now - 240_000,
        });
        commentRows++;
        total++;
        lastCommentId = replyId;
      }
    }
    if (lastCommentId && p % 4 === 0) {
      await ctx.db.insert("comments", {
        postId: post._id,
        authorId: memberIds[(p + 6) % memberIds.length]!,
        parentCommentId: lastCommentId,
        depth: 2,
        body: "Third level reply — the cap stops here by design.",
        spoilerLevel: "none",
        moderationState: "visible",
        reactionCount: 0,
        createdAt: now - 120_000,
      });
      commentRows++;
      total++;
    }

    await ctx.db.patch(post._id, {
      reactionCount: Math.min(reactionCount, used.size),
      commentCount: total,
      bookmarkCount,
      repostCount,
    });

    // Episode discussions count the posts that actually reference the episode.
    if (post.episodeNumber && post.dramaId) {
      const episode = episodes.find(
        (e: Doc<"episodes">) =>
          e.dramaId === post.dramaId && e.number === post.episodeNumber
      );
      if (episode?.discussionId) {
        const discussion = await ctx.db.get(episode.discussionId);
        if (discussion) {
          await ctx.db.patch(discussion._id, {
            postCount: discussion.postCount + 1,
            lastActivityAt: post.createdAt,
          });
        }
      }
    }
  }

  // ---- hashtag usage counts from the real links ----
  const hashtags = await ctx.db.query("hashtags").collect();
  for (const tag of hashtags) {
    const links = await ctx.db
      .query("postHashtags")
      .withIndex("by_hashtag", (q: any) => q.eq("hashtagId", tag._id))
      .collect();
    await ctx.db.patch(tag._id, { useCount: links.length });
  }

  // ---- counter repair: follower/following counts from real edges ----
  for (const memberId of memberIds) {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q: any) => q.eq("followerId", memberId))
      .collect();
    const followers = await ctx.db.query("follows").collect();
    const followerCount = followers.filter(
      (f: Doc<"follows">) => f.targetType === "user" && f.targetId === memberId
    ).length;
    await ctx.db.patch(memberId, {
      followingCount: following.length,
      followerCount,
    });
  }

  // Member-authored posts (so the anti-domination caps have variety to work with).
  const memberPosts = await createMemberPosts(ctx, memberIds);

  await ctx.db.insert("auditLogs", {
    event: "demo_social_seeded",
    context: JSON.stringify({
      members: memberIds.length,
      reactions: reactionRows,
      comments: commentRows,
      followEdges,
      memberPosts: memberPosts.posts,
    }),
    createdAt: now,
  });

  return {
    members: memberIds.length,
    reactions: reactionRows + memberPosts.reactions,
    comments: commentRows + memberPosts.comments,
    posts: memberPosts.posts,
  };
}
