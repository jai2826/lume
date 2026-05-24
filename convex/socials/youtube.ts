import { v } from "convex/values";
import { internal } from ".././_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from ".././_generated/server";

/**
 * Convex: YouTube Integration
 *
 * Internal actions used by background jobs to refresh YouTube access tokens.
 */

export const refreshYouTubeToken = internalAction({
  args: {
    socialKeyId: v.id("social_keys"),
    refreshToken: v.string(),
  },
  handler: async (
    ctx: any,
    args: { socialKeyId: string; refreshToken: string },
  ) => {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "Missing YouTube OAuth configuration",
      );
    }

    const response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: args.refreshToken,
        }).toString(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[YouTube] Token refresh failed for key ${args.socialKeyId}:`,
        errorText,
      );
      return { success: false, error: errorText };
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
      scope?: string;
    };

    const newExpiresAt =
      Date.now() + data.expires_in * 1000;

    await ctx.runMutation(
      internal.socials.youtube.updateTokenExpiry,
      {
        socialKeyId: args.socialKeyId,
        tokenExpiresAt: newExpiresAt,
      },
    );

    return {
      success: true,
      newToken: data.access_token,
      expiresAt: newExpiresAt,
    };
  },
});

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

export const getExpiringYouTubeTokens = internalQuery({
  args: { studioId: v.id("studios") },
  handler: async (ctx, args) => {
    const fourteenDaysFromNow =
      Date.now() + 14 * 24 * 60 * 60 * 1000;

    const allYouTubeKeys = await ctx.db
      .query("social_keys")
      .withIndex("by_studio_platform", (q) =>
        q.eq("studioId", args.studioId).eq("platform", "youtube"),
      )
      .collect();

    return allYouTubeKeys.filter(
      (key) =>
        key.tokenExpiresAt !== undefined &&
        key.tokenExpiresAt < fourteenDaysFromNow,
    );
  },
});
