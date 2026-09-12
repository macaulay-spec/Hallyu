import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, requireViewer } from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { Doc, Id } from "./_generated/dataModel";

// User↔user follows (§12). Drama/actor follows live in onboarding.toggleFollow
// (they're the same follows table; user edges target profile ids).
export const toggleUserFollow = mutation({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "follow:toggle", viewer._id);

    const target = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!target) throw new ConvexError("NOT_FOUND");
    if (target._id === viewer._id) throw new ConvexError("CANNOT_FOLLOW_SELF");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) =>
        q.eq("followerId", viewer._id).eq("targetType", "user").eq("targetId", target._id)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(viewer._id, { followingCount: Math.max(0, viewer.followingCount - 1) });
      await ctx.db.patch(target._id, { followerCount: Math.max(0, target.followerCount - 1) });
      return { following: false };
    }
    await ctx.db.insert("follows", {
      followerId: viewer._id,
      targetType: "user",
      targetId: target._id,
      createdAt: Date.now(),
    });
    await ctx.db.patch(viewer._id, { followingCount: viewer.followingCount + 1 });
    await ctx.db.patch(target._id, { followerCount: target.followerCount + 1 });
    return { following: true };
  },
});

export const block = mutation({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const viewer = await requireViewer(ctx);
    const target = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!target || target._id === viewer._id) throw new ConvexError("NOT_FOUND");

    const existing = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) =>
        q.eq("blockerId", viewer._id).eq("blockedProfileId", target._id)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { blocked: false };
    }
    await ctx.db.insert("blocks", {
      blockerId: viewer._id,
      blockedProfileId: target._id,
      createdAt: Date.now(),
    });
    return { blocked: true };
  },
});

export const mute = mutation({
  args: {
    targetType: v.union(v.literal("user"), v.literal("drama"), v.literal("community")),
    targetId: v.string(),
  },
  handler: async (ctx, { targetType, targetId }) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("mutes")
      .withIndex("by_profile_target", (q) =>
        q.eq("profileId", viewer._id).eq("targetType", targetType).eq("targetId", targetId)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { muted: false };
    }
    await ctx.db.insert("mutes", { profileId: viewer._id, targetType, targetId, createdAt: Date.now() });
    return { muted: true };
  },
});

export const listFollowers = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!profile) return [];
    const edges = await ctx.db
      .query("follows")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "user").eq("targetId", profile._id)
      )
      .take(100);
    const users = [];
    for (const e of edges) {
      // user edges store profile id in targetId (string-encoded id)
      const p = await ctx.db.get(e.targetId as Id<"profiles">);
      if (p) users.push({ handle: p.handle, displayName: p.displayName, verified: p.verified });
    }
    return users;
  },
});

export const listFollowingUsers = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!profile) return [];
    const edges = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) =>
        q.eq("followerId", profile._id).eq("targetType", "user")
      )
      .take(100);
    const users = [];
    for (const e of edges) {
      const p = await ctx.db.get(e.targetId as Id<"profiles">);
      if (p) users.push({ handle: p.handle, displayName: p.displayName, verified: p.verified });
    }
    return users;
  },
});

// Viewer's relationship to a profile (follows? blocked?) for profile screens.
export const relationship = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    const viewer = await requireViewer(ctx);
    const target = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!target) return null;
    const followEdge = await ctx.db
      .query("follows")
      .withIndex("by_follower_target", (q) =>
        q.eq("followerId", viewer._id).eq("targetType", "user").eq("targetId", target._id)
      )
      .first();
    const blockEdge = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) =>
        q.eq("blockerId", viewer._id).eq("blockedProfileId", target._id)
      )
      .first();
    return {
      isSelf: target._id === viewer._id,
      following: !!followEdge,
      blocked: !!blockEdge,
      target: { handle: target.handle, displayName: target.displayName },
    };
  },
});
