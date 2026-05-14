import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isPublicRoute = createRouteMatcher([
  "/", // Marketing Landing Page
  // CRITICAL: OAuth callbacks and Webhooks must be public!
  "/api/auth/youtube/callback",
  "/api/auth/instagram/callback",
  "/api/auth/tiktok/callback",
  "/api/auth/x/callback",
  "/api/auth/snapchat/callback",
  "/api/webhooks/clerk",
  "/api/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId, redirectToSignIn } = await auth();

  // Guard every non-public, non-auth route.
  if (!isPublicRoute(request) && !isAuthRoute(request)) {
    if (!userId) {
      return redirectToSignIn();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
