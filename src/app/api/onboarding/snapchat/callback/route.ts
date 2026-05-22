import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { saveSocialTokenToConvex } from "@/lib/save-social-util";

/**
 * Snapchat Login Kit Callback Endpoint
 *
 * Flow:
 * 1. Validate CSRF state token
 * 2. Exchange authorization code → access token + refresh token
 * 3. Fetch user profile via Login Kit GraphQL endpoint
 * 4. Save encrypted token to Convex
 *
 * Docs: https://developers.snap.com/snap-kit/login-kit/overview
 *
 * Token details (server-side flow):
 *   access_token:  expires in 1 hour
 *   refresh_token: long-lived, used to get new access tokens silently
 */
export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Unauthorized`
    );
  }

  // SECURITY: Retrieve studioId from userId-scoped secure cookie
  const studioId = request.cookies.get(
    `oauth_studioId_snapchat_${userId}`
  )?.value;

  if (!studioId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Studio context missing`
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  // SECURITY: Validate CSRF state token
  const storedState = request.cookies.get(
    `oauth_state_snapchat_${userId}`
  )?.value;

  if (!stateParam || !storedState || stateParam !== storedState) {
    console.error("Snapchat CSRF state validation failed", {
      stateParamExists: !!stateParam,
      storedStateExists: !!storedState,
      match: stateParam === storedState,
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=CSRF validation failed`
    );
  }

  // Handle user denied permission
  if (oauthError) {
    const message = encodeURIComponent(errorDescription ?? oauthError);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=${message}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Missing authorization code`
    );
  }

  const clientId = process.env.SNAPCHAT_CLIENT_ID!;
  const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET!;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Missing Snapchat configuration`
    );
  }

  // ⚠️ CRITICAL: redirect_uri in token exchange MUST exactly match
  // what was sent in the authorization request
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/snapchat/callback`
      : `${process.env.NEXT_PUBLIC_NGROK_URL}/api/onboarding/snapchat/callback`;

  try {
    // ─────────────────────────────────────────────────
    // STEP 1: Exchange code for access + refresh tokens
    //
    // ✅ CORRECT token endpoint (Login Kit):
    //    https://accounts.snapchat.com/accounts/oauth2/token
    //
    // Server-side flow: send client_secret in the request BODY
    // (NOT as Basic auth — that is for Marketing API only)
    // ─────────────────────────────────────────────────
    const tokenResponse = await fetch(
      "https://accounts.snapchat.com/accounts/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Snapchat token exchange failed:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Token exchange failed`
      );
    }

    const tokens = (await tokenResponse.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type: string;
      scope?: string;
    };

    const accessToken = tokens.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Missing access token`
      );
    }

    // ─────────────────────────────────────────────────
    // STEP 2: Fetch Snapchat user profile
    //
    // ✅ CORRECT Login Kit user info endpoint (GraphQL):
    //    https://kit.snapchat.com/v1/me
    //
    // Returns: displayName, externalId, bitmoji avatar
    // ─────────────────────────────────────────────────
    let accountName = "Snapchat Account";
    let platformAccountId = `snapchat_${Date.now()}`; // fallback

    try {
      const meResponse = await fetch("https://kit.snapchat.com/v1/me", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `{
            me {
              externalId
              displayName
              bitmoji {
                avatar
              }
            }
          }`,
        }),
      });

      if (meResponse.ok) {
        const meData = (await meResponse.json()) as {
          data: {
            me: {
              externalId: string;
              displayName?: string;
              bitmoji?: { avatar?: string };
            };
          };
        };

        const me = meData.data?.me;
        if (me) {
          platformAccountId = me.externalId;
          accountName = me.displayName ?? `Snapchat (${me.externalId})`;
        }
      } else {
        const errText = await meResponse.text();
        console.warn("Failed to fetch Snapchat user info:", errText);
      }
    } catch (profileError) {
      console.error("Failed to fetch Snapchat profile:", profileError);
      // Non-fatal — continue with defaults
    }

    // ─────────────────────────────────────────────────
    // STEP 3: Get Convex auth token and save to DB
    // ─────────────────────────────────────────────────
    const convexToken = await getToken({ template: "convex" });

    if (!convexToken) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=Missing Convex auth token`
      );
    }

    await saveSocialTokenToConvex({
      convexToken,
      studioId,
      platform: "snapchat",
      accountName,
      platformAccountId,
      rawAccessToken: accessToken,
      // Snapchat Login Kit DOES issue a refresh token — store it
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? Date.now() + tokens.expires_in * 1000
        : undefined,
    });

    // SECURITY: Clear CSRF state and studioId cookies after success
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/oauth/connected?platform=snapchat`
    );
    response.cookies.delete(`oauth_state_snapchat_${userId}`);
    response.cookies.delete(`oauth_studioId_snapchat_${userId}`);
    return response;
  } catch (error) {
    console.error("Snapchat OAuth callback failed:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=snapchat&message=OAuth callback failed`
    );
  }
}