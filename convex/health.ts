import { query } from "./_generated/server";
import { v } from "convex/values";

// Liveness probe used by CI and the doctor script. No auth required by design.
export const ping = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("configStatus").withIndex("by_key", (q) => q.eq("key", "backend")).collect();
    return {
      ok: true,
      backendRegistered: rows.length > 0,
    };
  },
});

export const reportStatus = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("configStatus")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});
