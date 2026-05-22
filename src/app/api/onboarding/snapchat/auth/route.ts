import { generateStateToken } from "@/lib/encryption";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Snapchat Login Kit Authorization Endpoint
 *
 * Redirects user to Snapchat OAuth consent screen.
 *
 * Uses Snapchat Login Kit (server-side Authorization Code Flow):
 * Docs: https://developers.snap.com/snap-kit/login-kit/overview
 *
 * App setup: https://kit.snapchat.com/manage → Create App → Enable Login Kit
 *            Then: Versions → [Your App] → Login Kit → add redirect URI
 *            Generate a Confidential OAuth 2.0 Client ID (not public)
 *
 * SECURITY: Uses Clerk-scoped cookies (per-user) to prevent cross-user state confusion
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Unauthorized`
    );
  }

  const studioId = request.nextUrl.searchParams.get("studioId");
  if (!studioId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Studio not found`
    );
  }

  const clientId = process.env.SNAPCHAT_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Missing Snapchat configuration`
    );
  }

  // Use ngrok URL in dev — Snapchat requires HTTPS and the redirect_uri
  // must exactly match what is registered in the Snap Developer Portal
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/snapchat/callback`
      : `${process.env.NEXT_PUBLIC_NGROK_URL}/api/onboarding/snapchat/callback`;

  // SECURITY: Generate cryptographically secure CSRF state token
  const stateToken = generateStateToken();

  /**
   * ✅ CORRECT Login Kit authorization endpoint:
   *    https://accounts.snapchat.com/accounts/oauth2/auth
   *
   * ✅ CORRECT Login Kit scopes (full URL format required):
   *    https://auth.snapchat.com/oauth2/api/user.display_name  — user's display name
   *    https://auth.snapchat.com/oauth2/api/user.external_id   — unique app-scoped user ID
   *    https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar — optional avatar
   */
  const snapchatAuthUrl = new URL(
    "https://accounts.snapchat.com/login/oauth2/authorize"
  );
  snapchatAuthUrl.searchParams.set("client_id", clientId);
  snapchatAuthUrl.searchParams.set("redirect_uri", redirectUri);
  snapchatAuthUrl.searchParams.set("response_type", "code");
  snapchatAuthUrl.searchParams.set(
    "scope",
    [
      "https://auth.snapchat.com/oauth2/api/user.display_name",
      "https://auth.snapchat.com/oauth2/api/user.external_id",
    ].join(" ")
  );
  snapchatAuthUrl.searchParams.set("state", stateToken);

  // SECURITY: Store state and studioId in httpOnly, secure, userId-scoped cookies
  const response = NextResponse.redirect(snapchatAuthUrl.toString());

  response.cookies.set(`oauth_state_snapchat_${userId}`, stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  response.cookies.set(`oauth_studioId_snapchat_${userId}`, studioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}