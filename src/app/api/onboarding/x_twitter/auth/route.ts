import { generateStateToken } from "@/lib/encryption";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * X (Twitter) OAuth 2.0 Authorization Endpoint
 *
 * Uses OAuth 2.0 Authorization Code Flow with PKCE.
 * X requires PKCE for all OAuth 2.0 flows — there is no way around it.
 *
 * PKCE (Proof Key for Code Exchange):
 *   1. Generate a random `code_verifier` (43-128 chars)
 *   2. SHA256 hash it → `code_challenge`
 *   3. Send `code_challenge` in the auth URL
 *   4. Send `code_verifier` in the token exchange (callback)
 *   X verifies they match — prevents auth code interception attacks.
 *
 * App type: Web App (Confidential Client)
 *   → Has both Client ID and Client Secret
 *   → Token exchange uses HTTP Basic auth
 *
 * Developer Portal setup:
 *   developer.x.com → Projects & Apps → [Your App] →
 *   User authentication settings → OAuth 2.0 ON →
 *   Type of App: Web App → add Callback URI
 *
 * Docs: https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=x&message=Unauthorized`
    );
  }

  const studioId = request.nextUrl.searchParams.get("studioId");
  if (!studioId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=x&message=Studio not found`
    );
  }

  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=x&message=Missing X configuration`
    );
  }

  // Use ngrok in dev — X requires HTTPS callback URIs
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/x/callback`
      : `${process.env.NEXT_PUBLIC_NGROK_URL}/api/onboarding/x/callback`;

  // ── PKCE: Generate code_verifier + code_challenge ──────────
  // code_verifier: cryptographically random string (43-128 chars)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");

  // code_challenge: SHA256(code_verifier), base64url encoded
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  // ── CSRF state token ───────────────────────────────────────
  const stateToken = generateStateToken();

  /**
   * X OAuth 2.0 Authorization URL
   *
   * Scopes:
   *   tweet.read      — read tweets (required for most endpoints)
   *   tweet.write     — post, delete tweets
   *   users.read      — read user profile info
   *   offline.access  — REQUIRED to get a refresh_token
   *                     Without this, access_token expires in 2 hours
   *                     and there is no way to refresh it silently.
   */
  const xAuthUrl = new URL("https://x.com/i/oauth2/authorize");
  xAuthUrl.searchParams.set("response_type", "code");
  xAuthUrl.searchParams.set("client_id", clientId);
  xAuthUrl.searchParams.set("redirect_uri", redirectUri);
  xAuthUrl.searchParams.set(
    "scope",
    "tweet.read tweet.write users.read offline.access"
  );
  xAuthUrl.searchParams.set("state", stateToken);
  xAuthUrl.searchParams.set("code_challenge", codeChallenge);
  xAuthUrl.searchParams.set("code_challenge_method", "S256");

  // Store state, studioId, and code_verifier in userId-scoped cookies
  // code_verifier MUST be stored server-side — it is needed in the callback
  const response = NextResponse.redirect(xAuthUrl.toString());

  response.cookies.set(`oauth_state_x_${userId}`, stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  response.cookies.set(`oauth_studioId_x_${userId}`, studioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // Store code_verifier — required for token exchange in callback
  response.cookies.set(`oauth_pkce_x_${userId}`, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}