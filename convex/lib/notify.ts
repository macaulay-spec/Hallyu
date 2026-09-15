import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { isQuietWindow } from "./policy";

// Notification fan-out helper (Spec §18). Every notification is created by a
// real event — reply, mention, episode release, community announcement,
// moderation outcome — never by a placeholder generator.
//
// Preferences are honoured before insert:
//   * an explicit per-target row (targetId set) beats the category row;
//   * a disabled category means no notification is written at all — silence,
//     not a hidden row the user can never clear;
//   * quiet hours never drop the in-app row (Convex queries are the inbox);
//     they mark it so the UI can show the quiet-hours chip honestly.

export type NotifyCategory = "critical" | "important" | "optional";

export type NotifyInput = {
  recipientId: Id<"profiles">;
  category: NotifyCategory;
  type: string;
  /** Deep-link route for the payload (Spec §18: every type deep-links). */
  route: string;
  /** Stable key for per-drama / per-community preference overrides. */
  targetId?: string;
  /** Human context the UI renders (never a raw id the user can't read). */
  text?: string;
};

export async function notify(ctx: MutationCtx, input: NotifyInput): Promise<void> {
  if (input.recipientId === undefined) return;

  const prefs = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_profile", (q) => q.eq("profileId", input.recipientId))
    .collect();

  const perTarget = input.targetId
    ? prefs.find((p) => p.category === input.category && p.targetId === input.targetId)
    : undefined;
  const categoryPref = prefs.find(
    (p) => p.category === input.category && p.targetId === undefined
  );
  const effective = perTarget ?? categoryPref;

  if (effective && effective.enabled === false) return;

  const quiet = isQuietWindow(
    effective?.quietHoursStart ?? null,
    effective?.quietHoursEnd ?? null,
    Date.now()
  );

  await ctx.db.insert("notifications", {
    recipientId: input.recipientId,
    category: input.category,
    type: input.type,
    payload: JSON.stringify({
      route: input.route,
      text: input.text ?? null,
      targetId: input.targetId ?? null,
      quiet,
    }),
    createdAt: Date.now(),
  });
}

/**
 * Mention fan-out (§18 "mention" is a critical notification). Parses @handles
 * out of the body, skips the actor and anyone who opted out, and deep-links to
 * the mentioning content.
 */
export async function notifyMentions(
  ctx: MutationCtx,
  input: { actorId: Id<"profiles">; body: string; route: string; targetId?: string }
): Promise<number> {
  const handles = new Set(
    (input.body.match(/@([a-z0-9_]{3,24})/gi) ?? []).map((m) => m.slice(1).toLowerCase())
  );
  handles.delete("");
  let sent = 0;
  for (const handle of Array.from(handles).slice(0, 10)) {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle))
      .first();
    if (!profile || profile._id === input.actorId) continue;
    await notify(ctx, {
      recipientId: profile._id,
      category: "critical",
      type: "mention",
      route: input.route,
      targetId: input.targetId,
      text: `You were mentioned`,
    });
    sent += 1;
  }
  return sent;
}

// Quiet-hours math lives in lib/policy.ts so it is unit-tested (see
// tests/policy.test.ts) rather than duplicated per call site.
