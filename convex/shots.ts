import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import {
  shotInputsValidator,
  shotPlatformsValidator,
} from "./schema";
import { requireAuth } from "./lib/utils";

const defaultPlatformEntry = () => ({
  status: "idle" as const,
  generatedText: "",
  mediaAssetUrl: "",
});

/** Live dashboard document: latest shot, or `shotId` when deep-linked after compose. */
export const dashboardShot = query({
  args: { shotId: v.optional(v.id("shots")) },
  handler: async (ctx, { shotId }) => {
    if (shotId) {
      const doc = await ctx.db.get(shotId);
      return doc ?? null;
    }
    const all = await ctx.db.query("shots").collect();
    if (all.length === 0) return null;
    return all.reduce((newest, s) =>
      s._creationTime > newest._creationTime ? s : newest,
    );
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
    const { clerkId } = await requireAuth(ctx);

    return await ctx.db.insert("shots", {
      title,
      inputs,
      studioId,
      createdBy: clerkId,
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
