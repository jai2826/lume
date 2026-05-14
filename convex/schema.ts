import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ==========================================
// VALIDATORS (Reusable shapes)
// ==========================================

export const shotPlatformEntryValidator = v.object({
  status: v.union(
    v.literal("idle"),
    v.literal("generating"),
    v.literal("ready"),
    v.literal("published"),
    v.literal("failed"),
  ),
  generatedText: v.optional(v.string()), // Optional until generation is complete
  mediaAssetUrl: v.optional(v.string()), // Optional until generation is complete
});

export const shotPlatformsValidator = v.object({
  x: shotPlatformEntryValidator,
  instagram: shotPlatformEntryValidator,
  youtube: shotPlatformEntryValidator,
  tiktok: shotPlatformEntryValidator,
  snapchat: shotPlatformEntryValidator,
});

export const shotInputsValidator = v.object({
  text: v.string(),
  images: v.optional(v.array(v.string())),
  videos: v.optional(v.array(v.string())),
  audios: v.optional(v.array(v.string())),
});

// ==========================================
// CORE SCHEMA
// ==========================================

export default defineSchema({
  // 1. GLOBAL USERS
  users: defineTable({
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  // 2. THE WORKSPACES (Studios)
  studios: defineTable({
    name: v.string(),
    ownerId: v.string(),
    slug: v.string(),
    // Single reusable invite code tied to the studio
    inviteCode: v.string(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"])
    .index("by_inviteCode", ["inviteCode"]),

  // 3. ACCESS CONTROL (Who can see what Studio)
  studio_members: defineTable({
    studioId: v.id("studios"),
    userId: v.string(), // Clerk ID of the member
    role: v.union(
      v.literal("admin"),
      v.literal("editor"),
      v.literal("viewer"),
    ),
  })
    .index("by_studio", ["studioId"])
    .index("by_user", ["userId"]),

  // 4. Pending join requests created when a user submits an invite code.
  // Owners can approve a request and assign a role at acceptance time.
  join_requests: defineTable({
    studioId: v.id("studios"),
    userId: v.string(),
    displayName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    createdAt: v.number(),
  }).index("by_studio", ["studioId"]),

  // 4. THE VAULT (OAuth Tokens for Platforms)
  social_keys: defineTable({
    studioId: v.id("studios"), // Keys belong to the Studio
    platform: v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("x"),
      v.literal("tiktok"),
      v.literal("snapchat"),
    ),
    accountName: v.string(), // e.g., "Purejoy Shorts"
    platformAccountId: v.string(), // e.g., The actual YouTube Channel ID or X User ID
    encryptedOAuthToken: v.string(), // Your short-lived access token
    refreshToken: v.optional(v.string()), // The golden key for background workers
    tokenExpiresAt: v.optional(v.number()),
  })
    .index("by_studio", ["studioId"])
    .index("by_studio_platform", ["studioId", "platform"])
    // This exact index prevents saving the same channel twice to the same studio
    .index("by_studio_platform_account", [
      "studioId",
      "platform",
      "platformAccountId",
    ]),

  // 5. THE CONTENT (Shots)
  shots: defineTable({
    studioId: v.id("studios"), // Shots are strictly isolated to a Studio
    createdBy: v.string(),
    title: v.optional(v.string()),
    inputs: shotInputsValidator,
    platforms: shotPlatformsValidator,
  }).index("by_studio", ["studioId"]),
});
