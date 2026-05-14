import { Doc } from "../_generated/dataModel";
import {
  MutationCtx,
  QueryCtx,
} from "../_generated/server";


export async function requireStudioAdmin(
  ctx: QueryCtx | MutationCtx,
  studioId: Doc<"studios">["_id"],
) {
  const { userSession } = await requireAuth(ctx);
  const membership = await ctx.db
    .query("studio_members")
    .withIndex("by_user", (q) =>
      q.eq("userId", userSession.subject),
    )
    .filter((q) => q.eq(q.field("studioId"), studioId))
    .first();

  if (!membership || membership.role !== "admin") {
    throw new Error(
      "Unauthorized: Only admins can manage this studio.",
    );
  }

  return { userSession: userSession, membership };
}

/**
 * STRICT: Throws an error if not logged in. Use for Mutations.
 * Returns the clerkId.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return { userSession: identity }; // This is the clerkId
}

/**
 * SOFT: Returns null if not logged in. Use for Queries.
 * Returns the clerkId or null.
 */
export async function getAuthUserId(
  ctx: QueryCtx | MutationCtx,
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return { userSession: null };
  }
  return { userSession: identity }; // This is the clerkId
}
