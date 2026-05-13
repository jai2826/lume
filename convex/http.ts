import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// NOTE: It handle both creation and updates since Clerk sends a webhook for both events and we want to keep our user data in sync. In a production app, you might want to handle these separately or add more logic to determine what to do on each event type.
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
    const svixTimestamp = headerPayload.get(
      "svix-timestamp",
    );
    const svixSignature = headerPayload.get(
      "svix-signature",
    );

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
      const { id, email_addresses, first_name, last_name } =
        evt.data;

      const email = email_addresses[0]?.email_address;
      const name =
        `${first_name || ""} ${last_name || ""}`.trim();

      await ctx.runMutation(
        internal.secured.users.syncUser,
        {
          clerkId: id,
          email,
          name: name || undefined,
        },
      );
    }

    // Always return a 200 so Clerk knows we received it
    return new Response("Webhook processed successfully", {
      status: 200,
    });
  }),
});

export default http;
