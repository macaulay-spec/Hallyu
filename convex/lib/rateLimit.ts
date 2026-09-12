import { MutationCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// Token-bucket rate limiter (D-21), backed by the rateLimits table — no Redis
// (Spec §30). Keyed per identity + action class. Fixed-window counter: simple,
// transactional, and honest about its limits.
const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "post:create": { max: 20, windowMs: 60_000 },
  "comment:create": { max: 40, windowMs: 60_000 },
  "reaction:toggle": { max: 120, windowMs: 60_000 },
  "report:create": { max: 10, windowMs: 60_000 },
  "auth:signup": { max: 5, windowMs: 300_000 },
  "follow:toggle": { max: 60, windowMs: 60_000 },
};

export async function checkRateLimit(
  ctx: MutationCtx,
  actionClass: keyof typeof LIMITS | string,
  identityKey: string
): Promise<void> {
  const limit = LIMITS[actionClass] ?? { max: 60, windowMs: 60_000 };
  const key = `${actionClass}:${identityKey}`;
  const now = Date.now();

  const row: Doc<"rateLimits"> | null = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  if (!row) {
    await ctx.db.insert("rateLimits", { key, count: 1, windowStart: now });
    return;
  }

  if (now - row.windowStart > limit.windowMs) {
    await ctx.db.patch(row._id, { count: 1, windowStart: now });
    return;
  }

  if (row.count >= limit.max) {
    throw new ConvexErrorLike("RATE_LIMITED");
  }
  await ctx.db.patch(row._id, { count: row.count + 1 });
}

// Typed error carrying a stable code the client maps to humane copy (§38).
export class ConvexErrorLike extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export type RateLimitBucket = Id<"rateLimits">;
