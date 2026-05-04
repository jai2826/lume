"use client";

import { useUser } from "@clerk/nextjs";
import {
    ConvexProvider,
    ConvexReactClient,
    useConvex,
} from "convex/react";
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
function ConvexClerkSync({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const convexClient = useConvex();

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Sync Clerk user with Convex on first auth
    const syncUser = async () => {
      try {
        await convexClient.mutation(api.auth.createOrUpdateUser, {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
        });
      } catch (error) {
        console.error("Failed to sync user with Convex:", error);
        // Don't block app on sync error
      }
    };

    syncUser();
  }, [isLoaded, user, convexClient]);

  return <>{children}</>;
}

export function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <ConvexClerkSync>
        {children}
        </ConvexClerkSync>
    </ConvexProvider>
  );
}
