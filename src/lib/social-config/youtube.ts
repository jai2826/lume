import { SocialOAuthConfig } from "./types";

const callbackPath = "/api/onboarding/youtube/callback";

export function getYouTubeRedirectUri() {
  return process.env.NODE_ENV === "production"
    ? `${process.env.NEXT_PUBLIC_APP_URL}${callbackPath}`
    : `${process.env.NEXT_PUBLIC_NGROK_URL}${callbackPath}`;
}

export const youtubeOAuthConfig: SocialOAuthConfig = {
  platform: "youtube",
  name: "YouTube",
  authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  callbackPath,
  scopes: [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
  ],
  clientIdEnvVar: "YOUTUBE_CLIENT_ID",
  clientSecretEnvVar: "YOUTUBE_CLIENT_SECRET",
  redirectUri: getYouTubeRedirectUri(),
  successRedirectPath: "/oauth/connected?platform=youtube",
  failureRedirectPath: (studioIdOrSlug?: string) =>
    `/${studioIdOrSlug ?? "activestudios"}/onboarding?error=youtube`,
};