import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { saveSocialTokenToConvex } from "../../../../lib/save-social-util";

export async function GET(request: NextRequest) {
  const { getToken } = await auth();
  // if (!convexToken) {
  //   console.error(
  //     "CLERK TOKEN IS MISSING. Check JWT Templates in Clerk Dashboard.",
  //   );
  //   return NextResponse.redirect(
  //     new URL("/onboarding?error=youtube", request.url),
  //   );
  // }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=youtube&message=Unauthorized",
        request.url,
      ),
    );
    ``;
  }

  // SECURITY: Retrieve studioId from secure cookie
  const studioId = request.cookies.get(
    `oauth_studioId_youtube_${userId}`,
  )?.value;
  if (!studioId) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=youtube&message=Studio_Context_missing",
        request.url,
      ),
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam =
    request.nextUrl.searchParams.get("state");
  const oauthError =
    request.nextUrl.searchParams.get("error");
  const oauthErrorDescription =
    request.nextUrl.searchParams.get("error_description");

  // SECURITY: Validate CSRF state token
  const storedState = request.cookies.get(
    `oauth_state_youtube_${userId}`,
  )?.value;

  if (
    !stateParam ||
    !storedState ||
    stateParam !== storedState
  ) {
    console.error("CSRF state validation failed", {
      stateParamExists: !!stateParam,
      storedStateExists: !!storedState,
      match: stateParam === storedState,
    });
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=youtube&message=CSRF_validation_failed",
        request.url,
      ),
    );
  }

  if (oauthError) {
    const message = encodeURIComponent(
      oauthErrorDescription ?? oauthError,
    );
    return NextResponse.redirect(
      new URL(
        `/onboarding?error=youtube&message=${message}`,
        request.url,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=youtube&message=Missing_authorization_code",
        request.url,
      ),
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=youtube&message=Missing_encryption_key",
        request.url,
      ),
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/youtube`,
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(
        new URL(
          "/onboarding?error=youtube&message=Missing_OAuth_tokens",
          request.url,
        ),
      );
    }

    oauth2Client.setCredentials(tokens);

    // const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    // const userInfo = await oauth2.userinfo.get();
    // const accountName = userInfo.data.name || userInfo.data.email || 'YouTube Account';

    // SECURITY: Get YouTube Channel ID using YouTube API
    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });
    const channelsResponse = await youtube.channels.list({
      part: ["snippet,contentDetails,statistics"],
      mine: true,
    });

    const channel = channelsResponse.data.items?.[0];
    if (!channel || !channel.id) {
      return NextResponse.redirect(
        new URL(
          "/onboarding?error=youtube&message=Failed to get YouTube channel ID",
          request.url,
        ),
      );
    }

    const channelId = channel.id;
    // Pull the actual YouTube channel name, fallback to a generic string
    const accountName =
      channel.snippet?.title || "YouTube Channel";
    // console.log(channel, channel.snippet, channelId);
    // Bonus: If you need the channel avatar for your UI later, it's sitting right here:
    // const avatarUrl = channel.snippet?.thumbnails?.default?.url;

    const convexToken = await getToken({
      template: "convex",
    });

    // Store OAuth token in the studio...
    await saveSocialTokenToConvex({
      convexToken: convexToken!, // Pass the raw string
      studioId: studioId as string,
      platform: "youtube",
      accountName: accountName,
      platformAccountId: channelId,
      rawAccessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      tokenExpiresAt: tokens.expiry_date ?? undefined,
    });

    // SECURITY: Clear the CSRF state and studioId cookies after successful validation
    const response = NextResponse.redirect(
      new URL("/onboarding?success=youtube", request.url),
    );
    response.cookies.delete(
      `oauth_state_youtube_${userId}`,
    );
    response.cookies.delete(
      `oauth_studioId_youtube_${userId}`,
    );
    return response;
  } catch (error) {
    console.error("YouTube OAuth callback failed:", error);
    return NextResponse.redirect(
      new URL(
        "/onboarding?error=youtube&message=OAuth_callback_failed",
        request.url,
      ),
    );
  }
}
