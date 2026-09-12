import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError, getViewerProfile, requireViewer, validateHandle } from "./lib/guards";
import { getAuthUserId } from "@convex-dev/auth/server";
import { MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Idempotently create the app profile for the signed-in auth user. Called on
// first authenticated load; safe to call every time. Own profile only.
export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await getAuthUserId(ctx);
    if (!authUser) throw new ConvexError("AUTH_REQUIRED");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", authUser))
      .first();
    if (existing) return existing._id;

    const email = (await getEmail(ctx)) ?? "member";
    const base = email.split("@")[0]?.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "fan";
    let handle = base.slice(0, 20);
    let n = 0;
    // Uniqueness loop: short, indexed lookups; collision fallback adds digits.
    while (await handleTaken(ctx, handle)) {
      n += 1;
      handle = `${base.slice(0, 16)}${n}`;
      if (n > 50) throw new ConvexError("HANDLE_GENERATION_FAILED");
    }

    return await ctx.db.insert("profiles", {
      userId: authUser,
      handle,
      displayName: base,
      isPrivate: false,
      isOfficial: false,
      verified: false,
      interests: [],
      spoilerPreference: "balanced", // owner default #2
      onboardingComplete: false,
      followerCount: 0,
      followingCount: 0,
      postCount: 0,
    });
  },
});

// Viewer's own profile (null when signed out — the client treats this as the
// signed-out state rather than an error).
export const me = query({
  args: {},
  handler: async (ctx): Promise<Doc<"profiles"> | null> => {
    return await getViewerProfile(ctx);
  },
});

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
  },
});

export const setInterests = mutation({
  args: { interests: v.array(v.string()) },
  handler: async (ctx, { interests }) => {
    const viewer = await requireViewer(ctx);
    await ctx.db.patch(viewer._id, { interests: interests.slice(0, 20) });
  },
});

export const setSpoilerPreference = mutation({
  args: {
    preference: v.union(v.literal("strict"), v.literal("balanced"), v.literal("relaxed")),
  },
  handler: async (ctx, { preference }) => {
    const viewer = await requireViewer(ctx);
    await ctx.db.patch(viewer._id, { spoilerPreference: preference });
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    await ctx.db.patch(viewer._id, { onboardingComplete: true });
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    handle: v.optional(v.string()),
  },
  handler: async (ctx, { displayName, bio, isPrivate, handle }) => {
    const viewer = await requireViewer(ctx);
    const patch: Partial<Doc<"profiles">> = {};
    if (displayName !== undefined) patch.displayName = displayName.slice(0, 50);
    if (bio !== undefined) patch.bio = bio.slice(0, 500);
    if (isPrivate !== undefined) patch.isPrivate = isPrivate;
    if (handle !== undefined) {
      const h = validateHandle(handle);
      const taken = await ctx.db
        .query("profiles")
        .withIndex("by_handle", (q) => q.eq("handle", h))
        .first();
      if (taken && taken._id !== viewer._id) throw new ConvexError("HANDLE_TAKEN");
      patch.handle = h;
    }
    await ctx.db.patch(viewer._id, patch);
  },
});

// ---- helpers (file-private) ----
async function getEmail(ctx: MutationCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.email ?? null;
}

async function handleTaken(ctx: MutationCtx, handle: string): Promise<boolean> {
  const row = await ctx.db
    .query("profiles")
    .withIndex("by_handle", (q) => q.eq("handle", handle))
    .first();
  return row !== null;
}
