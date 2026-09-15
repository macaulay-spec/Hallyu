import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireViewer } from "./lib/guards";
import { notify } from "./lib/notify";
import { isQuietWindow } from "./lib/policy";
import { Doc } from "./_generated/dataModel";

const CATEGORIES = ["critical", "important", "optional"] as const;
type Category = (typeof CATEGORIES)[number];

type Row = {
  _id: Doc<"notifications">["_id"];
  category: Category;
  type: string;
  text: string | null;
  route: string | null;
  targetId: string | null;
  quiet: boolean;
  read: boolean;
  createdAt: number;
};

function decode(row: Doc<"notifications">): Row {
  let payload: { route?: string | null; text?: string | null; targetId?: string | null; quiet?: boolean } = {};
  try {
    payload = row.payload ? JSON.parse(row.payload) : {};
  } catch {
    payload = {};
  }
  return {
    _id: row._id,
    category: row.category,
    type: row.type,
    text: payload.text ?? null,
    route: payload.route ?? null,
    targetId: payload.targetId ?? null,
    quiet: payload.quiet ?? false,
    read: row.readAt != null,
    createdAt: row.createdAt,
  };
}

// Grouped inbox (Spec §18): Critical / Important / Optional with unread counts.
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 80 }) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_created", (q) => q.eq("recipientId", viewer._id))
      .order("desc")
      .take(Math.min(limit, 200));

    const grouped: Record<Category, Row[]> = { critical: [], important: [], optional: [] };
    for (const row of rows) grouped[row.category].push(decode(row));
    return {
      critical: grouped.critical,
      important: grouped.important,
      optional: grouped.optional,
      total: rows.length,
      unread:
        grouped.critical.filter((r) => !r.read).length +
        grouped.important.filter((r) => !r.read).length +
        grouped.optional.filter((r) => !r.read).length,
    };
  },
});

// Badge count for the tab bar — one cheap lookup, no payload decoding.
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_created", (q) => q.eq("recipientId", viewer._id))
      .order("desc")
      .take(100);
    return rows.filter((r) => r.readAt == null).length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const viewer = await requireViewer(ctx);
    const row = await ctx.db.get(notificationId);
    if (!row || row.recipientId !== viewer._id) return; // own inbox only
    if (row.readAt == null) await ctx.db.patch(row._id, { readAt: Date.now() });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_created", (q) => q.eq("recipientId", viewer._id))
      .order("desc")
      .take(200);
    const now = Date.now();
    for (const row of rows) {
      if (row.readAt == null) await ctx.db.patch(row._id, { readAt: now });
    }
    return { cleared: rows.filter((r) => r.readAt == null).length };
  },
});

// Per-category (+ optional per-target) preferences and quiet hours (§18).
export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    return CATEGORIES.map((category) => {
      const row = rows.find((r) => r.category === category && r.targetId == null);
      return {
        category,
        enabled: row?.enabled ?? true,
        quietHoursStart: row?.quietHoursStart ?? null,
        quietHoursEnd: row?.quietHoursEnd ?? null,
      };
    });
  },
});

export const setPreference = mutation({
  args: {
    category: v.union(...CATEGORIES.map((c) => v.literal(c))),
    enabled: v.boolean(),
    targetId: v.optional(v.string()),
  },
  handler: async (ctx, { category, enabled, targetId }) => {
    const viewer = await requireViewer(ctx);
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    const row = existing.find((r) => r.category === category && r.targetId === targetId);
    if (row) await ctx.db.patch(row._id, { enabled });
    else await ctx.db.insert("notificationPreferences", { profileId: viewer._id, category, enabled, targetId });
  },
});

export const setQuietHours = mutation({
  args: { startMinutes: v.number(), endMinutes: v.number() },
  handler: async (ctx, { startMinutes, endMinutes }) => {
    const viewer = await requireViewer(ctx);
    const clamp = (n: number) => Math.max(0, Math.min(1439, Math.round(n)));
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    for (const category of CATEGORIES) {
      const row = existing.find((r) => r.category === category && r.targetId == null);
      const patch = { quietHoursStart: clamp(startMinutes), quietHoursEnd: clamp(endMinutes) };
      if (row) await ctx.db.patch(row._id, patch);
      else
        await ctx.db.insert("notificationPreferences", {
          profileId: viewer._id,
          category,
          enabled: true,
          ...patch,
        });
    }
  },
});

/**
 * Episode-release sweep (§18 critical notification). Runs on a short cron; when
 * an episode has just aired it notifies everyone following that drama and
 * deep-links straight to the episode discussion. Deduped per recipient so a
 * cron re-run cannot notify the same person twice.
 */
export const episodeReleaseSweep = internalMutation({
  args: { windowMinutes: v.optional(v.number()) },
  handler: async (ctx, { windowMinutes = 20 }) => {
    const now = Date.now();
    const since = now - windowMinutes * 60 * 1000;
    const episodes = await ctx.db.query("episodes").withIndex("by_air", (q) => q.gt("airAt", since - 1)).take(50);

    let sent = 0;
    for (const episode of episodes) {
      if (episode.airAt == null || episode.airAt < since || episode.airAt > now) continue;
      const drama = await ctx.db.get(episode.dramaId);
      if (!drama) continue;

      const followers = await ctx.db
        .query("follows")
        .withIndex("by_target", (q) => q.eq("targetType", "drama").eq("targetId", drama.slug))
        .take(200);

      for (const follow of followers) {
        const recent = await ctx.db
          .query("notifications")
          .withIndex("by_recipient_created", (q) => q.eq("recipientId", follow.followerId))
          .order("desc")
          .take(50);
        const already = recent.some(
          (n) => n.type === "episode_release" && (n.payload ?? "").includes(`${drama.slug}:${episode.number}`)
        );
        if (already) continue;
        await notify(ctx, {
          recipientId: follow.followerId,
          category: "critical",
          type: "episode_release",
          route: `/episode/${episode._id}`,
          targetId: `${drama.slug}:${episode.number}`,
          text: `${drama.title} Ep ${episode.number} has aired`,
        });
        sent += 1;
      }
    }
    return { sent };
  },
});

/** True when the viewer is currently inside their own quiet window (§18). */
export const quietNow = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const rows = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_profile", (q) => q.eq("profileId", viewer._id))
      .collect();
    const row = rows.find((r) => r.category === "critical" && r.targetId == null) ?? rows[0];
    return isQuietWindow(row?.quietHoursStart ?? null, row?.quietHoursEnd ?? null, Date.now());
  },
});
