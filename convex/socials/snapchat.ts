import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from ".././_generated/server";
import { internal } from ".././_generated/api";

/**
 * Convex: Snapchat Login Kit Integration
 *
 * Token behaviour (server-side flow):
 *   access_token  — expires in 1 hour
 *   refresh_token — long-lived, rotated on each refresh
 *
 * Refresh docs:
 *   https://developers.snap.com/snap-kit/login-kit/overview#step-3-refreshing-the-access-token
 *
 * Refresh endpoint: POST https://accounts.snapchat.com/accounts/oauth2/token
 *   grant_type=refresh_token
 *   refresh_token=YOUR_REFRESH_TOKEN
 *   client_id=YOUR_CLIENT_ID
 *   client_secret=YOUR_CLIENT_SECRET  (server-side flow)
 */

// ─────────────────────────────────────────────────────────────
// TOKEN REFRESH
// ─────────────────────────────────────────────────────────────

/**
 * Exchange a refresh token for a new access token.
 *
 * Call this on-demand before any Snapchat API call when
 * tokenExpiresAt is within 5 minutes or already expired.
 *
 * NOTE: Snapchat rotates the refresh token on each refresh —
 * always store the new refresh_token from the response.
 */
export const refreshSnapchatToken = internalAction({
  args: {
    socialKeyId: v.id("social_keys"),
    decryptedRefreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.SNAPCHAT_CLIENT_ID!;
    const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET!;

    if (!clientId || !clientSecret) {
      console.error(
        "[Snapchat] Missing SNAPCHAT_CLIENT_ID or SNAPCHAT_CLIENT_SECRET"
      );
      return { success: false, error: "Missing credentials" };
    }

    // ✅ CORRECT token endpoint and body format for Login Kit
    const response = await fetch(
      "https://accounts.snapchat.com/accounts/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: args.decryptedRefreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Snapchat] Token refresh failed for key ${args.socialKeyId}:`,
        errorText
      );
      return { success: false, error: errorText };
    }

    const data = (await response.json()) as {
      access_token: string;
      refresh_token?: string; // rotated — always store the new one
      expires_in: number;
      token_type: string;
    };

    const newExpiresAt = Date.now() + data.expires_in * 1000;

    await ctx.runMutation(internal.socials.snapchat.updateTokenExpiry, {
      socialKeyId: args.socialKeyId,
      tokenExpiresAt: newExpiresAt,
    });

    return {
      success: true,
      newAccessToken: data.access_token,
      newRefreshToken: data.refresh_token, // caller must re-encrypt and store
      expiresAt: newExpiresAt,
    };
  },
});

// ─────────────────────────────────────────────────────────────
// DB MUTATIONS
// ─────────────────────────────────────────────────────────────

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

export const updateEncryptedTokens = internalMutation({
  args: {
    socialKeyId: v.id("social_keys"),
    encryptedOAuthToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.socialKeyId, {
      encryptedOAuthToken: args.encryptedOAuthToken,
      ...(args.refreshToken && { refreshToken: args.refreshToken }),
      tokenExpiresAt: args.tokenExpiresAt,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────

/**
 * Get all Snapchat keys expiring within 5 minutes.
 * Used for on-demand refresh before making API calls.
 */
export const getExpiringSnapchatTokens = internalQuery({
  args: {},
  handler: async (ctx) => {
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;

    const allSnapchatKeys = await ctx.db
      .query("social_keys")
      .filter((q) => q.eq(q.field("platform"), "snapchat"))
      .collect();

    return allSnapchatKeys.filter(
      (key) =>
        key.tokenExpiresAt === undefined ||
        key.tokenExpiresAt < fiveMinutesFromNow
    );
  },
});