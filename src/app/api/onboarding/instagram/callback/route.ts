import { encryptToken } from "@/lib/encryption";
import { NextRequest, NextResponse } from "next/server";

interface TokenResponse {
  access_token: string;
  user_id: string;
}

interface UserResponse {
  id: string;
  username: string;
  name?: string;
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!;
  const clientSecret = process.env.INSTAGRAM_APP_SECRET!;

  // ✅ CORRECTED: Use Instagram's native token endpoint (not Facebook)
  const tokenUrl = "https://api.instagram.com/oauth/access_token";

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: code,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    body: params,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = (await response.json()) as TokenResponse;
  return data;
}

async function getInstagramUserInfo(
  accessToken: string,
  userId: string
): Promise<{
  userId: string;
  username: string;
  igBusinessAccountId: string;
}> {
  // ✅ CORRECTED: Use Instagram's native graph endpoint
  const userResponse = await fetch(
    `https://graph.instagram.com/${userId}?fields=id,username,name,ig_handle&access_token=${encodeURIComponent(
      accessToken
    )}`
  );

  if (!userResponse.ok) {
    const error = await userResponse.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  const user = (await userResponse.json()) as UserResponse & { ig_handle?: string };

  // The user ID from token response IS the Instagram Business Account ID
  // No need to fetch it separately like with Facebook API
  return {
    userId: user.id,
    username: user.username,
    igBusinessAccountId: userId, // From token response
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    // Handle user denied permission
    if (error) {
      return NextResponse.json(
        { error: `Auth denied: ${error}`, description: errorDescription },
        { status: 400 }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Validate state to prevent CSRF
    const stored = request.cookies.get("oauth_state_instagram")?.value;
    if (!stored) {
      return NextResponse.json({ error: "Missing state cookie" }, { status: 400 });
    }

    const parsed = JSON.parse(
      Buffer.from(stored, "base64").toString("utf-8")
    ) as { state: string; studioId: string };

    if (parsed.state !== state) {
      return NextResponse.json({ error: "Invalid state token" }, { status: 400 });
    }

    const { studioId } = parsed;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/instagram/callback`;

    // Step 1: Exchange code for access token using Instagram's native endpoint
    const tokenData = await exchangeCodeForToken(code, redirectUri);

    // Step 2: Get user info (simplified compared to Facebook API)
    const accountInfo = await getInstagramUserInfo(
      tokenData.access_token,
      tokenData.user_id
    );

    // Step 3: Encrypt sensitive data
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("Missing ENCRYPTION_KEY environment variable");
    }

    const encrypted = encryptToken(tokenData.access_token, encryptionKey);

    // Step 4: Store in cookies and prepare response
    const res = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/oauth/connected?platform=instagram&username=${encodeURIComponent(
        accountInfo.username
      )}`
    );

    // ✅ Store encrypted access token
    res.cookies.set("oauth_token_instagram", encrypted, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // ✅ Store Instagram account IDs
    res.cookies.set(
      "oauth_instagram_accounts",
      JSON.stringify({
        igBusinessAccountId: accountInfo.igBusinessAccountId,
        userId: accountInfo.userId,
        username: accountInfo.username,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
      }
    );

    // Clear state cookie
    res.cookies.delete("oauth_state_instagram");

    return res;
  } catch (err: any) {
    console.error("Instagram callback error:", err);
    return NextResponse.json(
      { error: err.message || "Callback processing failed" },
      { status: 500 }
    );
  }
}