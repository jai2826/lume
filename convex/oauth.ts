import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const pendingOAuthPlatformValidator = v.union(
  v.literal("instagram"),
  v.literal("youtube"),
);

export const createPendingOAuthTransaction = mutation({
  args: {
    stateToken: v.string(),
    platform: pendingOAuthPlatformValidator,
    userId: v.string(),
    studioId: v.id("studios"),
    studioSlug: v.optional(v.string()),
    requestedScopes: v.array(v.string()),
    authEndpoint: v.string(),
    callbackPath: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.userId) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000;
    const existing = await ctx.db
      .query("pending_oauth_transactions")
      .withIndex("by_state", (q) => q.eq("stateToken", args.stateToken))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        platform: args.platform,
        userId: args.userId,
        studioId: args.studioId,
        studioSlug: args.studioSlug,
        requestedScopes: args.requestedScopes,
        authEndpoint: args.authEndpoint,
        callbackPath: args.callbackPath,
        status: "pending",
        updatedAt: now,
        expiresAt,
        failureReason: undefined,
        completedAt: undefined,
      });

      return existing._id;
    }

    return ctx.db.insert("pending_oauth_transactions", {
      stateToken: args.stateToken,
      platform: args.platform,
      userId: args.userId,
      studioId: args.studioId,
      studioSlug: args.studioSlug,
      requestedScopes: args.requestedScopes,
      authEndpoint: args.authEndpoint,
      callbackPath: args.callbackPath,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });
  },
});

export const getPendingOAuthTransaction = query({
  args: {
    stateToken: v.string(),
    platform: pendingOAuthPlatformValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const pendingTransaction = await ctx.db
      .query("pending_oauth_transactions")
      .withIndex("by_state", (q) => q.eq("stateToken", args.stateToken))
      .first();

    if (
      !pendingTransaction ||
      pendingTransaction.platform !== args.platform ||
      pendingTransaction.userId !== identity.subject ||
      pendingTransaction.status !== "pending" ||
      pendingTransaction.expiresAt < Date.now()
    ) {
      return null;
    }

    return pendingTransaction;
  },
});

export const completePendingOAuthTransaction = mutation({
  args: {
    stateToken: v.string(),
    platform: pendingOAuthPlatformValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const pendingTransaction = await ctx.db
      .query("pending_oauth_transactions")
      .withIndex("by_state", (q) => q.eq("stateToken", args.stateToken))
      .first();

    if (
      !pendingTransaction ||
      pendingTransaction.platform !== args.platform ||
      pendingTransaction.userId !== identity.subject
    ) {
      return null;
    }

    await ctx.db.patch(pendingTransaction._id, {
      status: "completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
      failureReason: undefined,
    });

    return pendingTransaction._id;
  },
});

export const failPendingOAuthTransaction = mutation({
  args: {
    stateToken: v.string(),
    platform: pendingOAuthPlatformValidator,
    failureReason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const pendingTransaction = await ctx.db
      .query("pending_oauth_transactions")
      .withIndex("by_state", (q) => q.eq("stateToken", args.stateToken))
      .first();

    if (
      !pendingTransaction ||
      pendingTransaction.platform !== args.platform ||
      pendingTransaction.userId !== identity.subject
    ) {
      return null;
    }

    await ctx.db.patch(pendingTransaction._id, {
      status: "failed",
      updatedAt: Date.now(),
      failureReason: args.failureReason,
    });

    return pendingTransaction._id;
  },
});