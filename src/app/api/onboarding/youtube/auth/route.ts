import { generateStateToken } from '@/lib/encryption';
import { auth } from '@clerk/nextjs/server';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=youtube&message=Unauthorized', request.url)
    );
  }

  // Get studioId from query parameters
  const studioId = request.nextUrl.searchParams.get('studioId');
  if (!studioId) {
    return NextResponse.redirect(
      new URL('/onboarding?error=youtube&message=Studio_not_found', request.url)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/youtube`
  );

  // const scopes = [
  //   'https://www.googleapis.com/auth/youtube',
  //   'https://www.googleapis.com/auth/youtube.channel-memberships.creator',
  //   'https://www.googleapis.com/auth/youtube.upload',
  //   'https://www.googleapis.com/auth/youtube.force-ssl',
  //   'https://www.googleapis.com/auth/youtube.readonly',
  //   'https://www.googleapis.com/auth/youtubepartner',
  //   'https://www.googleapis.com/auth/youtubepartner-channel-audit' 
  // ];
  const scopes = [
  // Required to fetch the channel ID, name, and avatar (the snippet)
  'https://www.googleapis.com/auth/youtube.readonly',
  
  // Required for your platform to actually push videos to their channel
  'https://www.googleapis.com/auth/youtube.upload'
];

  // SECURITY: Generate cryptographically secure CSRF state token
  const stateToken = generateStateToken();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: stateToken,
  });

  // SECURITY: Store state in httpOnly, secure cookie (expires in 10 minutes)
  // Also store studioId in a separate cookie for the callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(`oauth_state_youtube_${userId}`, stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });
  
  response.cookies.set(`oauth_studioId_youtube_${userId}`, studioId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
