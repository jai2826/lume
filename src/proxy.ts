import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/", // Marketing Landing Page
  "/sign-in(.*)",
  "/sign-up(.*)",
  // CRITICAL: OAuth callbacks and Webhooks must be public!
  "/api/auth/youtube/callback",
  "/api/webhooks/clerk",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl.pathname;
  const { userId, redirectToSignIn } = await auth();

  // 1. Core Security: Bounce unauthenticated users trying to access private routes
  if (!isPublicRoute(request)) {
    // If they aren't logged in, Clerk handles the redirect to /sign-in safely
    if (!userId) return redirectToSignIn(); 
  }

  // 2. Logged-In User Routing Logic
  if (userId) {
    // If a logged-in user tries to view the marketing page or sign-in pages, 
    // push them straight to the application hub.
    if (url === "/" || url.startsWith("/sign-in") || url.startsWith("/sign-up")) {
      return NextResponse.redirect(new URL("/selectstudio", request.url));
    }
    
    // Do NOT put database queries here. 
    // Let your /selectstudio page load, fetch the studios on the client side, 
    // and auto-redirect them to /dashboard if needed.
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