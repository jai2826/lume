import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  getAuthUserId,
  requireAuth,
  requireStudioAdmin,
} from "./lib/utils";

export const create = mutation({
  args: { name: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    const { userSession } = await requireAuth(ctx);
    const cleanSlug = args.slug
      .toLowerCase()
      .replace(/\s+/g, "-") // Step 1: Replace one or more spaces with a single hyphen
      .replace(/[^a-z0-9\-]+/g, "");

    const existingStudio = await ctx.db
      .query("studios")
      .withIndex("by_slug", (q) => q.eq("slug", cleanSlug))
      .first();

    if (existingStudio)
      throw new Error("This Studio Link is already taken.");

    // Generate a single reusable 10-character invite code
    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 12)
      .toUpperCase();

    const studioId = await ctx.db.insert("studios", {
      name: args.name,
      ownerId: userSession.subject,
      slug: cleanSlug,
      inviteCode,
    });

    await ctx.db.insert("studio_members", {
      studioId,
      userId: userSession.subject,
      role: "admin",
    });

    return { studioId: studioId, slug: cleanSlug };
  },
});

export const join = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const { userSession } = await requireAuth(ctx);
    const cleanCode = args.inviteCode.trim().toUpperCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) =>
        q.eq("clerkId", userSession.subject),
      )
      .first();
    // Find studio by invite code
    const targetStudio = await ctx.db
      .query("studios")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", cleanCode),
      )
      .first();

    if (!targetStudio) {
      throw new Error(
        "Invalid invite code. Please check and try again.",
      );
    }

    // If already a member, short-circuit
    const existingMember = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", userSession.subject),
      )
      .filter((q) =>
        q.eq(q.field("studioId"), targetStudio._id),
      )
      .first();

    if (existingMember) return targetStudio._id;

    // Create a join request for the studio owner to review
    await ctx.db.insert("join_requests", {
      studioId: targetStudio._id,
      userId: userSession.subject,
      displayName: user?.name || "Unknown User",
      status: "pending",
      createdAt: Date.now(),
    });

    return targetStudio._id;
  },
});

export const getJoinRequests = query({
  args: { studioId: v.id("studios") },
  handler: async (ctx, args) => {
    await requireStudioAdmin(ctx, args.studioId);

    const requests = await ctx.db
      .query("join_requests")
      .withIndex("by_studio", (q) =>
        q.eq("studioId", args.studioId),
      )
      .collect();

    return requests;
  },
});

export const acceptJoinRequest = mutation({
  args: {
    requestId: v.id("join_requests"),
    role: v.union(v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    // Ensure caller is studio admin
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    await requireStudioAdmin(ctx, request.studioId);

    // Insert membership and mark request accepted (or delete)
    await ctx.db.insert("studio_members", {
      studioId: request.studioId,
      userId: request.userId,
      role: args.role,
    });

    await ctx.db.patch(args.requestId, {
      status: "accepted",
    });

    return { success: true };
  },
});

export const rejectJoinRequest = mutation({
  args: { requestId: v.id("join_requests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");

    await requireStudioAdmin(ctx, request.studioId);

    await ctx.db.patch(args.requestId, {
      status: "rejected",
    });

    return { success: true };
  },
});

export const getMyStudios = query({
  handler: async (ctx) => {
    const { userSession } = await getAuthUserId(ctx);
    const studios: Doc<"studios">[] = [];
    if (!userSession) {
      return studios;
    }

    const memberships = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", userSession.subject),
      )
      .collect();

    for (const membership of memberships) {
      const studio = await ctx.db.get(membership.studioId);
      if (studio) {
        studios.push(studio);
      }
    }

    return studios;
  },
});

export const updateStudio = mutation({
  args: {
    studioId: v.id("studios"),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStudioAdmin(ctx, args.studioId);

    const cleanSlug = args.slug
      .toLowerCase()
      .replace(/\s+/g, "-") // Step 1: Replace one or more spaces with a single hyphen
      .replace(/[^a-z0-9\-]+/g, "");

    const existingStudio = await ctx.db
      .query("studios")
      .withIndex("by_slug", (q) => q.eq("slug", cleanSlug))
      .first();

    if (
      existingStudio &&
      existingStudio._id !== args.studioId
    ) {
      throw new Error("This Studio Link is already taken.");
    }

    await ctx.db.patch(args.studioId, {
      name: args.name.trim(),
      slug: cleanSlug,
    });

    return { success: true, slug: cleanSlug };
  },
});

export const deleteStudio = mutation({
  args: { studioId: v.id("studios") },
  handler: async (ctx, args) => {
    
      await requireStudioAdmin(ctx, args.studioId);


    const [memberships, socialKeys, shots, joinRequests] =
      await Promise.all([
        ctx.db
          .query("studio_members")
          .withIndex("by_studio", (q) =>
            q.eq("studioId", args.studioId),
          )
          .collect(),
        ctx.db
          .query("social_keys")
          .withIndex("by_studio", (q) =>
            q.eq("studioId", args.studioId),
          )
          .collect(),
        ctx.db
          .query("shots")
          .withIndex("by_studio", (q) =>
            q.eq("studioId", args.studioId),
          )
          .collect(),
        ctx.db
          .query("join_requests")
          .withIndex("by_studio", (q) =>
            q.eq("studioId", args.studioId),
          )
          .collect(),
      ]);

    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    for (const socialKey of socialKeys) {
      await ctx.db.delete(socialKey._id);
    }

    for (const shot of shots) {
      await ctx.db.delete(shot._id);
    }

    for (const request of joinRequests) {
      await ctx.db.delete(request._id);
    }

    await ctx.db.delete(args.studioId);

    return { success: true };
  },
});



/**
 * Get a studio by its slug.
 * This is used by StudioSlugSync to fetch the full studio data.
 * 
 * Security:
 * - Verifies the user is a member of this studio
 * - Prevents users from accessing studios they're not part of
 * - Returns studio data only if access is granted
 */
export const getStudioBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // Get the authenticated user
    const {userSession} = await requireAuth(ctx);

    // Find the studio by slug
    const studio = await ctx.db
      .query("studios")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!studio) {
      throw new Error("Studio not found");
    }

    // Verify the user is a member of this studio
    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) => q.eq("userId", userSession.subject))
      .filter((q) => q.eq(q.field("studioId"), studio._id))
      .first();

    if (!membership) {
      throw new Error("Unauthorized: Not a member of this studio");
    }

    // Return the studio data
    return studio;
  },
});