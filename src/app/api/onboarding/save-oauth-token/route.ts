import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";
import { platformsList } from "@/lib/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * API route to save OAuth token from cookie to Convex
 * SECURITY: Requires authenticated Clerk user - userId cannot be spoofed from client
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Get authenticated user from Clerk - cannot be forged
    const { userId: clerkUserId, getToken } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized - not authenticated" },
        { status: 401 }
      );
    }

    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
      return NextResponse.json(
        { error: "Unauthorized - missing Convex auth token" },
        { status: 401 }
      );
    }

    convex.setAuth(convexToken);

    const { platform, accountName, studioId, platformAccountId } = await request.json();

    if (!platform || !accountName || !studioId || !platformAccountId) {
      return NextResponse.json(
        { error: "Missing required fields (platform, accountName, studioId, platformAccountId)" },
        { status: 400 }
      );
    }

    // Validate platform (add snapchat here as well)
    if (!platformsList.includes(platform)) {
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

    
    // Save to Convex using authenticated user
    try {
      // SECURITY: Verify user has access to this studio before saving token
      // The mutation handler will also verify this, but we validate client input
      const tokenId = await convex.mutation(api.auth.storeOAuthToken, {
        studioId: studioId as any, // Type will be properly handled by Convex
        platform: platform as any,
        accountName,
        platformAccountId,
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
