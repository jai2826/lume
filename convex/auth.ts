import { v } from "convex/values";
import { query } from "./_generated/server";
// IMPORTANT: Import your new wrappers from wherever you saved them!
import {
  authedMutation,
  softAuthedQuery,
} from "./lib/middleware";

/**
 * ==========================================
 * USER MANAGEMENT
 * ==========================================
 */

// Wraps mutation: Guarantees ctx.user exists
export const createOrUpdateUser = authedMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // We already know they are logged in. Just check if the ID matches.
    if (ctx.user.subject !== args.clerkId) {
      throw new Error(
        `CRITICAL: ID Mismatch. Clerk sent ${args.clerkId}, but token says ${ctx.user.subject}`,
      );
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId),
      )
      .first();

    if (existingUser) {
      if (args.email || args.name) {
        await ctx.db.patch(existingUser._id, {
          email: args.email || existingUser.email,
          name: args.name || existingUser.name,
        });
      }
      return existingUser;
    }

    const newUserId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
    });

    return await ctx.db.get(newUserId);
  },
});

// Wraps query: Won't crash the UI if auth is still loading
export const getCurrentUser = softAuthedQuery({
  args: {},
  handler: async (ctx) => {
    // Fail gracefully if not logged in yet
    const user = ctx.user;
    if (!ctx || !user) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", user.subject),
      )
      .first();
  },
});

/**
 * ==========================================
 * OAUTH & SOCIAL KEYS (STUDIO ARCHITECTURE)
 * ==========================================
 */

export const getStudioLinkedAccounts = softAuthedQuery({
  args: { studioId: v.id("studios") },
  handler: async (ctx, args) => {
    const user = ctx.user;
    if (!user) return null;

    // 1. Verify membership using the fast compound index
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user_and_studio", (q) =>
        q
          .eq("userId", user.subject)
          .eq("studioId", args.studioId),
      )
      .first();

    if (!membership) return null; // UI Query: fail gracefully

    // 2. Fetch the keys tied to the STUDIO
    const accounts = await ctx.db
      .query("social_keys")
      .withIndex("by_studio", (q) =>
        q.eq("studioId", args.studioId),
      )
      .collect();

    // Group by platform
    const grouped: Record<
      string,
      Array<{ accountName: string; _id: string }>
    > = {
      instagram: [],
      youtube: [],
      x: [],
      tiktok: [],
      snapchat: [],
    };

    for (const account of accounts) {
      grouped[account.platform].push({
        accountName: account.accountName,
        _id: account._id,
      });
    }

    return grouped;
  },
});

export const storeOAuthToken = authedMutation({
  args: {
    studioId: v.id("studios"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("x"),
      v.literal("tiktok"),
      v.literal("snapchat"),
    ),
    accountName: v.string(),
    platformAccountId: v.string(),
    encryptedOAuthToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Verify the caller belongs to the target studio using the fast index! (NO MORE .filter)
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user_and_studio", (q) =>
        q
          .eq("userId", ctx.user.subject)
          .eq("studioId", args.studioId),
      )
      .first();

    if (!membership) {
      throw new Error(
        "Unauthorized: Not a member of this studio",
      );
    }

    // 2. Check if account already exists using the precise compound index
    const existing = await ctx.db
      .query("social_keys")
      .withIndex("by_studio_platform_account", (q) =>
        q
          .eq("studioId", args.studioId)
          .eq("platform", args.platform)
          .eq("platformAccountId", args.platformAccountId),
      )
      .first();

    if (existing) {
      // 3. Update existing entry (e.g., refresh token rotation)
      await ctx.db.patch(existing._id, {
        accountName: args.accountName,
        encryptedOAuthToken: args.encryptedOAuthToken,
        ...(args.refreshToken && {
          refreshToken: args.refreshToken,
        }),
        tokenExpiresAt: args.tokenExpiresAt,
      });
      return existing._id;
    }

    // 4. Insert new entry
    const newId = await ctx.db.insert("social_keys", {
      studioId: args.studioId,
      platform: args.platform,
      accountName: args.accountName,
      platformAccountId: args.platformAccountId,
      encryptedOAuthToken: args.encryptedOAuthToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });

    return newId;
  },
});

export const removeLinkedAccount = authedMutation({
  args: { accountId: v.id("social_keys") },
  handler: async (ctx, args) => {
    // Fetch the key first to find out which studio it belongs to
    const key = await ctx.db.get(args.accountId);
    if (!key) throw new Error("Account not found");

    // Verify the user is an admin of the studio before letting them delete a key
    // FIXED: Using the compound index here too!
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user_and_studio", (q) =>
        q
          .eq("userId", ctx.user.subject)
          .eq("studioId", key.studioId),
      )
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error(
        "Unauthorized: Only Admins can remove linked accounts",
      );
    }

    await ctx.db.delete(args.accountId);
    return { success: true };
  },
});

// Notice we use standard `query` here. Why?
// Because this is called by Clerk's webhook server, not a logged-in user.
// ctx.auth will be null, so softAuthedQuery wouldn't help us here.
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      args.serverSecret !==
      process.env.SERVER_TO_SERVER_SECRET
    ) {
      throw new Error("Unauthorized Server Access");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", args.clerkId),
      )
      .first();
  },
});
