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
    const { userId, redirectToSignIn } = await auth();
    const url = request.nextUrl.pathname;

    // 1. Protect routes
    if (!userId && isProtectedRoute(request)) {
      return redirectToSignIn();
    }

    // 2. Handle Onboarding Logic
    if (userId) {
      try {
        // Use the specific ClerkId query we fixed above
        const user = await convex.query(
          api.auth.getUserByClerkId,
          { clerkId: userId },
        );

        // If user exists in Convex but hasn't completed onboarding
        if (
          user &&
          !user.hasCompletedOnboarding &&
          url !== "/onboarding"
        ) {
          return NextResponse.redirect(
            new URL("/onboarding", request.url),
          );
        }

        if (
          url.startsWith("/sign-in") ||
          url.startsWith("/sign-up")
        ) {
          return NextResponse.redirect(
            new URL("/onboarding", request.url),
          );
        }
      } catch (error) {
        console.error("Auth check failed:", error);
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
