import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Instagram Webhooks Endpoint
 *
 * Handles two types of requests from Meta:
 *   GET  — Webhook verification (hub.challenge handshake)
 *   POST — Real-time event notifications (comments, mentions, messages, etc.)
 *
 * Setup in Meta App Dashboard:
 *   App Dashboard > Webhooks > Instagram > Callback URL:
 *     https://your-domain.com/api/onboarding/webhook/instagram
 *   Verify Token: value of INSTAGRAM_WEBHOOK_VERIFY_TOKEN env var
 *
 * Docs: https://developers.facebook.com/docs/instagram-platform/webhooks
 *
 * Why webhooks instead of polling?
 *   Meta rate-limits the Graph API aggressively. Webhooks push real-time
 *   updates (comments, @mentions, DMs, story expiry) to your server so
 *   you never need to poll, keeping you well within rate limits.
 */

// ─────────────────────────────────────────────────────────────
// GET — Meta webhook verification handshake
// Meta sends this when you first configure (or reconfigure) webhooks.
// You must echo back hub.challenge to confirm endpoint ownership.
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (!expectedToken) {
    console.error(
      "[Instagram Webhook] Missing INSTAGRAM_WEBHOOK_VERIFY_TOKEN env var"
    );
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  if (mode === "subscribe" && verifyToken === expectedToken) {
    console.log("[Instagram Webhook] Verification successful");
    // Echo back the challenge integer as plain text — Meta requires this
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[Instagram Webhook] Verification failed", {
    mode,
    verifyTokenMatch: verifyToken === expectedToken,
  });
  return new NextResponse("Forbidden", { status: 403 });
}

// ─────────────────────────────────────────────────────────────
// POST — Real-time event notifications from Meta
// Meta signs the payload with your App Secret using HMAC-SHA256.
// Always verify the signature before processing.
// ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!appSecret) {
    console.error(
      "[Instagram Webhook] Missing INSTAGRAM_APP_SECRET env var"
    );
    return new NextResponse("Server misconfiguration", { status: 500 });
  }

  const rawBody = await request.text();

  // ── Signature verification ────────────────────────────────
  // Meta sends: X-Hub-Signature-256: sha256=<hex>
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (!signatureHeader) {
    console.warn("[Instagram Webhook] Missing X-Hub-Signature-256 header");
    return new NextResponse("Missing signature", { status: 401 });
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf-8")
      .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  const isValid =
    signatureHeader.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedSignature)
    );

  if (!isValid) {
    console.warn("[Instagram Webhook] Invalid signature — possible spoofed request");
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // ── Parse payload ─────────────────────────────────────────
  let payload: InstagramWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as InstagramWebhookPayload;
  } catch {
    console.error("[Instagram Webhook] Failed to parse JSON body");
    return new NextResponse("Bad request", { status: 400 });
  }

  // ── Route events ──────────────────────────────────────────
  // Always respond 200 immediately — Meta retries if you take > 20s
  // Heavy processing should be handed off to Convex or a queue
  try {
    await processInstagramWebhookEvent(payload);
  } catch (error) {
    // Log but don't fail — return 200 so Meta doesn't retry endlessly
    console.error("[Instagram Webhook] Error processing event:", error);
  }

  return new NextResponse("OK", { status: 200 });
}

// ─────────────────────────────────────────────────────────────
// Event processor — routes by field type
// ─────────────────────────────────────────────────────────────
async function processInstagramWebhookEvent(
  payload: InstagramWebhookPayload
): Promise<void> {
  const { object, entry } = payload;

  if (object !== "instagram") {
    console.warn("[Instagram Webhook] Unexpected object type:", object);
    return;
  }

  for (const entryItem of entry) {
    const { id: igAccountId, changes, messaging, time } = entryItem;

    // ── Comments & @mentions ─────────────────────────────
    if (changes && changes.length > 0) {
      for (const change of changes) {
        const { field, value } = change;

        switch (field) {
          case "comments":
            console.log(
              `[Instagram Webhook] New comment on account ${igAccountId}:`,
              value
            );
            // TODO: Forward to Convex internal action
            // await forwardToConvex("instagram/onComment", { igAccountId, value, time });
            break;

          case "mentions":
            console.log(
              `[Instagram Webhook] New @mention for account ${igAccountId}:`,
              value
            );
            // TODO: Forward to Convex internal action
            // await forwardToConvex("instagram/onMention", { igAccountId, value, time });
            break;

          case "story_insights":
            console.log(
              `[Instagram Webhook] Story insights for account ${igAccountId}:`,
              value
            );
            // TODO: Forward to Convex internal action
            // await forwardToConvex("instagram/onStoryInsights", { igAccountId, value, time });
            break;

          default:
            console.log(
              `[Instagram Webhook] Unhandled field "${field}" for account ${igAccountId}:`,
              value
            );
        }
      }
    }

    // ── Direct Messages (Instagram Messaging) ─────────────
    if (messaging && messaging.length > 0) {
      for (const message of messaging) {
        console.log(
          `[Instagram Webhook] New DM for account ${igAccountId}:`,
          message
        );
        // TODO: Forward to Convex internal action
        // await forwardToConvex("instagram/onMessage", { igAccountId, message, time });
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────
interface InstagramWebhookPayload {
  object: "instagram";
  entry: InstagramWebhookEntry[];
}

interface InstagramWebhookEntry {
  id: string; // Instagram professional account ID
  time: number; // Unix timestamp
  changes?: InstagramWebhookChange[];
  messaging?: InstagramWebhookMessage[];
}

interface InstagramWebhookChange {
  field: "comments" | "mentions" | "story_insights" | "live_comments" | string;
  value: unknown;
}

interface InstagramWebhookMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: unknown[];
  };
}