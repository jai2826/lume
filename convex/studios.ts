import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/utils";
import { Doc } from "./_generated/dataModel";



export const create = mutation({
  args: { name: v.string(), slug: v.string() },
  handler: async (ctx, args) => {
    const {clerkId} = await requireAuth(ctx);
    const cleanSlug = args.slug.toLowerCase().replace(/[^a-z0-9\-]+/g, "");

    const existingStudio = await ctx.db
      .query("studios")
      .withIndex("by_slug", (q) => q.eq("slug", cleanSlug))
      .first();

    if (existingStudio) throw new Error("This Studio Link is already taken.");

    // Generate TWO distinct 10-character codes
    const editorCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    const viewerCode = Math.random().toString(36).substring(2, 12).toUpperCase();

    const studioId = await ctx.db.insert("studios", {
      name: args.name,
      ownerId: clerkId,
      slug: cleanSlug,
      editorInviteCode: editorCode,
      viewerInviteCode: viewerCode,
    });

    await ctx.db.insert("studio_members", {
      studioId,
      userId: clerkId,
      role: "admin",
    });

    return studioId;
  },
});

export const join = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const {clerkId} = await requireAuth(ctx);
    const cleanCode = args.inviteCode.trim().toUpperCase();

    let targetStudio = null;
    let assignedRole: "editor" | "viewer" | null = null;

    // 1. Check if it's an Editor Code
    const editorMatch = await ctx.db
      .query("studios")
      .withIndex("by_editorInviteCode", (q) => q.eq("editorInviteCode", cleanCode))
      .first();

    if (editorMatch) {
      targetStudio = editorMatch;
      assignedRole = "editor";
    } else {
      // 2. If not, check if it's a Viewer Code
      const viewerMatch = await ctx.db
        .query("studios")
        .withIndex("by_viewerInviteCode", (q) => q.eq("viewerInviteCode", cleanCode))
        .first();

      if (viewerMatch) {
        targetStudio = viewerMatch;
        assignedRole = "viewer";
      }
    }

    // If neither matched, the code is garbage
    if (!targetStudio || !assignedRole) {
      throw new Error("Invalid invite code. Please check and try again.");
    }

    // 3. Check if they are already a member
    const existingMember = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) => q.eq("userId", clerkId))
      .filter((q) => q.eq(q.field("studioId"), targetStudio._id))
      .first();

    if (existingMember) return targetStudio._id;

    // 4. Add them with the dynamically determined role!
    await ctx.db.insert("studio_members", {
      studioId: targetStudio._id,
      userId: clerkId,
      role: assignedRole, 
    });

    return targetStudio._id;
  },
});

export const getMyStudios = query({
  handler: async (ctx) => {
    const {clerkId} = await requireAuth(ctx);
    const memberships = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) => q.eq("userId", clerkId))
      .collect();

    const studios = [];
    for (const membership of memberships) {
      const studio = await ctx.db.get(membership.studioId);
      if (studio) {
        studios.push({
          _id: studio._id,
          name: studio.name,
          slug: studio.slug,
          role: membership.role,
        });
      }
    }

    return studios;
  },
});