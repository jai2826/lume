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
]);
const isPrivateRoute = createRouteMatcher([
  "/selectstudio(.*)",
  "/joinstudio(.*)",
  "/onboarding(.*)",
  "/studio(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl.pathname;
  const { userId, redirectToSignIn } = await auth();

  // 1. Core Security: Bounce unauthenticated users trying to access private routes
  if (isPrivateRoute(request)) {
    if (!userId) return redirectToSignIn();
  }

  // 2. Logged-In User Routing Logic
  

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
