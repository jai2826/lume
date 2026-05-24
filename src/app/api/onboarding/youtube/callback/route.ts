import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { youtubeOAuthConfig } from "@/lib/social-config";
import { saveSocialTokenToConvex } from "../../../../../lib/save-social-util";
import { api } from "../../../../../../convex/_generated/api";

export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.redirect(
      new URL(
        "/activestudios?error=youtube&message=Unauthorized",
        request.url,
      ),
    );
  }

  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) {
    return NextResponse.redirect(
      new URL(
        "/activestudios?error=youtube&message=Missing Convex auth token",
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

  if (!stateParam) {
    return NextResponse.redirect(
      new URL(
        "/activestudios?error=youtube&message=Missing state token",
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
      platform: "youtube",
    },
  );

  if (!pendingTransaction) {
    return NextResponse.redirect(
      new URL(
        "/activestudios?error=youtube&message=Pending transaction not found",
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
        `${youtubeOAuthConfig.failureRedirectPath(pendingTransaction.studioSlug ?? pendingTransaction.studioId)}&message=${message}`,
        request.url,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `${youtubeOAuthConfig.failureRedirectPath(pendingTransaction.studioSlug ?? pendingTransaction.studioId)}&message=Missing_authorization_code`,
        request.url,
      ),
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env[youtubeOAuthConfig.clientIdEnvVar],
    process.env[youtubeOAuthConfig.clientSecretEnvVar],
    youtubeOAuthConfig.redirectUri,
  );

  if (!process.env[youtubeOAuthConfig.clientIdEnvVar] || !process.env[youtubeOAuthConfig.clientSecretEnvVar]) {
    return NextResponse.redirect(
      new URL(
        `${youtubeOAuthConfig.failureRedirectPath(pendingTransaction.studioSlug ?? pendingTransaction.studioId)}&message=Missing_YouTube_configuration`,
        request.url,
      ),
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(
        new URL(
          `${youtubeOAuthConfig.failureRedirectPath(pendingTransaction.studioSlug ?? pendingTransaction.studioId)}&message=Missing_OAuth_tokens`,
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
          `${process.env.NEXT_PUBLIC_APP_URL}${youtubeOAuthConfig.failureRedirectPath(pendingTransaction.studioSlug ?? pendingTransaction.studioId)}&message=Failed_to_get_YouTube_channel_ID`,
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
      convexToken: convexToken!,
      studioId: pendingTransaction.studioId,
      platform: "youtube",
      accountName: accountName,
      platformAccountId: channelId,
      rawAccessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      tokenExpiresAt: tokens.expiry_date ?? undefined,
    });

    await convex.mutation(api.oauth.completePendingOAuthTransaction, {
      stateToken: stateParam,
      platform: "youtube",
    });

    const response = NextResponse.redirect(
      new URL(`${process.env.NEXT_PUBLIC_APP_URL}${youtubeOAuthConfig.successRedirectPath}`, request.url),
    );
    return response;
  } catch (error) {
    console.error("YouTube OAuth callback failed:", error);

    await convex.mutation(api.oauth.failPendingOAuthTransaction, {
      stateToken: stateParam,
      platform: "youtube",
      failureReason:
        error instanceof Error ? error.message : "OAuth callback failed",
    });

    return NextResponse.redirect(
      new URL(
        `${youtubeOAuthConfig.failureRedirectPath(pendingTransaction.studioSlug ?? pendingTransaction.studioId)}&message=OAuth_callback_failed`,
        request.url,
      ),
    );
  }
}
