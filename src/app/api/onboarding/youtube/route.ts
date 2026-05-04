import { encryptToken } from '@/lib/encryption';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=youtube&message=Unauthorized', request.url)
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const oauthError = request.nextUrl.searchParams.get('error');
  const oauthErrorDescription = request.nextUrl.searchParams.get('error_description');

  if (oauthError) {
    const message = encodeURIComponent(oauthErrorDescription ?? oauthError);
    return NextResponse.redirect(
      new URL(`/onboarding?error=youtube&message=${message}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/onboarding?error=youtube&message=Missing authorization code', request.url)
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return NextResponse.redirect(
      new URL('/onboarding?error=youtube&message=Missing encryption key', request.url)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/youtube`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(
        new URL('/onboarding?error=youtube&message=Missing OAuth tokens', request.url)
      );
    }

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const accountName = userInfo.data.name || userInfo.data.email || 'YouTube Account';

    const convexUser = await convex.mutation(api.auth.createOrUpdateUser, {
      clerkId: userId,
    });

    if (!convexUser) {
      return NextResponse.redirect(
        new URL('/onboarding?error=youtube&message=Failed to resolve user', request.url)
      );
    }

    await convex.mutation(api.auth.storeOAuthToken, {
      userId: convexUser._id,
      platform: 'youtube',
      accountName,
      encryptedOAuthToken: encryptToken(accessToken, encryptionKey),
      refreshToken,
      tokenExpiresAt: tokens.expiry_date ?? undefined,
    });

    return NextResponse.redirect(new URL('/onboarding?success=youtube', request.url));
  } catch (error) {
    console.error('YouTube OAuth callback failed:', error);
    return NextResponse.redirect(
      new URL('/onboarding?error=youtube&message=OAuth callback failed', request.url)
    );
  }
}