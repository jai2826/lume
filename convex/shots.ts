import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { requireAuth } from "./lib/utils";
import {
    shotInputsValidator,
    shotPlatformsValidator,
} from "./schema";

const defaultPlatformEntry = () => ({
  status: "idle" as const,
  selected: false,
  postType: "",
  notes: "",
  generatedText: "",
  mediaAssetUrl: "",
});

async function requireStudioMembership(
  ctx: Parameters<typeof requireAuth>[0],
  studioId: string,
) {
  const { userSession } = await requireAuth(ctx);

  const membership = await ctx.db
    .query("studio_members")
    .withIndex("by_user", (q) =>
      q.eq("userId", userSession.subject),
    )
    .filter((q) => q.eq(q.field("studioId"), studioId))
    .first();

  if (!membership) {
    throw new Error("Unauthorized: Not a member of this studio");
  }

  return { userSession };
}

/** Live dashboard document: latest shot, or `shotId` when deep-linked after compose. */
export const dashboardShot = query({
  args: { shotId: v.optional(v.id("shots")) },
  handler: async (ctx, { shotId }) => {
    const { userSession } = await requireAuth(ctx);

    const memberships = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", userSession.subject),
      )
      .collect();

    const allowedStudioIds = new Set(
      memberships.map((membership) => membership.studioId),
    );

    if (shotId) {
      const doc = await ctx.db.get(shotId);
      if (!doc || !allowedStudioIds.has(doc.studioId)) {
        return null;
      }
      return doc;
    }

    let latestShot: Awaited<ReturnType<typeof ctx.db.get>> | null = null;

    for (const membership of memberships) {
      const shots = await ctx.db
        .query("shots")
        .withIndex("by_studio", (q) =>
          q.eq("studioId", membership.studioId),
        )
        .collect();

      for (const shot of shots) {
        if (!latestShot || shot._creationTime > latestShot._creationTime) {
          latestShot = shot;
        }
      }
    }

    return latestShot;
  },
});

export const listStudioShots = query({
  args: { studioId: v.id("studios") },
  handler: async (ctx, { studioId }) => {
    await requireStudioMembership(ctx, studioId);

    const shots = await ctx.db
      .query("shots")
      .withIndex("by_studio", (q) =>
        q.eq("studioId", studioId),
      )
      .collect();

    return shots.sort(
      (left, right) => right._creationTime - left._creationTime,
    );
  },
});

export const getShotById = query({
  args: { shotId: v.id("shots") },
  handler: async (ctx, { shotId }) => {
    const shot = await ctx.db.get(shotId);
    if (!shot) {
      return null;
    }

    await requireStudioMembership(ctx, shot.studioId);

    return shot;
  },
});

export const createShot = mutation({
  args: {
    title: v.optional(v.string()),
    inputs: shotInputsValidator,
    platforms: v.optional(shotPlatformsValidator),
    studioId: v.id("studios"),
  },
  handler: async (
    ctx,
    { title, inputs, platforms, studioId },
  ) => {
    const { userSession } = await requireAuth(ctx);

    const membership = await ctx.db
      .query("studio_members")
      .withIndex("by_user", (q) =>
        q.eq("userId", userSession.subject),
      )
      .filter((q) => q.eq(q.field("studioId"), studioId))
      .first();

    if (!membership) {
      throw new Error("Unauthorized: Not a member of this studio");
    }

    return await ctx.db.insert("shots", {
      title,
      inputs,
      studioId,
      createdBy: userSession.subject,
      platforms: platforms ?? {
        x: defaultPlatformEntry(),
        instagram: defaultPlatformEntry(),
        youtube: defaultPlatformEntry(),
        tiktok: defaultPlatformEntry(),
        snapchat: defaultPlatformEntry(),
      },
    });
  },
});
