import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  ConvexError,
  getViewerProfile,
  requireViewer,
  requirePlatformModerator,
  requireAdmin,
  viewerPlatformRole,
} from "./lib/guards";
import { checkRateLimit } from "./lib/rateLimit";
import { notify } from "./lib/notify";
import {
  REPORT_REASONS,
  autoActionFor,
  classifyReport,
  type ReportReason,
} from "./lib/policy";
import { track } from "./onboarding";
import { Doc, Id } from "./_generated/dataModel";

// Moderation pipeline (Spec §27, D-15). Exactly this order:
//   report → classification → severity → narrowly-defined automated action per
//   explicit thresholds → human moderator queue → decision → user notification
//   → appeal → audit log. AI/rule classification is NEVER the sole authority
//   for serious enforcement (§39 rule 13) — it only routes and auto-actions a
//   documented, reversible subset (spam floods).

export const createReport = mutation({
  args: {
    targetType: v.union(
      v.literal("post"),
      v.literal("comment"),
      v.literal("user"),
      v.literal("community")
    ),
    targetId: v.string(),
    reason: v.union(...REPORT_REASONS.map((r) => v.literal(r))),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { targetType, targetId, reason, details }) => {
    const viewer = await requireViewer(ctx);
    await checkRateLimit(ctx, "report:create", viewer._id);

    const { severity, aiClass } = classifyReport(reason, details);

    const reportId = await ctx.db.insert("reports", {
      reporterId: viewer._id,
      targetType,
      targetId,
      reason,
      details: details?.slice(0, 1000),
      status: "open",
      severity,
      aiClass,
      createdAt: Date.now(),
    });

    // Narrowly-defined automated action (§27): only the documented spam-flood
    // case auto-hides content, and only for posts/comments, and it is fully
    // reversible by a human moderator reviewing the queue.
    let autoAction: string | null = null;
    if (autoActionFor(aiClass, targetType)) {
      if (targetType === "post") {
        const post = await ctx.db.get(targetId as Id<"posts">);
        if (post && post.moderationState === "visible") {
          await ctx.db.patch(post._id, { moderationState: "pending_review" });
          autoAction = "auto_hidden_pending_review";
        }
      } else if (targetType === "comment") {
        const comment = await ctx.db.get(targetId as Id<"comments">);
        if (comment && comment.moderationState === "visible") {
          await ctx.db.patch(comment._id, { moderationState: "pending_review" });
          autoAction = "auto_hidden_pending_review";
        }
      }
    }
    if (autoAction) await ctx.db.patch(reportId, { autoAction });

    await ctx.db.insert("auditLogs", {
      actorId: viewer._id,
      event: "report_created",
      context: JSON.stringify({ reportId, targetType, targetId, reason, severity, aiClass, autoAction }),
      createdAt: Date.now(),
    });
    await track(ctx, viewer._id, "report_submitted", `${targetType}:${reason}`);

    return { reportId, severity, autoAction };
  },
});

/** Role of the viewer for gating the moderation surface in the UI (§37). */
export const myRole = query({
  args: {},
  handler: async (ctx) => {
    return await viewerPlatformRole(ctx);
  },
});

/**
 * True when no platform role exists yet — the UI only offers the one-time
 * bootstrap in that state, so it can never be used as a privilege grab later.
 */
export const bootstrapAvailable = query({
  args: {},
  handler: async (ctx) => {
    const any = await ctx.db.query("platformRoles").take(1);
    return any.length === 0;
  },
});

/**
 * One-time bootstrap: the very first caller becomes admin when no platform
 * role exists at all. Without this a fresh deployment has no way to reach the
 * moderation surface; every subsequent grant must go through grantRole.
 */
