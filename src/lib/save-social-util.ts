import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { encryptToken } from '@/lib/encryption';

interface SaveSocialTokenParams {
  convexToken: string; // <-- Change this to a string
  studioId: string;
  platform: 'youtube' | 'instagram' | 'x' | 'tiktok' | 'snapchat';
  accountName: string;
  platformAccountId: string;
  rawAccessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
}

export async function saveSocialTokenToConvex(params: SaveSocialTokenParams) {
  // Check the string
  if (!params.convexToken) {
    throw new Error('Convex token string is missing.');
  }

  // Initialize and authorize the client
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(params.convexToken); // <-- Inject the string

  // Encrypt and Store
  await convex.mutation(api.auth.storeOAuthToken, {
    studioId: params.studioId as any,
    platform: params.platform,
    accountName: params.accountName,
    platformAccountId: params.platformAccountId,
    encryptedOAuthToken: encryptToken(params.rawAccessToken, process.env.ENCRYPTION_KEY!),
    refreshToken: params.refreshToken,
    tokenExpiresAt: params.tokenExpiresAt,
  });
}