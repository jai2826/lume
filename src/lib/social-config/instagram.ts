import { SocialOAuthConfig } from "./types";

const callbackPath = "/api/onboarding/instagram/callback";

export function getInstagramRedirectUri() {
  return process.env.NODE_ENV === "production"
    ? `${process.env.NEXT_PUBLIC_APP_URL}${callbackPath}`
    : `${process.env.NEXT_PUBLIC_NGROK_URL}${callbackPath}`;
}

export const instagramOAuthConfig: SocialOAuthConfig = {
  platform: "instagram",
  name: "Instagram",
  authEndpoint: "https://www.instagram.com/oauth/authorize",
  tokenEndpoint: "https://api.instagram.com/oauth/access_token",
  callbackPath,
  scopes: [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
  ],
  clientIdEnvVar: "NEXT_PUBLIC_INSTAGRAM_APP_ID",
  clientSecretEnvVar: "INSTAGRAM_APP_SECRET",
  redirectUri: getInstagramRedirectUri(),
  successRedirectPath: "/oauth/connected?platform=instagram",
  failureRedirectPath: () => "/onboarding?error=instagram",
};