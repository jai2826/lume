import { api } from "../convex/_generated/api";
import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Id } from "../convex/_generated/dataModel";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);

export default clerkMiddleware(
  async (auth, request: NextRequest) => {
    // Get auth session
    const { userId, redirectToSignIn } = await  auth();

    // If not authenticated and trying to access protected routes, redirect to sign-in
    if (!userId && isProtectedRoute(request)) {
      return  redirectToSignIn();
    }

    // If authenticated, check onboarding status
    if (userId) {
      try {
        // Get user from Convex by clerkId
        const users = await convex.query(
          api.auth.getUserLinkedAccounts,
          {
            userId: userId as Id<'users'>, // Type assertion - we'll fix this with proper Convex auth
          },
        );

        // TODO: This is a simplified check. Proper implementation requires:
        // 1. Get userId from Convex by clerkId
        // 2. Check hasCompletedOnboarding flag
        // 3. Redirect accordingly

        // For now, we'll rely on server-side checks in page.tsx
      } catch (error) {
        console.error(
          "Failed to check onboarding status:",
          error,
        );
        // Continue without blocking on error
      }
    }

    return NextResponse.next();
  },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
