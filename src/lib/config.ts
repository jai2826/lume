/**
 * OAUTH PLATFORMS CONFIGURATION
 * ===========================================
 * Centralized configuration for all OAuth platforms
 * Each platform defines its own scopes, endpoints, and requirements
 */

export type PlatformType = "instagram" | "youtube" | "tiktok" | "snapchat" | "x";

export interface OAuthPlatformConfig {
  name: string;
  authEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scopes: string[];
  clientIdEnvVar: string;
  clientSecretEnvVar: string;
  description: string;
  // Platform-specific field mappings
  userIdField: string;
  usernameField: string;
  accountIdField: string;
  // Whether this platform supports refresh tokens
  supportsRefreshToken: boolean;
  // Token expiration time in seconds (for those without refresh tokens)
  tokenExpirationSeconds?: number;
}

/**
 * PLATFORM CONFIGURATIONS
 * Add new platforms here - all API routes will automatically support them
 */
export const OAUTH_PLATFORMS: Record<PlatformType, OAuthPlatformConfig> = {
  instagram: {
    name: "Instagram",
    authEndpoint: "https://api.instagram.com/oauth/authorize",
    tokenEndpoint: "https://api.instagram.com/oauth/access_token",
    userInfoEndpoint: "https://graph.instagram.com",
    scopes: [
      "instagram_business_basic",
      "instagram_business_content_publish",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
    ],
    clientIdEnvVar: "NEXT_PUBLIC_INSTAGRAM_APP_ID",
    clientSecretEnvVar: "INSTAGRAM_APP_SECRET",
    description: "Connect your Instagram Business Account",
    userIdField: "user_id",
    usernameField: "username",
    accountIdField: "id",
    supportsRefreshToken: false,
    tokenExpirationSeconds: 60 * 24 * 60 * 60, // 60 days for long-lived tokens
  },

  youtube: {
    name: "YouTube",
    authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    userInfoEndpoint: "https://www.googleapis.com/youtube/v3/channels",
    scopes: [
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    clientIdEnvVar: "NEXT_PUBLIC_YOUTUBE_APP_ID",
    clientSecretEnvVar: "YOUTUBE_APP_SECRET",
    description: "Connect your YouTube Channel",
    userIdField: "id",
    usernameField: "title",
    accountIdField: "id",
    supportsRefreshToken: true,
    tokenExpirationSeconds: 3600, // 1 hour
  },

  tiktok: {
    name: "TikTok",
    authEndpoint: "https://www.tiktok.com/v1/oauth/authorize",
    tokenEndpoint: "https://open.tiktokapis.com/v1/oauth/token",
    userInfoEndpoint: "https://open.tiktokapis.com/v1/user/info",
    scopes: [
      "user.info.basic",
      "video.list",
      "video.create",
      "video.publish",
    ],
    clientIdEnvVar: "NEXT_PUBLIC_TIKTOK_APP_ID",
    clientSecretEnvVar: "TIKTOK_APP_SECRET",
    description: "Connect your TikTok Account",
    userIdField: "open_id",
    usernameField: "display_name",
    accountIdField: "open_id",
    supportsRefreshToken: true,
    tokenExpirationSeconds: 3600,
  },

  snapchat: {
    name: "Snapchat",
    authEndpoint: "https://accounts.snapchat.com/accounts/oauth2/authorize",
    tokenEndpoint: "https://accounts.snapchat.com/accounts/oauth2/token",
    userInfoEndpoint: "https://adsapi.snapchat.com/v1/me",
    scopes: [
      "snapchat-marketing-api",
      "snapchat-social-api",
    ],
    clientIdEnvVar: "NEXT_PUBLIC_SNAPCHAT_APP_ID",
    clientSecretEnvVar: "SNAPCHAT_APP_SECRET",
    description: "Connect your Snapchat Account",
    userIdField: "sub",
    usernameField: "username",
    accountIdField: "id",
    supportsRefreshToken: true,
    tokenExpirationSeconds: 3600,
  },

  x: {
    name: "X (Twitter)",
    authEndpoint: "https://twitter.com/i/oauth2/authorize",
    tokenEndpoint: "https://api.twitter.com/2/oauth2/token",
    userInfoEndpoint: "https://api.twitter.com/2/users/me",
    scopes: [
      "tweet.read",
      "tweet.write",
      "users.read",
      "follows.read",
      "follows.write",
    ],
    clientIdEnvVar: "NEXT_PUBLIC_X_APP_ID",
    clientSecretEnvVar: "X_APP_SECRET",
    description: "Connect your X Account",
    userIdField: "id",
    usernameField: "username",
    accountIdField: "id",
    supportsRefreshToken: true,
    tokenExpirationSeconds: 7200, // 2 hours
  },
};

/**
 * Get configuration for a specific platform
 */
export function getPlatformConfig(platform: PlatformType): OAuthPlatformConfig {
  const config = OAUTH_PLATFORMS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return config;
}

/**
 * Get environment variables for a platform
 */
export function getPlatformEnvVars(platform: PlatformType): {
  clientId: string;
  clientSecret: string;
} {
  const config = getPlatformConfig(platform);

  const clientId = process.env[config.clientIdEnvVar];
  const clientSecret = process.env[config.clientSecretEnvVar];

  if (!clientId) {
    throw new Error(`Missing ${config.clientIdEnvVar} for ${platform}`);
  }
  if (!clientSecret) {
    throw new Error(`Missing ${config.clientSecretEnvVar} for ${platform}`);
  }

  return { clientId, clientSecret };
}

/**
 * Platform-specific webhook configurations
 */
export const WEBHOOK_CONFIGS: Record<
  PlatformType,
  {
    path: string;
    verifyTokenEnvVar: string;
    events: string[];
  }
> = {
  instagram: {
    path: "/api/webhooks/instagram",
    verifyTokenEnvVar: "WEBHOOK_VERIFY_TOKEN_INSTAGRAM",
    events: ["comments", "messages", "mentions"],
  },
  youtube: {
    path: "/api/webhooks/youtube",
    verifyTokenEnvVar: "WEBHOOK_VERIFY_TOKEN_YOUTUBE",
    events: ["video.uploaded", "video.published", "comment.added"],
  },
  tiktok: {
    path: "/api/webhooks/tiktok",
    verifyTokenEnvVar: "WEBHOOK_VERIFY_TOKEN_TIKTOK",
    events: ["video.create", "video.publish", "comment.create"],
  },
  snapchat: {
    path: "/api/webhooks/snapchat",
    verifyTokenEnvVar: "WEBHOOK_VERIFY_TOKEN_SNAPCHAT",
    events: ["campaign.updated", "ad.created"],
  },
  x: {
    path: "/api/webhooks/x",
    verifyTokenEnvVar: "WEBHOOK_VERIFY_TOKEN_X",
    events: ["tweet.created", "mention.added"],
  },
};

/**
 * List of all supported platforms (for validation)
 */
export const SUPPORTED_PLATFORMS = Object.keys(OAUTH_PLATFORMS) as PlatformType[];