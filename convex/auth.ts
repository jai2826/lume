import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create or update a user based on Clerk authentication
 * Called on first app load after user signs in with Clerk
 */
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing user by clerkId
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update name/email if provided
      if (args.email || args.name) {
        await ctx.db.patch(existingUser._id, {
          email: args.email || existingUser.email,
          name: args.name || existingUser.name,
        });
      }
      return existingUser;
    }

    // Create new user with hasCompletedOnboarding = false
    const newUserId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      hasCompletedOnboarding: false,
    });

    return await ctx.db.get(newUserId);
  },
});

/**
 * Get current user's profile based on Clerk context
 * Note: Requires Clerk middleware in Convex (advanced setup)
 * Alternative: Pass userId directly from client after calling createOrUpdateUser
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Integrate Clerk auth context once Clerk middleware is configured
    // For now, this is a placeholder. Client should fetch user ID from Clerk
    // and pass it explicitly to queries/mutations.
    return null;
  },
});

/**
 * Get current user by userId (called from client after Clerk auth)
 */
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Mark onboarding as complete for a user
 */
export const markOnboardingComplete = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      hasCompletedOnboarding: true,
    });
    return await ctx.db.get(args.userId);
  },
});

/**
 * Get all linked accounts for a user, grouped by platform
 */
export const getUserLinkedAccounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("social_keys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Group by platform
    const grouped: Record<string, Array<{ accountName: string; _id: string }>> =
      {
        instagram: [],
        youtube: [],
        x: [],
        tiktok: [],
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

/**
 * Store OAuth token for a platform account
 * Called after OAuth callback successfully exchanges code for token
 */
export const storeOAuthToken = mutation({
  args: {
    userId: v.id("users"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("x"),
      v.literal("tiktok")
    ),
    accountName: v.string(),
    encryptedOAuthToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if account already exists for this user/platform/accountName
    const existing = await ctx.db
      .query("social_keys")
      .withIndex("by_userId_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform)
      )
      .filter((q) => q.eq(q.field("accountName"), args.accountName))
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        encryptedOAuthToken: args.encryptedOAuthToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.tokenExpiresAt,
      });
      return existing._id;
    }

    // Insert new entry
    const newId = await ctx.db.insert("social_keys", {
      userId: args.userId,
      platform: args.platform,
      accountName: args.accountName,
      encryptedOAuthToken: args.encryptedOAuthToken,
      refreshToken: args.refreshToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });

    return newId;
  },
});

/**
 * Remove a linked account
 * Called when user disconnects an account
 */
export const removeLinkedAccount = mutation({
  args: { accountId: v.id("social_keys") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.accountId);
    return { success: true };
  },
});

/**
 * Reset onboarding flag (for "re-do onboarding" feature in settings)
 */
export const resetOnboarding = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      hasCompletedOnboarding: false,
    });
    return await ctx.db.get(args.userId);
  },
});
