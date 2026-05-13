import {
  MutationCtx,
  QueryCtx,
} from "../_generated/server";

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
  return { clerkId: identity.subject }; // This is the clerkId
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
    return null;
  }
  return { clerkId: identity.subject }; // This is the clerkId
}
