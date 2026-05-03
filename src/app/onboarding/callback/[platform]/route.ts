import { encryptToken } from "@/lib/encryption";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Platform-specific OAuth configuration
 */
const platformConfig: Record<
  string,
  {
    tokenEndpoint: string;
    accountInfoEndpoint: (accessToken: string) => string;
    parseAccountName: (data: any) => string;
  }
> = {
  instagram: {
    tokenEndpoint: "https://graph.instagram.com/v18.0/oauth/access_token",
    accountInfoEndpoint: (token) =>
      `https://graph.instagram.com/v18.0/me?fields=username&access_token=${token}`,
    parseAccountName: (data) => data.username || "Instagram Account",
  },
  youtube: {
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    accountInfoEndpoint: (token) =>
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`,
    parseAccountName: (data) => data.name || data.email || "YouTube Account",
  },
  x: {
    tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
    accountInfoEndpoint: (token) =>
      `https://api.twitter.com/2/users/me?user.fields=username`,
    parseAccountName: (data) => data.data?.username || "X Account",
  },
  tiktok: {
    tokenEndpoint: "https://open.tiktokapis.com/v2/oauth/token/",
    accountInfoEndpoint: (token) =>
      `https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name`,
    parseAccountName: (data) => data.data?.user?.display_name || "TikTok Account",
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform?.toLowerCase();

    // Validate platform
    if (!["instagram", "youtube", "x", "tiktok"].includes(platform)) {
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=Invalid platform`,
          request.nextUrl.origin
        )
      );
    }

    // Get OAuth code and state from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors from provider
    if (error) {
      const errorDescription = searchParams.get("error_description") || error;
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=${encodeURIComponent(errorDescription)}`,
          request.nextUrl.origin
        )
      );
    }

    // Validate code and state
    if (!code) {
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=Missing authorization code`,
          request.nextUrl.origin
        )
      );
    }

    if (!state) {
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=Missing state parameter`,
          request.nextUrl.origin
        )
      );
    }

    // TODO: Verify state token to prevent CSRF attacks
    // const storedState = request.cookies.get(`oauth_state_${platform}`)?.value;
    // if (state !== storedState) {
    //   return NextResponse.redirect(...error redirect...);
    // }

    // Get encryption key
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error("ENCRYPTION_KEY not set in environment");
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=Server configuration error`,
          request.nextUrl.origin
        )
      );
    }

    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(platform, code, request.nextUrl.origin);

    if (!accessToken) {
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=Failed to exchange code for token`,
          request.nextUrl.origin
        )
      );
    }

    // Get account info from platform
    const accountName = await getAccountName(platform, accessToken);

    if (!accountName) {
      return NextResponse.redirect(
        new URL(
          `/onboarding?error=${platform}&message=Failed to retrieve account info`,
          request.nextUrl.origin
        )
      );
    }

    // Encrypt the access token
    const encryptedToken = encryptToken(accessToken, encryptionKey);

    // TODO: Get userId from Clerk and Convex
    // For MVP, we'll store the encrypted token in sessionStorage via redirect
    // and handle it on the client side

    // Store encrypted token in session (will be picked up by client)
    const response = NextResponse.redirect(
      new URL(
        `/onboarding?success=true&platform=${platform}`,
        request.nextUrl.origin
      )
    );

    // Store encrypted token in a secure, httpOnly cookie
    response.cookies.set({
      name: `oauth_token_${platform}`,
      value: encryptedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Store account name for client to use
    response.cookies.set({
      name: `oauth_account_${platform}`,
      value: accountName,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    const platform = params.platform || "unknown";
    return NextResponse.redirect(
      new URL(
        `/onboarding?error=${platform}&message=An unexpected error occurred`,
        request.nextUrl.origin
      )
    );
  }
}

/**
 * Exchange OAuth code for access token
 */
async function exchangeCodeForToken(
  platform: string,
  code: string,
  origin: string
): Promise<string | null> {
  try {
    const config = platformConfig[platform];
    if (!config) return null;

    const redirectUri = `${origin}/onboarding/callback/${platform}`;
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      console.error(`Missing OAuth credentials for ${platform}`);
      return null;
    }

    // Platform-specific token exchange logic
    const tokenResponse = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      console.error(`Token exchange failed for ${platform}:`, tokenResponse.statusText);
      return null;
    }

    const tokenData = await tokenResponse.json();

    // Extract access token (varies by platform)
    const accessToken =
      tokenData.access_token || tokenData.data?.access_token || null;

    if (!accessToken) {
      console.error(`No access token in response from ${platform}`);
      return null;
    }

    return accessToken;
  } catch (error) {
    console.error(`Error exchanging code for ${platform}:`, error);
    return null;
  }
}

/**
 * Get account name from platform
 */
async function getAccountName(
  platform: string,
  accessToken: string
): Promise<string | null> {
  try {
    const config = platformConfig[platform];
    if (!config) return null;

    const response = await fetch(config.accountInfoEndpoint(accessToken));

    if (!response.ok) {
      console.error(`Failed to fetch account info from ${platform}`);
      return null;
    }

    const data = await response.json();
    return config.parseAccountName(data);
  } catch (error) {
    console.error(`Error fetching account info from ${platform}:`, error);
    return null;
  }
}
