import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer, getViewerProfile, requireCommunityModerator } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { notify } from "./lib/notify";
import { track } from "./onboarding";
import { assemble } from "./posts";
import { Doc, Id } from "./_generated/dataModel";

type FeedItem = NonNullable<Awaited<ReturnType<typeof assemble>>> & {
  pinned: boolean;
  locked: boolean;
};

// Communities (Spec §14, D-13). Public communities join instantly; private ones
// become a moderator-approved request. Moderator powers (pin, lock, hide,
// remove, ban, approve, edit rules) live here and NEVER imply platform powers
// (§14/§26) — that separation is enforced by requireCommunityModerator vs
// requirePlatformModerator in lib/guards.

export const list = query({
  args: {},
  handler: async (ctx) => {
    const communities = await ctx.db.query("communities").take(50);
    const viewer = await getViewerProfile(ctx);
    const memberships = viewer
      ? await ctx.db
          .query("communityMembers")
          .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
          .collect()
      : [];
    const byCommunity = new Map(memberships.map((m) => [m.communityId, m]));

    return communities
      .sort((a, b) => b.memberCount - a.memberCount)
      .map((c) => {
        const m = byCommunity.get(c._id);
        return {
          slug: c.slug,
          name: c.name,
          description: c.description ?? null,
          memberCount: c.memberCount,
          isPrivate: c.isPrivate,
          viewerState: m ? m.state : null,
        };
      });
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) return null;

    const viewer = await getViewerProfile(ctx);
    const membership = viewer
      ? await ctx.db
          .query("communityMembers")
          .withIndex("by_community_profile", (q) =>
            q.eq("communityId", community._id).eq("profileId", viewer._id)
          )
          .first()
      : null;

    const rules = await ctx.db
      .query("communityRules")
      .withIndex("by_community_position", (q) => q.eq("communityId", community._id))
      .collect();

    const active = membership?.state === "active";
    const isModerator =
      active && (membership?.role === "moderator" || membership?.role === "owner");

    const pendingRequests = isModerator
      ? await ctx.db
          .query("communityMembers")
          .withIndex("by_community_profile", (q) => q.eq("communityId", community._id))
          .collect()
      : [];

    return {
      _id: community._id,
      slug: community.slug,
      name: community.name,
      description: community.description ?? null,
      memberCount: community.memberCount,
      isPrivate: community.isPrivate,
      createdAt: community.createdAt,
      rules: rules.sort((a, b) => a.position - b.position).map((r) => r.rule),
      viewerState: membership?.state ?? null,
      viewerRole: membership?.role ?? null,
      isModerator,
      // Content is only readable by active members of a private community (§14).
      canReadContent: !community.isPrivate || active,
      pending: pendingRequests
        .filter((m) => m.state === "pending")
        .map((m) => ({ profileId: m.profileId, joinedAt: m.joinedAt })),
    };
  },
});

export const pendingMembers = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) return [];
    await requireCommunityModerator(ctx, community._id);
    const rows = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) => q.eq("communityId", community._id))
      .collect();
    const out = [];
    for (const row of rows.filter((r) => r.state === "pending")) {
      const profile = await ctx.db.get(row.profileId);
      if (profile) {
        out.push({
          _id: row._id,
          profileId: row.profileId,
          handle: profile.handle,
          displayName: profile.displayName,
          requestedAt: row.joinedAt,
        });
      }
    }
    return out;
  },
});

export const members = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) return [];
    const rows = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) => q.eq("communityId", community._id))
      .collect();
    const out = [];
    for (const row of rows.filter((r) => r.state === "active")) {
      const profile = await ctx.db.get(row.profileId);
      if (!profile) continue;
      out.push({
        handle: profile.handle,
        displayName: profile.displayName,
        verified: profile.verified,
        role: row.role,
        joinedAt: row.joinedAt,
      });
    }
    return out.sort((a, b) => (a.role === "member" ? 1 : 0) - (b.role === "member" ? 1 : 0));
  },
});

// Community feed: pinned posts first (announcements), then newest (§14).
export const feed = query({
  args: { slug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { slug, limit = 30 }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) return { canRead: false, items: [] as FeedItem[] };

    const viewer = await getViewerProfile(ctx);
    const membership = viewer
      ? await ctx.db
          .query("communityMembers")
          .withIndex("by_community_profile", (q) =>
            q.eq("communityId", community._id).eq("profileId", viewer._id)
          )
          .first()
      : null;
    const active = membership?.state === "active";
    if (community.isPrivate && !active) return { canRead: false, items: [] };

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_community_state_created", (q) =>
        q.eq("communityId", community._id).eq("moderationState", "visible")
      )
      .order("desc")
      .take(Math.min(limit, 50));

    const assembled: FeedItem[] = [];
    for (const post of posts) {
      const row = await assemble(ctx, post, viewer);
      if (row) assembled.push({ ...row, pinned: post.pinned ?? false, locked: post.locked ?? false });
    }
    assembled.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return { canRead: true, items: assembled };
  },
});

