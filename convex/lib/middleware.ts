import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query } from ".././_generated/server";
import { v } from "convex/values";

// 1. STRICT AUTH: For Mutations that must fail if not logged in
export const authedMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Injects the verified user into the ctx for the handler to use
    return { ctx: { ...ctx, user: identity }, args };
  },
});

// 2. SOFT AUTH: For UI Queries that should fail gracefully if loading
export const softAuthedQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    // Injects null instead of throwing an error to prevent UI crashes
    return { ctx: { ...ctx, user: identity }, args };
  },
});

// 3. STUDIO ADMIN: Stacks on top of authedMutation
export const studioAdminMutation = customMutation(
  authedMutation, // Parent middleware guarantees ctx.user exists
  {
    args: { studioId: v.id("studios") },
    input: async (ctx, args) => {
      // Look how clean this is. No extra auth fetches.
      // We just immediately use ctx.user.subject.
      const membership = await ctx.db
        .query("studio_members")
        .withIndex("by_user_and_studio", (q) =>
          q
            .eq("userId", (ctx as any).user.subject)
            .eq("studioId", args.studioId),
        )
        .first();

      if (!membership || membership.role !== "admin") {
        throw new Error(
          "Unauthorized: Only Admins can perform this action",
        );
      }

      // Injects the verified membership into the ctx for the final handler
      return { ctx: { ...ctx, membership }, args };
    },
  },
);