export const bootstrapFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await requireViewer(ctx);
    const any = await ctx.db.query("platformRoles").take(1);
    if (any.length > 0) throw new ConvexError("FORBIDDEN");
    await ctx.db.insert("platformRoles", { profileId: viewer._id, role: "admin", grantedAt: Date.now() });
    await ctx.db.insert("auditLogs", {
      actorId: viewer._id,
      event: "platform_role_bootstrapped",
      context: JSON.stringify({ role: "admin" }),
      createdAt: Date.now(),
    });
    return { role: "admin" as const };
  },
});

export const grantRole = mutation({
  args: {
    handle: v.string(),
    role: v.union(v.literal("platform_moderator"), v.literal("admin")),
  },
  handler: async (ctx, { handle, role }) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle.toLowerCase()))
      .first();
    if (!target) throw new ConvexError("NOT_FOUND");
    const existing = await ctx.db
      .query("platformRoles")
      .withIndex("by_profile", (q) => q.eq("profileId", target._id))
      .collect();
    if (!existing.some((r) => r.role === role)) {
      await ctx.db.insert("platformRoles", { profileId: target._id, role, grantedAt: Date.now() });
    }
    await ctx.db.insert("auditLogs", {
      actorId: admin._id,
      event: "platform_role_granted",
      context: JSON.stringify({ handle: target.handle, role }),
      createdAt: Date.now(),
    });
    return { granted: true };
  },
});

type QueueRow = {
  _id: Id<"reports">;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  severity: string | null;
  aiClass: string | null;
  autoAction: string | null;
  status: string;
  answered: string;
  preview: { title: string; body: string; route: string; authorHandle: string | null };
  reporterHandle: string;
  createdAt: number;
  appealStatus: string | null;
  appealNote: string | null;
};

/** Moderator queue, ordered high severity first then oldest (§27). */
export const queue = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformModerator(ctx);
    const open = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .order("desc")
      .take(100);

    const severityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const rows: QueueRow[] = [];
    for (const report of open) {
      const reporter = await ctx.db.get(report.reporterId);
      const resolved = await resolvePreview(ctx, report.targetType, report.targetId);
      rows.push({
        _id: report._id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        details: report.details ?? null,
        severity: report.severity ?? null,
        aiClass: report.aiClass ?? null,
        autoAction: report.autoAction ?? null,
        status: report.status,
        answered: new Date(report.createdAt).toISOString().slice(0, 16).replace("T", " "),
        preview: resolved,
        reporterHandle: reporter?.handle ?? "unknown",
        createdAt: report.createdAt,
        appealStatus: report.appealStatus ?? null,
        appealNote: report.appealNote ?? null,
      });
    }
    rows.sort(
      (a, b) =>
        (severityRank[a.severity ?? "low"] ?? 3) - (severityRank[b.severity ?? "low"] ?? 3) ||
        a.createdAt - b.createdAt
    );

    const decided = await ctx.db.query("reports").take(200);
    const decidedCount = decided.filter((r) => r.status !== "open").length;
    return { items: rows, decidedCount };
  },
});

