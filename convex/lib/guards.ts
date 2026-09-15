import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Every server function starts with an auth check (Spec §39 rules 3–4).
// The client structurally cannot reach data without passing through here.

export async function getViewerProfile(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"profiles"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

export async function requireViewer(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"profiles">> {
  const profile = await getViewerProfile(ctx);
  if (!profile) throw new ConvexError("AUTH_REQUIRED");
  return profile;
}

// Community moderator check — community powers NEVER imply platform powers
// (Spec §14/§26). Platform-level checks (requirePlatformModerator /
// requireAdmin) arrive with the moderation module in M5 and read a dedicated
// platformRoles table, not verification badges (D-14).
export async function requireCommunityModerator(
  ctx: QueryCtx | MutationCtx,
  communityId: Id<"communities">
): Promise<Doc<"communityMembers">> {
  const viewer = await requireViewer(ctx);
  const membership = await ctx.db
    .query("communityMembers")
    .withIndex("by_community_profile", (q) =>
      q.eq("communityId", communityId).eq("profileId", viewer._id)
    )
    .first();
  if (!membership || membership.state !== "active" ||
      (membership.role !== "moderator" && membership.role !== "owner")) {
    throw new ConvexError("NOT_MEMBER");
  }
  return membership;
}

// Platform roles (Spec §26) are read from their own table — a community
// moderator never inherits platform powers, and a verified badge grants
// nothing (D-14). Used by the moderation queue and admin aggregates.
export async function viewerPlatformRole(
  ctx: QueryCtx | MutationCtx
): Promise<"platform_moderator" | "admin" | null> {
  const profile = await getViewerProfile(ctx);
  if (!profile) return null;
  const rows = await ctx.db
    .query("platformRoles")
    .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
    .collect();
  if (rows.some((r) => r.role === "admin")) return "admin";
  if (rows.some((r) => r.role === "platform_moderator")) return "platform_moderator";
  return null;
}

export async function requirePlatformModerator(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"profiles">> {
  const viewer = await requireViewer(ctx);
  const role = await viewerPlatformRole(ctx);
  if (!role) throw new ConvexError("FORBIDDEN");
  return viewer;
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"profiles">> {
  const viewer = await requireViewer(ctx);
  if ((await viewerPlatformRole(ctx)) !== "admin") throw new ConvexError("FORBIDDEN");
  return viewer;
}

export class ConvexError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

export function validateHandle(handle: string): string {
  const h = handle.toLowerCase().trim();
  if (!HANDLE_RE.test(h)) {
    throw new ConvexError("HANDLE_INVALID");
  }
  return h;
}
