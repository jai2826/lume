import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { instagramOAuthConfig } from "@/lib/social-config";
import { saveSocialTokenToConvex } from "@/lib/save-social-util";
import { api } from "../../../../../../convex/_generated/api";

/**
 * Instagram Business Login Callback Endpoint
 *
 * Flow:
 * 1. Validate CSRF state token
 * 2. Exchange authorization code → short-lived token (api.instagram.com)
 * 3. Exchange short-lived → long-lived token (graph.instagram.com) [60 days]
 * 4. Fetch user profile (id, username)
 * 5. Save encrypted token to Convex
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
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

  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Missing Convex auth token",
        request.url,
      ),
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam =
    request.nextUrl.searchParams.get("state");
  const oauthError =
    request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get(
    "error_description",
  );

  if (!stateParam) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Missing state token",
        request.url,
      ),
    );
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(convexToken);

  const pendingTransaction = await convex.query(
    api.oauth.getPendingOAuthTransaction,
    {
      stateToken: stateParam,
      platform: "instagram",
    },
  );

  if (!pendingTransaction) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=instagram&message=Pending transaction not found",
        request.url,
      ),
    );
  }

  // Handle user denied permission
  if (oauthError) {
    const message = encodeURIComponent(
      errorDescription ?? oauthError,
    );
    return NextResponse.redirect(
      new URL(
        `${instagramOAuthConfig.failureRedirectPath()}&message=${message}`,
        request.url,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `${instagramOAuthConfig.failureRedirectPath()}&message=Missing authorization code`,
        request.url,
      ),
    );
  }

  const clientId = process.env[instagramOAuthConfig.clientIdEnvVar]!;
  const clientSecret = process.env[instagramOAuthConfig.clientSecretEnvVar]!;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(
        `${instagramOAuthConfig.failureRedirectPath()}&message=Missing Instagram configuration`,
        request.url,
      ),
    );
  }

  try {
    // ─────────────────────────────────────────────────
    // STEP 1: Exchange code for SHORT-LIVED access token
    // Endpoint: https://api.instagram.com/oauth/access_token
    // ─────────────────────────────────────────────────
    const tokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          redirect_uri: instagramOAuthConfig.redirectUri,
          code,
        }).toString(),
      },
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error(
        "Instagram token exchange failed:",
        errorData,
      );
      return NextResponse.redirect(
        new URL(
          `${instagramOAuthConfig.failureRedirectPath()}&message=Token exchange failed`,
          request.url,
        ),
      );
    }

    // Response shape: { access_token, user_id, permissions }
    // NOTE: token response wraps in data array per newer API
    const tokenRaw = (await tokenResponse.json()) as
      | {
          access_token: string;
          user_id: string;
          permissions?: string;
        }
      | {
          data: Array<{
            access_token: string;
            user_id: string;
            permissions?: string;
          }>;
        };

    let shortLivedToken: string;
    let instagramUserId: string;

    if (
      "data" in tokenRaw &&
      Array.isArray(tokenRaw.data)
    ) {
      shortLivedToken = tokenRaw.data[0].access_token;
      instagramUserId = tokenRaw.data[0].user_id;
    } else if ("access_token" in tokenRaw) {
      shortLivedToken = tokenRaw.access_token;
      instagramUserId = tokenRaw.user_id;
    } else {
      throw new Error(
        "Unexpected token response shape from Instagram",
      );
    }

    if (!shortLivedToken || !instagramUserId) {
      return NextResponse.redirect(
        new URL(
          `${instagramOAuthConfig.failureRedirectPath()}&message=Missing access token`,
          request.url,
        ),
      );
    }

    // ─────────────────────────────────────────────────
    // STEP 2: Exchange short-lived → LONG-LIVED token (60 days)
    // Endpoint: https://graph.instagram.com/access_token
    // This MUST be server-side (includes app secret)
    // ─────────────────────────────────────────────────
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`,
    );

    let accessToken = shortLivedToken;
    let tokenExpiresAt: number | undefined;

    if (longLivedResponse.ok) {
      const longLivedData =
        (await longLivedResponse.json()) as {
          access_token: string;
          token_type: string;
          expires_in: number;
        };
      accessToken =
        longLivedData.access_token ?? shortLivedToken;
      tokenExpiresAt = longLivedData.expires_in
        ? Date.now() + longLivedData.expires_in * 1000
        : undefined;
    } else {
      // Non-fatal: fall back to short-lived token
      console.warn(
        "Failed to get long-lived token, proceeding with short-lived token",
      );
    }

    // ─────────────────────────────────────────────────
    // STEP 3: Fetch Instagram user profile
    // Endpoint: https://graph.instagram.com/me
    // ─────────────────────────────────────────────────
    let accountName = "Instagram Account";
    let platformAccountId = instagramUserId;

    try {
      const profileResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name&access_token=${accessToken}`,
      );

      if (profileResponse.ok) {
        const profile = (await profileResponse.json()) as {
          id: string;
          username?: string;
          name?: string;
        };
        platformAccountId = profile.id ?? instagramUserId;
        accountName =
          profile.username ??
          profile.name ??
          `Instagram Account (${profile.id})`;
      }
    } catch (profileError) {
      console.error(
        "Failed to fetch Instagram profile:",
        profileError,
      );
      // Continue with defaults — non-fatal
    }

    // ─────────────────────────────────────────────────
    // STEP 4: Get Convex auth token and save to DB
    // ─────────────────────────────────────────────────
    const convexToken = await getToken({
      template: "convex",
    });

    if (!convexToken) {
      return NextResponse.redirect(
        new URL(
          `${instagramOAuthConfig.failureRedirectPath()}&message=Missing Convex auth token`,
          request.url,
        ),
      );
    }

    await saveSocialTokenToConvex({
      convexToken,
      studioId: pendingTransaction.studioId,
      platform: "instagram",
      accountName,
      platformAccountId,
      rawAccessToken: accessToken,
      // Instagram Business Login does not issue a refresh_token.
      // Long-lived tokens are refreshed via /refresh_access_token before expiry.
      tokenExpiresAt,
    });

    await convex.mutation(api.oauth.completePendingOAuthTransaction, {
      stateToken: stateParam,
      platform: "instagram",
    });

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${instagramOAuthConfig.successRedirectPath}`,
    );
    return response;
  } catch (error) {
    console.error(
      "Instagram OAuth callback failed:",
      error,
    );

    await convex.mutation(api.oauth.failPendingOAuthTransaction, {
      stateToken: stateParam,
      platform: "instagram",
      failureReason:
        error instanceof Error ? error.message : "OAuth callback failed",
    });

    return NextResponse.redirect(
      new URL(
        `${instagramOAuthConfig.failureRedirectPath()}&message=OAuth callback failed`,
        request.url,
      ),
    );
  }
}