export const join = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "community:join", viewer._id);
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) =>
        q.eq("communityId", community._id).eq("profileId", viewer._id)
      )
      .first();
    if (existing?.state === "banned") throw new ConvexError("FORBIDDEN");
    if (existing?.state === "active") return { state: "active" as const };
    if (existing?.state === "pending") return { state: "pending" as const };

    const state = community.isPrivate ? ("pending" as const) : ("active" as const);
    if (existing) await ctx.db.patch(existing._id, { state, joinedAt: Date.now() });
    else
      await ctx.db.insert("communityMembers", {
        communityId: community._id,
        profileId: viewer._id,
        role: "member",
        state,
        joinedAt: Date.now(),
      });

    if (state === "active") {
      await ctx.db.patch(community._id, { memberCount: community.memberCount + 1 });
      await notify(ctx, {
        recipientId: community.createdBy,
        category: "optional",
        type: "community_member_joined",
        route: `/community/${community.slug}`,
        targetId: community.slug,
        text: `@${viewer.handle} joined ${community.name}`,
      });
    }
    await track(ctx, viewer._id, "community_joined", community.slug);
    return { state };
  },
});

export const leave = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const viewer = await requireViewer(ctx);
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) throw new ConvexError("NOT_FOUND");
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) =>
        q.eq("communityId", community._id).eq("profileId", viewer._id)
      )
      .first();
    if (!membership) return { state: null };
    if (membership.role === "owner") throw new ConvexError("OWNER_CANNOT_LEAVE");
    const wasActive = membership.state === "active";
    await ctx.db.delete(membership._id);
    if (wasActive) {
      await ctx.db.patch(community._id, { memberCount: Math.max(0, community.memberCount - 1) });
    }
    return { state: null };
  },
});

export const decideRequest = mutation({
  args: { slug: v.string(), profileId: v.id("profiles"), approve: v.boolean() },
  handler: async (ctx, { slug, profileId, approve }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) throw new ConvexError("NOT_FOUND");
    await requireCommunityModerator(ctx, community._id);

    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) =>
        q.eq("communityId", community._id).eq("profileId", profileId)
      )
      .first();
    if (!membership || membership.state !== "pending") throw new ConvexError("NOT_FOUND");

    if (approve) {
      await ctx.db.patch(membership._id, { state: "active", joinedAt: Date.now() });
      await ctx.db.patch(community._id, { memberCount: community.memberCount + 1 });
    } else {
      await ctx.db.delete(membership._id);
    }

    await notify(ctx, {
      recipientId: profileId,
      category: "important",
      type: approve ? "community_request_approved" : "community_request_declined",
      route: `/community/${community.slug}`,
      targetId: community.slug,
      text: approve
        ? `Your request to join ${community.name} was approved`
        : `Your request to join ${community.name} was declined`,
    });
    return { approved: approve };
  },
});

export const setMemberRole = mutation({
  args: {
    slug: v.string(),
    profileId: v.id("profiles"),
    role: v.union(v.literal("moderator"), v.literal("member")),
  },
  handler: async (ctx, { slug, profileId, role }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) throw new ConvexError("NOT_FOUND");
    const actor = await requireCommunityModerator(ctx, community._id);
    if (actor.role !== "owner") throw new ConvexError("FORBIDDEN");

    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) =>
        q.eq("communityId", community._id).eq("profileId", profileId)
      )
      .first();
    if (!membership || membership.role === "owner") throw new ConvexError("NOT_FOUND");
    await ctx.db.patch(membership._id, { role });
    return { role };
  },
});