export const decide = mutation({
  args: {
    reportId: v.id("reports"),
    action: v.union(
      v.literal("dismiss"),
      v.literal("warn"),
      v.literal("hide"),
      v.literal("remove"),
      v.literal("restore"),
      v.literal("ban_user")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { reportId, action, note }) => {
    const moderator = await requirePlatformModerator(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new ConvexError("NOT_FOUND");

    const now = Date.now();
    let affected: Id<"profiles"> | null = null;

    if (report.targetType === "post") {
      const post = await ctx.db.get(report.targetId as Id<"posts">);
      if (post) {
        affected = post.authorId;
        if (action === "hide") await ctx.db.patch(post._id, { moderationState: "hidden" });
        if (action === "remove") await ctx.db.patch(post._id, { moderationState: "removed" });
        if (action === "restore") await ctx.db.patch(post._id, { moderationState: "visible" });
      }
    } else if (report.targetType === "comment") {
      const comment = await ctx.db.get(report.targetId as Id<"comments">);
      if (comment) {
        affected = comment.authorId;
        if (action === "hide") await ctx.db.patch(comment._id, { moderationState: "hidden" });
        if (action === "remove") await ctx.db.patch(comment._id, { moderationState: "removed" });
        if (action === "restore") await ctx.db.patch(comment._id, { moderationState: "visible" });
      }
    } else if (report.targetType === "user") {
      affected = report.targetId as Id<"profiles">;
    }

    await ctx.db.patch(reportId, {
      status: action === "dismiss" ? "dismissed" : "resolved",
      decidedBy: moderator._id,
      decidedAt: now,
    });

    await ctx.db.insert("moderationActions", {
      moderatorId: moderator._id,
      targetType: report.targetType,
      targetId: report.targetId,
      action,
      reportId,
      createdAt: now,
    });
    await ctx.db.insert("moderationLogs", {
      actorId: moderator._id,
      event: `report_${action}`,
      context: JSON.stringify({ reportId, targetId: report.targetId, note: note ?? null }),
      createdAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorId: moderator._id,
      event: "moderation_decision",
      context: JSON.stringify({ reportId, action, severity: report.severity, note: note ?? null }),
      createdAt: now,
    });

    // Both parties are notified: the reporter (outcome) and the affected author
    // (with the reason), and the affected author may appeal (§27).
    await notify(ctx, {
      recipientId: report.reporterId,
      category: "optional",
      type: "report_outcome",
      route:
        report.targetType === "post" ? `/post/${report.targetId}` : "/notifications",
      text:
        action === "dismiss"
          ? "Thanks — we reviewed your report and took no action."
          : "Thanks — we reviewed your report and took action.",
    });
    if (affected) {
      await notify(ctx, {
        recipientId: affected,
        category: "important",
        type: "moderation_outcome",
        route: report.targetType === "post" ? `/post/${report.targetId}` : "/notifications",
        text:
          action === "warn"
            ? `A moderator reviewed reported content on your account and issued a warning${note ? `: ${note}` : ""}.`
            : action === "dismiss"
              ? "We reviewed a report about your content and took no action."
              : `A moderator took action on reported content: ${action.replace("_", " ")}. You can appeal this decision.`,
      });
    }

    await track(ctx, moderator._id, "moderation_decision", `${report.targetType}:${action}`);
    return { action };
  },
});

/** The affected user appeals a decision once (Spec §27). */
export const appeal = mutation({
  args: { reportId: v.id("reports"), note: v.string() },
  handler: async (ctx, { reportId, note }) => {
    const viewer = await requireViewer(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new ConvexError("NOT_FOUND");
    if (report.appealedAt) throw new ConvexError("ALREADY_APPEALED");
    if (report.status === "open") throw new ConvexError("NOT_DECIDED");

    await ctx.db.patch(reportId, {
      appealedAt: Date.now(),
      appealNote: note.slice(0, 1000),
      appealStatus: "pending",
      status: "open", // returns to the queue for human review (§27)
    });
    await ctx.db.insert("auditLogs", {
      actorId: viewer._id,
      event: "moderation_appeal",
      context: JSON.stringify({ reportId }),
      createdAt: Date.now(),
    });
    return { appealStatus: "pending" as const };
  },
});

export const decideAppeal = mutation({
  args: { reportId: v.id("reports"), uphold: v.boolean(), note: v.optional(v.string()) },
  handler: async (ctx, { reportId, uphold, note }) => {
    const moderator = await requirePlatformModerator(ctx);
    const report = await ctx.db.get(reportId);
    if (!report || !report.appealedAt) throw new ConvexError("NOT_FOUND");

    // A reversed appeal restores the content it affected.
    if (!uphold) {
      if (report.targetType === "post") {
        const post = await ctx.db.get(report.targetId as Id<"posts">);
        if (post) await ctx.db.patch(post._id, { moderationState: "visible" });
      } else if (report.targetType === "comment") {
        const comment = await ctx.db.get(report.targetId as Id<"comments">);
        if (comment) await ctx.db.patch(comment._id, { moderationState: "visible" });
      }
    }

    await ctx.db.patch(reportId, {
      appealStatus: uphold ? "upheld" : "reversed",
      status: "resolved",
      decidedBy: moderator._id,
      decidedAt: Date.now(),
    });
    await ctx.db.insert("auditLogs", {
      actorId: moderator._id,
      event: uphold ? "appeal_upheld" : "appeal_reversed",
      context: JSON.stringify({ reportId, note: note ?? null }),
      createdAt: Date.now(),
    });

    const affected =
      report.targetType === "post"
        ? (await ctx.db.get(report.targetId as Id<"posts">))?.authorId
        : report.targetType === "comment"
          ? (await ctx.db.get(report.targetId as Id<"comments">))?.authorId
          : (report.targetId as Id<"profiles">);
    if (affected) {
      await notify(ctx, {
        recipientId: affected,
        category: "important",
        type: "appeal_outcome",
        route: "/notifications",
        text: uphold
          ? "Your appeal was reviewed and the original decision stands."
          : "Your appeal was successful — the action has been reversed.",
      });
    }
    return { appealStatus: uphold ? ("upheld" as const) : ("reversed" as const) };
  },
});

/** Reports the viewer filed, so the app can show outcome + appeal affordance. */
export const myReports = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewerProfile(ctx);
    if (!viewer) return [];
    const rows = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .take(50);
    const resolved = await ctx.db.query("reports").take(200);
    return [...rows, ...resolved.filter((r) => r.status !== "open" && !rows.some((x) => x._id === r._id))]
      .filter((r) => r.reporterId === viewer._id)
      .slice(0, 50)
      .map((r) => ({
        _id: r._id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        severity: r.severity ?? null,
        decidedAt: r.decidedAt ?? null,
        appealStatus: r.appealStatus ?? null,
        createdAt: r.createdAt,
      }));
  },
});

