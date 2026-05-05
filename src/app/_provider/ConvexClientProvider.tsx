"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  ConvexReactClient,
  useMutation,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);

/**
 * Inner component to access Convex and Clerk user
 * Syncs Clerk user with Convex on first authentication
 */
function ConvexClerkSync({
  children,
}: {
  children: ReactNode;
}) {
  // 1. We also need to check isSignedIn to ensure we don't fire early
  const { user, isLoaded, isSignedIn } = useUser();

  // 2. Use the hook instead of the raw client. It's safer and type-strict.
  const createOrUpdateUser = useMutation(
    api.auth.createOrUpdateUser,
  );

  useEffect(() => {
    // 3. Strictly wait for the entire auth handshake to finish
    if (!isLoaded || !isSignedIn || !user) return;

    const syncUser = async () => {
      try {
        await createOrUpdateUser({
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            undefined,
        });
      } catch (error) {
        console.error(
          "Failed to sync user with Convex:",
          error,
        );
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, createOrUpdateUser]);

  return <>{children}</>;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    // CRITICAL FIX: This links Clerk's JWT to Convex's headers
    <ConvexProviderWithClerk
      client={convex}
      useAuth={useAuth}>
      <ConvexClerkSync>{children}</ConvexClerkSync>
    </ConvexProviderWithClerk>
  );
}
