'use server'

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function setLastActiveStudio(studioSlug: string) {
  const { userId } =await auth();
  if (!userId) throw new Error("Unauthorized");

  // In Clerk v5, clerkClient is a function. 
  // If you are on v4, remove the () after clerkClient.
  const client = await clerkClient(); 
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      lastActiveStudioSlug: studioSlug
    }
  });
}

export async function clearLastActiveStudio() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      lastActiveStudioSlug: null
    }
  });
}