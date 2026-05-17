import { generateStateToken } from "@/lib/encryption";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const studioId = url.searchParams.get("studioId");

  if (!studioId) {
    return NextResponse.json(
      { error: "Missing studioId" },
      { status: 400 }
    );
  }

  const state = generateStateToken();

  // Store state + studioId in HttpOnly cookie
  const payload = Buffer.from(
    JSON.stringify({ state, studioId })
  ).toString("base64");

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/instagram/callback`;
  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Missing Client ID in environment" },
      { status: 500 }
    );
  }

  // ✅ CORRECTED: Instagram native scopes (not facebook scopes)
  const scopes = [         // Access user profile data
    "instagram_business_basic", // Basic business account access
    "instagram_business_content_publish", // Publish posts/reels
    "instagram_business_manage_messages", // Read/manage DMs
    "instagram_business_manage_comments", // Manage comments
  ].join(",");

  // ✅ CORRECTED: Use Instagram's native OAuth endpoint
  const authUrl = new URL("https://graph.instagram.com/oauth/authorize");
  authUrl.searchParams.append("client_id", clientId);
  authUrl.searchParams.append("redirect_uri", redirectUri);
  authUrl.searchParams.append("scope", scopes);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", payload);

  const res = NextResponse.redirect(authUrl.toString());

  // Store state for validation in callback
  res.cookies.set("oauth_state_instagram", payload, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
  });

  return res;
}