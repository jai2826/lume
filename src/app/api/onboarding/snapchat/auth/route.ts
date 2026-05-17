import { generateStateToken } from '@/lib/encryption';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Snapchat OAuth Authorization Endpoint
 * Redirects user to Snapchat OAuth consent screen
 * SECURITY: Uses cryptographically secure state token for CSRF protection
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Unauthorized', request.url)
    );
  }

  // Get studioId from query parameters
  const studioId = request.nextUrl.searchParams.get('studioId');
  if (!studioId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Studio not found', request.url)
    );
  }

  // Snapchat OAuth parameters
  const clientId = process.env.SNAPCHAT_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/snapchat/callback`;
  const scope = 'snapchat-marketing-api';

  if (!clientId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=snapchat&message=Missing Snapchat configuration', request.url)
    );
  }

  // SECURITY: Generate cryptographically secure CSRF state token
  const stateToken = generateStateToken();

  // Snapchat OAuth endpoint
  const snapchatAuthUrl = new URL('https://accounts.snapchat.com/accounts/oauth2/auth');
  snapchatAuthUrl.searchParams.set('client_id', clientId);
  snapchatAuthUrl.searchParams.set('redirect_uri', redirectUri);
  snapchatAuthUrl.searchParams.set('scope', scope);
  snapchatAuthUrl.searchParams.set('response_type', 'code');
  snapchatAuthUrl.searchParams.set('state', stateToken);

  // SECURITY: Store state in httpOnly, secure cookie (expires in 10 minutes)
  // Also store studioId in a separate cookie for the callback
  const response = NextResponse.redirect(snapchatAuthUrl.toString());
  response.cookies.set(`oauth_state_snapchat_${userId}`, stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  response.cookies.set(`oauth_studioId_snapchat_${userId}`, studioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
