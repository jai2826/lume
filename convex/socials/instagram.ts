import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from ".././_generated/server";
import { internal } from ".././_generated/api";

/**
 * Convex: Instagram Integration
 *
 * Internal actions called from the Instagram webhook route and
 * background token-refresh jobs. All functions here are "internal"
 * — they are never exposed to the public API surface.
 *
 * Token refresh docs:
 *   https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#refresh-a-long-lived-token
 */

// ─────────────────────────────────────────────────────────────
// TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Refresh a long-lived Instagram access token.
 *
 * Long-lived tokens are valid for 60 days and can be refreshed
 * as long as the token has not expired.
 *
 * Endpoint: GET https://graph.instagram.com/refresh_access_token
 *   ?grant_type=ig_refresh_token
 *   &access_token=<LONG_LIVED_TOKEN>
 *
 * Call this from a scheduled Convex cron job ~ every 50 days.
 */
export const refreshInstagramToken = internalAction({
  args: {
    socialKeyId: v.id("social_keys"),
    decryptedToken: v.string(),
  },
  handler: async (
    ctx: any,
    args: { socialKeyId: string; decryptedToken: string }
  ) => {
    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(args.decryptedToken)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Instagram] Token refresh failed for key ${args.socialKeyId}:`,
        errorText
      );
      return { success: false, error: errorText };
    }

    const data = await response.json() as {
      access_token: string;
      token_type: string;
      expires_in: number;
    };

    const newExpiresAt = Date.now() + data.expires_in * 1000;

    // Persist refreshed token back to Convex
    // NOTE: The caller is responsible for re-encrypting before storing
    await ctx.runMutation(internal.socials.instagram.updateTokenExpiry, {
      socialKeyId: args.socialKeyId,
      tokenExpiresAt: newExpiresAt,
    });

    return {
      success: true,
      newToken: data.access_token,
      expiresAt: newExpiresAt,
    };
  },
});

/**
 * Update token expiry after a successful refresh.
 * Only updates the expiry timestamp — the encrypted token bytes
 * must be updated separately if the access_token value changed.
 */
export const updateTokenExpiry = internalMutation({
  args: {
    socialKeyId: v.id("social_keys"),
    tokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.socialKeyId, {
      tokenExpiresAt: args.tokenExpiresAt,
    });
  },
});

/**
 * Update both the encrypted token and its expiry.
 * Used when a refresh returns a new access_token value.
 */
export const updateEncryptedToken = internalMutation({
  args: {
    socialKeyId: v.id("social_keys"),
    encryptedOAuthToken: v.string(),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.socialKeyId, {
      encryptedOAuthToken: args.encryptedOAuthToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });
  },
});

/**
 * Get all Instagram social keys that are expiring soon (within 14 days).
 * Used by a scheduled cron job to proactively refresh tokens.
 */
export const getExpiringInstagramTokens = internalQuery({
  args: {},
  handler: async (ctx) => {
    const fourteenDaysFromNow = Date.now() + 14 * 24 * 60 * 60 * 1000;

    const allInstagramKeys = await ctx.db
      .query("social_keys")
      .withIndex("by_studio_platform") // partial index scan — filter client side
      .filter((q) => q.eq(q.field("platform"), "instagram"))
      .collect();

    return allInstagramKeys.filter(
      (key) =>
        key.tokenExpiresAt !== undefined &&
        key.tokenExpiresAt < fourteenDaysFromNow
    );
  },
});

// ─────────────────────────────────────────────────────────────
// WEBHOOK EVENT HANDLERS
// These are called from the Next.js webhook route handler.
// Keeping DB logic in Convex keeps your API routes thin.
// ─────────────────────────────────────────────────────────────

/**
 * Handle a new comment webhook event.
 * Extend this to store comments, trigger notifications, etc.
 */
export const onComment = internalMutation({
  args: {
    igAccountId: v.string(),
    commentId: v.optional(v.string()),
    mediaId: v.optional(v.string()),
    text: v.optional(v.string()),
    from: v.optional(v.object({ id: v.string(), username: v.optional(v.string()) })),
    timestamp: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    // TODO: Implement comment storage / notification logic
    console.log("[Convex:Instagram] New comment event:", args);
  },
});

/**
 * Handle a new @mention webhook event.
 */
export const onMention = internalMutation({
  args: {
    igAccountId: v.string(),
    mediaId: v.optional(v.string()),
    commentId: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    // TODO: Implement mention handling
    console.log("[Convex:Instagram] New mention event:", args);
  },
});

/**
 * Handle a new DM (Instagram Messaging) webhook event.
 */
export const onDirectMessage = internalMutation({
  args: {
    igAccountId: v.string(),
    senderId: v.string(),
    messageId: v.optional(v.string()),
    text: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (_ctx, args) => {
    // TODO: Implement DM storage / auto-reply logic
    console.log("[Convex:Instagram] New DM event:", args);
  },
});