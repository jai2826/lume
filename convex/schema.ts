import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const shotPlatformEntryValidator = v.object({
  status: v.union(
    v.literal("idle"),
    v.literal("generating"),
    v.literal("ready"),
  ),
  generatedText: v.string(),
  mediaAssetUrl: v.string(),
});

export const shotPlatformsValidator = v.object({
  twitter: shotPlatformEntryValidator,
  instagram: shotPlatformEntryValidator,
  youtube: shotPlatformEntryValidator,
  tiktok: shotPlatformEntryValidator,
  snapchat: shotPlatformEntryValidator,
});

export const shotInputsValidator = v.object({
  text: v.string(),
  images: v.array(v.string()),
  videos: v.array(v.string()),
});

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    hasCompletedOnboarding: v.boolean(),
  }).index("by_clerkId", ["clerkId"]),

  social_keys: defineTable({
    userId: v.id("users"),
    platform: v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("x"),
      v.literal("tiktok"),
      v.literal("snapchat"),
    ),
    accountName: v.string(),
    encryptedOAuthToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_platform", ["userId", "platform"]),

  shots: defineTable({
    title: v.optional(v.string()),
    inputs: shotInputsValidator,
    platforms: shotPlatformsValidator,
  }),
});