export const banMember = mutation({
  args: { slug: v.string(), profileId: v.id("profiles") },
  handler: async (ctx, { slug, profileId }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) throw new ConvexError("NOT_FOUND");
    const actor = await requireCommunityModerator(ctx, community._id);
    if (profileId === actor.profileId) throw new ConvexError("FORBIDDEN");

    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_profile", (q) =>
        q.eq("communityId", community._id).eq("profileId", profileId)
      )
      .first();
    if (membership?.role === "owner") throw new ConvexError("FORBIDDEN");

    const wasActive = membership?.state === "active";
    if (membership) await ctx.db.patch(membership._id, { state: "banned" });
    else
      await ctx.db.insert("communityMembers", {
        communityId: community._id,
        profileId,
        role: "member",
        state: "banned",
        joinedAt: Date.now(),
      });
    if (wasActive) {
      await ctx.db.patch(community._id, { memberCount: Math.max(0, community.memberCount - 1) });
    }
    await ctx.db.insert("moderationActions", {
      moderatorId: actor.profileId,
      targetType: "community_member",
      targetId: `${community.slug}:${profileId}`,
      action: "ban",
      createdAt: Date.now(),
    });
    await ctx.db.insert("moderationLogs", {
      actorId: actor.profileId,
      event: "community_member_banned",
      context: JSON.stringify({ community: community.slug, profileId }),
      createdAt: Date.now(),
    });
    return { banned: true };
  },
});

export const setRules = mutation({
  args: { slug: v.string(), rules: v.array(v.string()) },
  handler: async (ctx, { slug, rules }) => {
    const community = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!community) throw new ConvexError("NOT_FOUND");
    await requireCommunityModerator(ctx, community._id);

    const existing = await ctx.db
      .query("communityRules")
      .withIndex("by_community_position", (q) => q.eq("communityId", community._id))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    let position = 0;
    for (const rule of rules.slice(0, 15)) {
      const text = rule.trim();
      if (!text) continue;
      await ctx.db.insert("communityRules", { communityId: community._id, position, rule: text.slice(0, 300) });
      position += 1;
    }
    return { rules: position };
  },
});

// ---- Moderator actions on posts (§14) ----
export const moderatePost = mutation({
  args: {
    postId: v.id("posts"),
    action: v.union(
      v.literal("pin"),
      v.literal("unpin"),
      v.literal("lock"),
      v.literal("unlock"),
      v.literal("hide"),
      v.literal("restore"),
      v.literal("remove")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { postId, action, note }) => {
    const post = await ctx.db.get(postId);
    if (!post) throw new ConvexError("NOT_FOUND");
    if (!post.communityId) throw new ConvexError("NOT_FOUND");
    const community = await ctx.db.get(post.communityId);
    if (!community) throw new ConvexError("NOT_FOUND");
    const actor = await requireCommunityModerator(ctx, community._id);

    const patch: Partial<Doc<"posts">> = {};
    if (action === "pin") patch.pinned = true;
    if (action === "unpin") patch.pinned = false;
    if (action === "lock") patch.locked = true;
    if (action === "unlock") patch.locked = false;
    if (action === "hide") patch.moderationState = "hidden";
    if (action === "restore") patch.moderationState = "visible";
    if (action === "remove") patch.moderationState = "removed";
    await ctx.db.patch(postId, patch);

    await ctx.db.insert("moderationActions", {
      moderatorId: actor.profileId,
      targetType: "post",
      targetId: postId,
      action,
      createdAt: Date.now(),
    });
    await ctx.db.insert("moderationLogs", {
      actorId: actor.profileId,
      event: `community_post_${action}`,
      context: JSON.stringify({ community: community.slug, postId, note: note ?? null }),
      createdAt: Date.now(),
    });

    // The author always learns about a moderation action on their own post (§14/§27).
    if (action === "hide" || action === "remove") {
      await notify(ctx, {
        recipientId: post.authorId,
        category: "important",
        type: "moderation_action",
        route: `/post/${postId}`,
        targetId: community.slug,
        text:
          action === "remove"
            ? `Your post in ${community.name} was removed by a moderator`
            : `Your post in ${community.name} was hidden pending review`,
      });
    }
    return { action };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    rules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { name, description, isPrivate, rules }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "community:create", viewer._id);

    const clean = name.trim();
    if (clean.length < 3) throw new ConvexError("NAME_TOO_SHORT");
    const slug = clean
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    if (!slug) throw new ConvexError("NAME_INVALID");

    const existing = await ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new ConvexError("SLUG_TAKEN");

    const now = Date.now();
    const communityId = await ctx.db.insert("communities", {
      slug,
      name: clean.slice(0, 60),
      description: description?.slice(0, 500),
      isPrivate,
      memberCount: 1,
      createdBy: viewer._id,
      createdAt: now,
    });
    await ctx.db.insert("communityMembers", {
      communityId,
      profileId: viewer._id,
      role: "owner",
      state: "active",
      joinedAt: now,
    });
    let position = 0;
    for (const rule of (rules ?? []).slice(0, 15)) {
      const text = rule.trim();
      if (!text) continue;
      await ctx.db.insert("communityRules", { communityId, position, rule: text.slice(0, 300) });
      position += 1;
    }
    await track(ctx, viewer._id, "community_created", slug);
    return { slug };
  },
});
