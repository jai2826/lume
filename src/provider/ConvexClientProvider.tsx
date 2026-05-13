"use client";

import { useAuth } from "@clerk/nextjs";
import {
  ConvexReactClient
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);


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
      {children}
    </ConvexProviderWithClerk>
  );
}
