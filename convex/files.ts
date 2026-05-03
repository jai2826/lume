import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const storageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => await ctx.storage.getUrl(storageId),
});
