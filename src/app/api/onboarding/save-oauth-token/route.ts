import { api } from "../../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * API route to save OAuth token from cookie to Convex
 * Called by client after OAuth callback redirects back to onboarding page
 */
export async function POST(request: NextRequest) {
  try {
    const { platform, accountName, userId } = await request.json();

    if (!platform || !accountName || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate platform
    if (!["instagram", "youtube", "x", "tiktok"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    // Get encrypted token from cookie
    const encryptedToken = request.cookies.get(`oauth_token_${platform}`)?.value;

    if (!encryptedToken) {
      return NextResponse.json(
        { error: "No OAuth token found for platform" },
        { status: 400 }
      );
    }

    // Save to Convex
    try {
      const tokenId = await convex.mutation(api.auth.storeOAuthToken, {
        userId: userId as any, // Type will be properly handled by Convex
        platform: platform as any,
        accountName,
        encryptedOAuthToken: encryptedToken,
      });

      // Clear the OAuth token cookie
      const response = NextResponse.json(
        { success: true, tokenId },
        { status: 200 }
      );

      response.cookies.delete(`oauth_token_${platform}`);
      response.cookies.delete(`oauth_account_${platform}`);

      return response;
    } catch (error) {
      console.error("Error saving OAuth token to Convex:", error);
      return NextResponse.json(
        { error: "Failed to save token" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
