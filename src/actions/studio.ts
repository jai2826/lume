"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function setLastActiveStudio(
  studioId: string,
  studioSlug: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      lastActiveStudioId: studioId, // STORE THE ID
      lastActiveStudioSlug: studioSlug, // STORE THE SLUG
    },
  });

  revalidatePath("/", "layout");
}

export async function clearLastActiveStudio() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      lastActiveStudioId: null, // WIPE THE ID
      lastActiveStudioSlug: null, // WIPE THE SLUG
    },
  });

  revalidatePath("/", "layout");
}