/** Audit log viewer (admin only) — every privileged action is recorded (§27). */
export const auditLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("auditLogs")
      .withIndex("by_created")
      .order("desc")
      .take(Math.min(limit, 200));
    const out = [];
    for (const row of rows) {
      const actor = row.actorId ? await ctx.db.get(row.actorId) : null;
      out.push({
        _id: row._id,
        event: row.event,
        context: row.context ?? null,
        actorHandle: actor?.handle ?? "system",
        createdAt: row.createdAt,
      });
    }
    return out;
  },
});

// ---- helpers ----
async function resolvePreview(
  ctx: { db: any },
  targetType: string,
  targetId: string
): Promise<QueueRow["preview"]> {
  if (targetType === "post") {
    const post = await ctx.db.get(targetId);
    if (!post) return { title: "Post", body: "(deleted)", route: "/", authorHandle: null };
    const author = await ctx.db.get(post.authorId);
    return {
      title: `Post by @${author?.handle ?? "unknown"}`,
      body: post.body.slice(0, 400),
      route: `/post/${targetId}`,
      authorHandle: author?.handle ?? null,
    };
  }
  if (targetType === "comment") {
    const comment = await ctx.db.get(targetId);
    if (!comment) return { title: "Comment", body: "(deleted)", route: "/", authorHandle: null };
    const author = await ctx.db.get(comment.authorId);
    return {
      title: `Comment by @${author?.handle ?? "unknown"}`,
      body: comment.body.slice(0, 400),
      route: `/post/${comment.postId}`,
      authorHandle: author?.handle ?? null,
    };
  }
  if (targetType === "user") {
    const profile = await ctx.db.get(targetId);
    return {
      title: `@${profile?.handle ?? "unknown"}`,
      body: profile?.bio ?? "(no bio)",
      route: `/user/${profile?.handle ?? ""}`,
      authorHandle: profile?.handle ?? null,
    };
  }
  const community = await ctx.db.get(targetId);
  return {
    title: community?.name ?? "Community",
    body: community?.description ?? "(no description)",
    route: `/community/${community?.slug ?? ""}`,
    authorHandle: null,
  };
}

