import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// Hallyu data model — implements the complete Spec §25 entity catalog.
// Foreign keys are v.id(...) references; SQL indexes become .index(...)
// declarations (D-02). Watch progress is explicit (§25A) because it drives
// spoiler safety; episode discussions are first-class (Spec §8).
const spoilerLevel = v.union(
  v.literal("none"),
  v.literal("episode"),
  v.literal("explicit")
);
const watchStatus = v.union(
  v.literal("watching"),
  v.literal("planning"),
  v.literal("completed"),
  v.literal("dropped"),
  v.literal("on_hold")
);
const postCategory = v.union(
  v.literal("reaction"),
  v.literal("discussion"),
  v.literal("theory"),
  v.literal("recommendation"),
  v.literal("meme"),
  v.literal("news"),
  v.literal("question"),
  v.literal("fan_content")
);
const moderationState = v.union(
  v.literal("visible"),
  v.literal("hidden"),
  v.literal("removed"),
  v.literal("pending_review")
);

export default defineSchema({
  ...authTables,

  // ---- Identity (Spec §25: users handled by auth provider; app data in profiles) ----
  profiles: defineTable({
    userId: v.id("users"),
    handle: v.string(),
    displayName: v.string(),
    avatarStorageId: v.optional(v.id("mediaObjects")),
    bio: v.optional(v.string()),
    isPrivate: v.boolean(),
    isOfficial: v.boolean(),
    verified: v.boolean(),
    interests: v.array(v.string()),
    spoilerPreference: v.union(
      v.literal("strict"),
      v.literal("balanced"),
      v.literal("relaxed")
    ),
    onboardingComplete: v.boolean(),
    followerCount: v.number(),
    followingCount: v.number(),
    postCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_handle", ["handle"]),

  // ---- Social graph (Spec §12) ----
  follows: defineTable({
    followerId: v.id("profiles"),
    targetType: v.union(v.literal("user"), v.literal("drama"), v.literal("actor")),
    targetId: v.string(), // profiles._id | dramas.slug | actors.slug (polymorphic edge, indexed)
    createdAt: v.number(),
  })
    .index("by_follower_target", ["followerId", "targetType", "targetId"])
    .index("by_target", ["targetType", "targetId"]),

  blocks: defineTable({
    blockerId: v.id("profiles"),
    blockedProfileId: v.id("profiles"),
    createdAt: v.number(),
  }).index("by_blocker", ["blockerId", "blockedProfileId"]),

  mutes: defineTable({
    profileId: v.id("profiles"),
    targetType: v.union(v.literal("user"), v.literal("drama"), v.literal("community")),
    targetId: v.string(),
    createdAt: v.number(),
  }).index("by_profile_target", ["profileId", "targetType", "targetId"]),

  // ---- Drama graph (Spec §7/§8/§23; fictional seed per D-05, TMDB sync later) ----
  dramas: defineTable({
    slug: v.string(),
    tmdbRef: v.optional(v.string()),
    title: v.string(),
    titleKr: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    status: v.union(v.literal("airing"), v.literal("upcoming"), v.literal("completed")),
    genres: v.array(v.string()),
    network: v.optional(v.string()),
    releaseSchedule: v.optional(v.string()),
    nextEpisodeAt: v.optional(v.number()),
    year: v.optional(v.number()),
    posterStorageId: v.optional(v.id("mediaObjects")),
    backdropStorageId: v.optional(v.id("mediaObjects")),
    followerCount: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["genres", "status"],
    }),

  episodes: defineTable({
    dramaId: v.id("dramas"),
    number: v.number(),
    title: v.optional(v.string()),
    synopsis: v.optional(v.string()),
    airAt: v.optional(v.number()),
    runtimeMinutes: v.optional(v.number()),
    discussionId: v.optional(v.id("episodeDiscussions")),
  })
    .index("by_drama_number", ["dramaId", "number"])
    .index("by_air", ["airAt"]),

  actors: defineTable({
    slug: v.string(),
    name: v.string(),
    nameKr: v.optional(v.string()),
    bio: v.optional(v.string()),
    photoStorageId: v.optional(v.id("mediaObjects")),
    followerCount: v.number(),
  })
    .index("by_slug", ["slug"])
    .searchIndex("search_name", { searchField: "name" }),

  dramaCast: defineTable({
    dramaId: v.id("dramas"),
    actorId: v.id("actors"),
    characterName: v.optional(v.string()),
    order: v.number(),
  }).index("by_drama_order", ["dramaId", "order"]),

  // ---- Watching / spoiler engine core (Spec §9, §13; §25A explicit progress) ----
  watchingStatus: defineTable({
    profileId: v.id("profiles"),
    dramaId: v.id("dramas"),
    status: watchStatus,
    watchedThrough: v.number(), // "watched through Ep X" — the spoiler engine input
    updatedAt: v.number(),
  })
    .index("by_profile_drama", ["profileId", "dramaId"])
    .index("by_drama", ["dramaId"]),

  watchedEpisodes: defineTable({
    profileId: v.id("profiles"),
    episodeId: v.id("episodes"),
    watchedAt: v.number(),
  })
    .index("by_profile_episode", ["profileId", "episodeId"])
    .index("by_profile", ["profileId"]),

  // ---- Posts (Spec §10) ----
  posts: defineTable({
    authorId: v.id("profiles"),
    category: postCategory,
    body: v.string(), // ≤5,000 chars enforced in mutation
    spoilerLevel: spoilerLevel,
    dramaId: v.optional(v.id("dramas")),
    episodeNumber: v.optional(v.number()),
    communityId: v.optional(v.id("communities")),
    repostOfId: v.optional(v.id("posts")),
    moderationState: moderationState,
    official: v.boolean(),
    reactionCount: v.number(),
    commentCount: v.number(),
    repostCount: v.number(),
    bookmarkCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_created", ["createdAt"])
    .index("by_state_created", ["moderationState", "createdAt"])
    .index("by_drama_state_created", ["dramaId", "moderationState", "createdAt"])
    .index("by_community_state_created", ["communityId", "moderationState", "createdAt"])
    .index("by_author_state_created", ["authorId", "moderationState", "createdAt"])
    .searchIndex("search_body", { searchField: "body", filterFields: ["moderationState"] }),

  postMedia: defineTable({
    postId: v.id("posts"),
    storageId: v.id("mediaObjects"),
    position: v.number(),
    altText: v.optional(v.string()),
  }).index("by_post_position", ["postId", "position"]),

  mediaObjects: defineTable({
    ownerId: v.id("profiles"),
    kind: v.union(v.literal("image"), v.literal("video")), // video schema-ready, not built (D-12)
    storageId: v.optional(v.string()),
    sha256: v.optional(v.string()),
    bytes: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    altText: v.optional(v.string()),
    moderationState: moderationState,
    transcodeState: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  hashtags: defineTable({
    tag: v.string(),
    useCount: v.number(),
  }).index("by_tag", ["tag"]),

  postHashtags: defineTable({
    postId: v.id("posts"),
    hashtagId: v.id("hashtags"),
  })
    .index("by_post", ["postId"])
    .index("by_hashtag", ["hashtagId"]),

  mentions: defineTable({
    postId: v.id("posts"),
    mentionedProfileId: v.id("profiles"),
  }).index("by_post", ["postId"]),

  // ---- Comments (Spec §11: 3-level nesting) ----
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("profiles"),
    parentCommentId: v.optional(v.id("comments")),
    depth: v.number(), // 0..2 => 3 levels
    body: v.string(),
    spoilerLevel: spoilerLevel,
    moderationState: moderationState,
    reactionCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_post_created", ["postId", "createdAt"])
    .index("by_post_state_created", ["postId", "moderationState", "createdAt"]),

  postReactions: defineTable({
    profileId: v.id("profiles"),
    postId: v.id("posts"),
    kind: v.union(
      v.literal("heart"),
      v.literal("fire"),
      v.literal("cry"),
      v.literal("laugh"),
      v.literal("shock"),
      v.literal("white_heart")
    ),
    createdAt: v.number(),
  }).index("by_post", ["postId", "profileId", "kind"]),

  commentReactions: defineTable({
    profileId: v.id("profiles"),
    commentId: v.id("comments"),
    kind: v.string(),
    createdAt: v.number(),
  }).index("by_comment", ["commentId", "profileId", "kind"]),

  reposts: defineTable({
    profileId: v.id("profiles"),
    postId: v.id("posts"),
    createdAt: v.number(),
  }).index("by_post", ["postId", "profileId"]),

  bookmarks: defineTable({
    profileId: v.id("profiles"),
    postId: v.id("posts"),
    createdAt: v.number(),
  }).index("by_profile_created", ["profileId", "createdAt"])
    .index("by_post", ["postId", "profileId"]),

  // ---- Communities (Spec §14) ----
  communities: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("mediaObjects")),
    bannerStorageId: v.optional(v.id("mediaObjects")),
    isPrivate: v.boolean(),
    memberCount: v.number(),
    createdBy: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .searchIndex("search_name", { searchField: "name" }),

  communityMembers: defineTable({
    communityId: v.id("communities"),
    profileId: v.id("profiles"),
    role: v.union(v.literal("owner"), v.literal("moderator"), v.literal("member")),
    state: v.union(v.literal("active"), v.literal("pending"), v.literal("banned")),
    joinedAt: v.number(),
  })
    .index("by_community_profile", ["communityId", "profileId"])
    .index("by_profile", ["profileId"]),

  communityRules: defineTable({
    communityId: v.id("communities"),
    position: v.number(),
    rule: v.string(),
  }).index("by_community_position", ["communityId", "position"]),

  // ---- Episode-first social model (Spec §8) ----
  episodeDiscussions: defineTable({
    episodeId: v.id("episodes"),
    postCount: v.number(),
    lastActivityAt: v.number(),
  }).index("by_episode", ["episodeId"]),

  // ---- Official content & verification (Spec §15; badge ≠ privilege, D-14) ----
  officialAccounts: defineTable({
    profileId: v.id("profiles"),
    orgName: v.string(),
    kind: v.union(
      v.literal("broadcaster"),
      v.literal("studio"),
      v.literal("publication"),
      v.literal("streamer"),
      v.literal("creator")
    ),
    verifiedBy: v.id("profiles"),
  }).index("by_profile", ["profileId"]),

  verificationRequests: defineTable({
    requesterId: v.id("profiles"),
    orgName: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    decidedBy: v.optional(v.id("profiles")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // ---- Notifications (Spec §18) ----
  notifications: defineTable({
    recipientId: v.id("profiles"),
    category: v.union(v.literal("critical"), v.literal("important"), v.literal("optional")),
    type: v.string(),
    payload: v.optional(v.string()), // JSON: deep-link route + context
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_recipient_created", ["recipientId", "createdAt"]),

  notificationPreferences: defineTable({
    profileId: v.id("profiles"),
    category: v.string(),
    enabled: v.boolean(),
    targetId: v.optional(v.string()), // per-drama / per-community override
    quietHoursStart: v.optional(v.number()),
    quietHoursEnd: v.optional(v.number()),
  }).index("by_profile", ["profileId", "category"]),

  // ---- Trust & safety (Spec §27; pipeline lands M5, schema now) ----
  reports: defineTable({
    reporterId: v.id("profiles"),
    targetType: v.union(v.literal("post"), v.literal("comment"), v.literal("user"), v.literal("community")),
    targetId: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    severity: v.optional(v.string()),
    aiClass: v.optional(v.string()),
    decidedBy: v.optional(v.id("profiles")),
    decidedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_status", ["status", "createdAt"]),

  moderationActions: defineTable({
    moderatorId: v.id("profiles"),
    targetType: v.string(),
    targetId: v.string(),
    action: v.string(),
    reportId: v.optional(v.id("reports")),
    createdAt: v.number(),
  }).index("by_target", ["targetType", "targetId"]),

  moderationLogs: defineTable({
    actorId: v.id("profiles"),
    event: v.string(),
    context: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  auditLogs: defineTable({
    actorId: v.optional(v.id("profiles")),
    event: v.string(),
    context: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  // ---- Trending (Spec §6; cron recompute lands M4, D-11) ----
  trendScores: defineTable({
    targetType: v.union(v.literal("post"), v.literal("drama"), v.literal("hashtag"), v.literal("episode")),
    targetId: v.string(),
    score: v.number(),
    windowStart: v.number(),
    computedAt: v.number(),
  }).index("by_type_score", ["targetType", "score"]),

  // ---- Analytics (Spec §33; D-16) ----
  analyticsEvents: defineTable({
    profileId: v.optional(v.id("profiles")),
    event: v.string(),
    context: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_event_created", ["event", "createdAt"]),

  // ---- Rate limiting (D-21; token bucket in-table, no Redis per §30) ----
  rateLimits: defineTable({
    key: v.string(), // identity + action class
    count: v.number(),
    windowStart: v.number(),
  }).index("by_key", ["key"]),

  // ---- Ops (M0 health probe) ----
  configStatus: defineTable({
    key: v.string(),
    configured: v.boolean(),
    note: v.string(),
    checkedAt: v.number(),
  }).index("by_key", ["key"]),
});
