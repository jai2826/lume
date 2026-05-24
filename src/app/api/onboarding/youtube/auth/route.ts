import { generateStateToken } from "@/lib/encryption";
import { youtubeOAuthConfig } from "@/lib/social-config";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../../convex/_generated/api";

export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();
  const studioId = request.nextUrl.searchParams.get("studioId");
  const studioSlug = request.nextUrl.searchParams.get("studioSlug") ?? undefined;
  if (!studioId) {
    return NextResponse.redirect(
      new URL("/activestudios?error=youtube&message=Studio_not_found", request.url)
    );
  }

  if (!userId) {
    return NextResponse.redirect(
      new URL(`/${studioSlug ?? studioId}/onboarding?error=youtube&message=Unauthorized`, request.url)
    );
  }

  const convexToken = await getToken({ template: "convex" });
  if (!convexToken) {
    return NextResponse.redirect(
      new URL(`/${studioSlug ?? studioId}/onboarding?error=youtube&message=Missing_Convex_auth_token`, request.url)
    );
  }


  const oauth2Client = new google.auth.OAuth2(
    process.env[youtubeOAuthConfig.clientIdEnvVar],
    process.env[youtubeOAuthConfig.clientSecretEnvVar],
    youtubeOAuthConfig.redirectUri
  );

  // SECURITY: Generate cryptographically secure CSRF state token
  const stateToken = generateStateToken();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: youtubeOAuthConfig.scopes,
    prompt: "consent",
    state: stateToken,
  });

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(convexToken);

  await convex.mutation(api.oauth.createPendingOAuthTransaction, {
    stateToken,
    platform: "youtube",
    userId,
    studioId: studioId as any,
    studioSlug,
    requestedScopes: youtubeOAuthConfig.scopes,
    authEndpoint: youtubeOAuthConfig.authEndpoint,
    callbackPath: youtubeOAuthConfig.callbackPath,
  });

  return NextResponse.redirect(authUrl);
}
