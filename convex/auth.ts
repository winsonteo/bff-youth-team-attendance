import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const loginWithPin = mutation({
  args: { pin: v.string() },
  handler: async (ctx, args) => {
    const coach = await ctx.db
      .query("coaches")
      .withIndex("by_pin", (q) => q.eq("pin", args.pin))
      .first();

    if (!coach || !coach.active) {
      return { ok: false as const, error: "Invalid PIN" };
    }

    return {
      ok: true as const,
      coach: {
        _id: coach._id,
        name: coach.name,
      },
    };
  },
});
