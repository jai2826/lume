import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { saveSocialTokenToConvex } from '../../../../lib/save-social-util';

/**
 * Snapchat OAuth Callback Endpoint
 * Handles the OAuth code exchange and stores encrypted token
 * SECURITY: Validates CSRF state token and uses authenticated user context
 */
export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Unauthorized', request.url)
    );
  }

  // SECURITY: Retrieve studioId from secure cookie
  const studioId = request.cookies.get(`oauth_studioId_snapchat_${userId}`)?.value;
  if (!studioId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Studio context missing', request.url)
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const stateParam = request.nextUrl.searchParams.get('state');
  const oauthError = request.nextUrl.searchParams.get('error');
  const errorDescription = request.nextUrl.searchParams.get('error_description');

  // SECURITY: Validate CSRF state token
  const storedState = request.cookies.get(`oauth_state_snapchat_${userId}`)?.value;
  
  if (!stateParam || !storedState || stateParam !== storedState) {
    console.error('Snapchat CSRF state validation failed', {
      stateParamExists: !!stateParam,
      storedStateExists: !!storedState,
      match: stateParam === storedState,
    });
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=CSRF validation failed', request.url)
    );
  }

  if (oauthError) {
    const message = encodeURIComponent(errorDescription ?? oauthError);
    return NextResponse.redirect(
      new URL(`/onboarding?error=snapchat&message=${message}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Missing authorization code', request.url)
    );
  }

  const clientId = process.env.SNAPCHAT_CLIENT_ID;
  const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/snapchat`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Missing Snapchat configuration', request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Snapchat token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/onboarding?error=snapchat&message=Token exchange failed', request.url)
      );
    }

    interface TokenData {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    }
    
    const tokens = (await tokenResponse.json()) as TokenData;
    const accessToken = tokens.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL('/onboarding?error=snapchat&message=Missing access token', request.url)
      );
    }

    // Get user info from Snapchat API to extract platform account ID
    let accountName = 'Snapchat Account';
    let platformAccountId = 'snapchat_' + Date.now(); // Fallback ID
    
    try {
      const meResponse = await fetch('https://adsapi.snapchat.com/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (meResponse.ok) {
        interface MeData {
          me: {
            id: string;
            email?: string;
            name?: string;
          };
        }
        const meData = (await meResponse.json()) as MeData;
        platformAccountId = meData.me.id; // Use the Snapchat user/org ID
        accountName = meData.me.email || meData.me.name || `Snapchat Account (${meData.me.id})`;
      }
    } catch (error) {
      console.error('Failed to fetch Snapchat user info:', error);
      // Continue with default values
    }

    const convexToken = await getToken({
      template: 'convex',
    });

    if (!convexToken) {
      return NextResponse.redirect(
        new URL('/onboarding?error=snapchat&message=Missing Convex auth token', request.url)
      );
    }

    await saveSocialTokenToConvex({
      convexToken,
      studioId,
      platform: 'snapchat',
      accountName,
      platformAccountId,
      rawAccessToken: accessToken,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt: tokens.expires_in
        ? Date.now() + tokens.expires_in * 1000
        : undefined,
    });

    // SECURITY: Clear the CSRF state and studioId cookies after successful validation
    const response = NextResponse.redirect(
      new URL('/onboarding?success=snapchat', request.url)
    );
    response.cookies.delete(`oauth_state_snapchat_${userId}`);
    response.cookies.delete(`oauth_studioId_snapchat_${userId}`);
    return response;
  } catch (error) {
    console.error('Snapchat OAuth callback failed:', error);
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=OAuth callback failed', request.url)
    );
  }
}
