import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


/**
 * ==========================================
 * USER MANAGEMENT
 * ==========================================
 */

export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify the request is actually coming from the authenticated user
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error(
        "CRITICAL: Identity is null. Convex is rejecting the Clerk token.",
      );
    }

    if (identity.subject !== args.clerkId) {
      throw new Error(
        `CRITICAL: ID Mismatch. Clerk sent ${args.clerkId}, but token says ${identity.subject}`,
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

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // FIXED: Properly fetches the identity from Clerk via Convex
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .first();
  },
});

/**
 * ==========================================
 * OAUTH & SOCIAL KEYS (STUDIO ARCHITECTURE)
 * ==========================================
 */

export const getStudioLinkedAccounts = query({
  args: { studioId: v.id("studios") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // 1. Verify the user actually has access to this studio
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", identity.subject),
      )
      .filter((q) =>
        q.eq(q.field("studioId"), args.studioId),
      )
      .first();

    if (!membership)
      throw new Error(
        "Unauthorized: Not a member of this studio",
      );

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

export const storeOAuthToken = mutation({
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
    // 1. SECURITY: Validate Convex Identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Throw a standard error. Next.js will catch this in its try/catch block.
      throw new Error("Unauthorized: Invalid or missing Convex token.");
    }

    // 2. Verify the caller belongs to the target studio
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", identity.subject),
      )
      .filter((q) =>
        q.eq(q.field("studioId"), args.studioId),
      )
      .first();

    if (!membership) {
      throw new Error("Unauthorized: Not a member of this studio");
    }

    // 3. Check if account already exists using the precise compound index
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
      // 4. Update existing entry (e.g., refresh token rotation)
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

    // 5. Insert new entry
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

export const removeLinkedAccount = mutation({
  args: { accountId: v.id("social_keys") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Fetch the key to check which studio it belongs to
    const key = await ctx.db.get(args.accountId);
    if (!key) throw new Error("Account not found");

    // Verify the user is an admin of the studio before letting them delete a key
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", identity.subject),
      )
      .filter((q) =>
        q.eq(q.field("studioId"), key.studioId),
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

// Requires the server secret to prevent abuse, since this exposes user data based on Clerk ID
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
    serverSecret: v.string(), // Force the caller to provide the password
  },
  handler: async (ctx, args) => {
    // Check if the password matches the Convex environment variable
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
