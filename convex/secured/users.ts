import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const syncUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check if the user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId),
      )
      .unique();

    if (existingUser) {
      // 2. Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
      });
      return existingUser._id;
    }

    // 3. Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      // Add any default fields you want here (e.g., role: "member")
    });
  },
});
