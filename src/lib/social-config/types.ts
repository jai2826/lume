export type SocialOAuthPlatform = "instagram" | "youtube";

export interface SocialOAuthConfig {
  platform: SocialOAuthPlatform;
  name: string;
  authEndpoint: string;
  tokenEndpoint: string;
  callbackPath: string;
  scopes: string[];
  clientIdEnvVar: string;
  clientSecretEnvVar: string;
  redirectUri: string;
  successRedirectPath: string;
  failureRedirectPath: (studioIdOrSlug?: string) => string;
}