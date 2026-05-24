import { generateStateToken } from "@/lib/encryption";
import { instagramOAuthConfig } from "@/lib/social-config";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";

/**
 * Instagram Business Login Authorization Endpoint
 * Redirects user to Instagram OAuth consent screen
 *
 * Uses Business Login for Instagram (Instagram API with Instagram Login)
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 *
 * SECURITY: Uses Clerk-scoped cookies (per-user) to prevent cross-user state confusion
 */
export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Unauthorized",
        request.url,
      ),
    );
  }

  const studioId =
    request.nextUrl.searchParams.get("studioId");
  const studioSlug =
    request.nextUrl.searchParams.get("studioSlug") ?? undefined;
  if (!studioId) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Studio not found",
        request.url,
      ),
    );
  }

  const clientId = process.env[instagramOAuthConfig.clientIdEnvVar];
  const convexToken = await getToken({ template: "convex" });

  if (!clientId) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Missing Instagram configuration",
        request.url,
      ),
    );
  }

  if (!convexToken) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Missing Convex auth token",
        request.url,
      ),
    );
  }

  // SECURITY: Generate cryptographically secure CSRF state token
  const stateToken = generateStateToken();

  /**
   * ✅ CORRECT: Business Login endpoint is https://www.instagram.com/oauth/authorize
   * (NOT graph.instagram.com — that is only for API calls after auth)
   * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-1--get-authorization
   */
  const instagramAuthUrl = new URL(
    instagramOAuthConfig.authEndpoint,
  );
  instagramAuthUrl.searchParams.set("client_id", clientId);
  instagramAuthUrl.searchParams.set("redirect_uri", instagramOAuthConfig.redirectUri);
  instagramAuthUrl.searchParams.set("response_type", "code");
  instagramAuthUrl.searchParams.set("scope", instagramOAuthConfig.scopes.join(","));
  instagramAuthUrl.searchParams.set("state", stateToken);

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(convexToken);

  await convex.mutation(api.oauth.createPendingOAuthTransaction, {
    stateToken,
    platform: "instagram",
    userId,
    studioId: studioId as any,
    studioSlug,
    requestedScopes: instagramOAuthConfig.scopes,
    authEndpoint: instagramOAuthConfig.authEndpoint,
    callbackPath: instagramOAuthConfig.callbackPath,
  });

  return NextResponse.redirect(instagramAuthUrl.toString());
}
