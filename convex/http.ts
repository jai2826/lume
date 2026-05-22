import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// ─────────────────────────────────────────────────────────────
// Clerk Webhook — User sync
// ─────────────────────────────────────────────────────────────

// NOTE: Handles both user.created and user.updated since Clerk sends
// a webhook for both events and we want to keep user data in sync.
http.route({
  path: "/clerk-webhook/create-user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // 1. Get the secret from Convex environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET");
      return new Response("Missing Secret", {
        status: 500,
      });
    }

    // 2. Grab the payload and headers
    const payloadString = await request.text();
    const headerPayload = request.headers;

    // 3. Extract the Svix headers needed for verification
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing Svix headers", {
        status: 400,
      });
    }

    // 4. Cryptographically verify the webhook
    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(payloadString, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error verifying webhook", {
        status: 400,
      });
    }

    // 5. Route the event to your internal mutation
    const eventType = evt.type;

    if (
      eventType === "user.created" ||
      eventType === "user.updated"
    ) {
      const { id, email_addresses, first_name, last_name } = evt.data;

      const email = email_addresses[0]?.email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      await ctx.runMutation(internal.secured.users.syncUser, {
        clerkId: id,
        email,
        name: name || undefined,
      });
    }

    return new Response("Webhook processed successfully", {
      status: 200,
    });
  }),
});

// ─────────────────────────────────────────────────────────────
// Instagram Webhook — Verification + Event notifications
//
// Meta calls this endpoint two ways:
//   GET  — one-time verification handshake (hub.challenge echo)
//   POST — real-time event notifications (comments, DMs, mentions)
//
// This Convex HTTP route acts as a thin proxy:
//   - Verification is handled here directly (no DB needed)
//   - Events are forwarded to internal Convex actions/mutations
//
// NOTE: Meta requires a public HTTPS URL. During local dev use
//   `npx convex dev` which exposes your Convex deployment URL.
//   Set it as the Callback URL in: App Dashboard > Webhooks > Instagram
//
// Docs: https://developers.facebook.com/docs/instagram-platform/webhooks
// ─────────────────────────────────────────────────────────────

/**
 * GET — Meta webhook verification handshake
 * Meta sends this when you configure (or reconfigure) the webhook
 * in the App Dashboard. You must echo back hub.challenge.
 */
http.route({
  path: "/instagram-webhook",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = url.searchParams.get("hub.verify_token");

    const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

    if (!expectedToken) {
      console.error(
        "[Instagram Webhook] Missing INSTAGRAM_WEBHOOK_VERIFY_TOKEN"
      );
      return new Response("Server misconfiguration", { status: 500 });
    }

    if (mode === "subscribe" && verifyToken === expectedToken) {
      console.log("[Instagram Webhook] Verification successful");
      // Echo back the challenge as plain text
      return new Response(challenge, { status: 200 });
    }

    console.warn("[Instagram Webhook] Verification failed", {
      mode,
      match: verifyToken === expectedToken,
    });
    return new Response("Forbidden", { status: 403 });
  }),
});

/**
 * POST — Real-time event notifications from Meta
 *
 * Meta signs payloads with your App Secret using HMAC-SHA256.
 * Always verify the X-Hub-Signature-256 header before processing.
 * Always return 200 immediately — Meta retries if you exceed 20s.
 */
http.route({
  path: "/instagram-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const appSecret = process.env.INSTAGRAM_APP_SECRET;

    if (!appSecret) {
      console.error(
        "[Instagram Webhook] Missing INSTAGRAM_APP_SECRET"
      );
      return new Response("Server misconfiguration", { status: 500 });
    }

    const rawBody = await request.text();

    // ── Signature verification ──────────────────────────────
    const signatureHeader = request.headers.get("x-hub-signature-256");

    if (!signatureHeader) {
      console.warn(
        "[Instagram Webhook] Missing X-Hub-Signature-256 header"
      );
      return new Response("Missing signature", { status: 401 });
    }

    // Compute expected HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appSecret);
    const messageData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );

    const signatureHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expectedSignature = `sha256=${signatureHex}`;

    if (signatureHeader !== expectedSignature) {
      console.warn(
        "[Instagram Webhook] Invalid signature — possible spoofed request"
      );
      return new Response("Invalid signature", { status: 401 });
    }

    // ── Parse and route events ──────────────────────────────
    let payload: InstagramWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as InstagramWebhookPayload;
    } catch {
      console.error("[Instagram Webhook] Failed to parse JSON body");
      return new Response("Bad request", { status: 400 });
    }

    if (payload.object !== "instagram") {
      console.warn(
        "[Instagram Webhook] Unexpected object type:",
        payload.object
      );
      return new Response("OK", { status: 200 });
    }

    // Process entries — forward to Convex internal actions
    for (const entry of payload.entry) {
      const { id: igAccountId, changes, messaging, time } = entry;

      // Handle field changes (comments, mentions, story_insights)
      if (changes) {
        for (const change of changes) {
          const val = change.value as any;
          switch (change.field) {
            case "comments":
              await ctx.runMutation(
                internal.socials.instagram.onComment,
                {
                  igAccountId,
                  commentId: val?.id,
                  mediaId: val?.media?.id,
                  text: val?.text,
                  from: val?.from,
                  timestamp: time,
                }
              );
              break;

            case "mentions":
              await ctx.runMutation(
                internal.socials.instagram.onMention,
                {
                  igAccountId,
                  mediaId: val?.media_id,
                  commentId: val?.comment_id,
                  timestamp: time,
                }
              );
              break;

            case "story_insights":
              // Non-critical — just log for now
              console.log(
                `[Instagram Webhook] story_insights for ${igAccountId}:`,
                val
              );
              break;

            default:
              console.log(
                `[Instagram Webhook] Unhandled field "${change.field}" for ${igAccountId}`
              );
          }
        }
      }

      // Handle DM events
      if (messaging) {
        for (const msg of messaging) {
          await ctx.runMutation(
            internal.socials.instagram.onDirectMessage,
            {
              igAccountId,
              senderId: msg.sender.id,
              messageId: msg.message?.mid,
              text: msg.message?.text,
              timestamp: msg.timestamp,
            }
          );
        }
      }
    }

    // Always return 200 promptly — Meta will retry on any non-200
    return new Response("OK", { status: 200 });
  }),
});

export default http;

// ─────────────────────────────────────────────────────────────
// Type definitions
// ─────────────────────────────────────────────────────────────

interface InstagramWebhookPayload {
  object: "instagram";
  entry: InstagramWebhookEntry[];
}

interface InstagramWebhookEntry {
  id: string;
  time: number;
  changes?: Array<{
    field: string;
    value: unknown;
  }>;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
      mid: string;
      text?: string;
      attachments?: unknown[];
    };
  }>;
}