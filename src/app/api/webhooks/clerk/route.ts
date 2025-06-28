import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { WebhookEvent, UserJSON } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { env } from "@/env";

// Ensure CLERK_WEBHOOK_SECRET is set in environment variables
const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error(
    "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
  );
}

async function handler(req: Request) {
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  let payload: WebhookEvent;
  try {
    const rawBody = await req.text();
    const wh = new Webhook(WEBHOOK_SECRET);
    payload = wh.verify(rawBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const eventType = payload.type;
  const eventData = payload.data as UserJSON; // Clerk UserJSON type

  console.log(`Received webhook event: ${eventType}`);

  try {
    switch (eventType) {
      case "user.created":
        await db.user.create({
          data: {
            id: eventData.id, // This is Clerk's internal user ID
            email: eventData.email_addresses.find(
              (email) => email.id === eventData.primary_email_address_id,
            )?.email_address,
            name: eventData.first_name
              ? `${eventData.first_name} ${eventData.last_name ?? ""}`.trim()
              : eventData.username, // Fallback to username if name parts are not available
            image: eventData.image_url,
            emailVerified: eventData.email_addresses.find(
              (email) => email.id === eventData.primary_email_address_id,
            )?.verification?.status === "verified" ? new Date() : null,
            // Note: external_id is not directly available on eventData.data for user.created
            // If mapping by external_id was critical at creation via webhook,
            // this would need a more complex flow or reliance on JWT customisation for subsequent linking.
            // However, our tRPC provisioning uses ctx.auth.userId which *is* externalId if set.
          },
        });
        console.log(`User ${eventData.id} created in local DB.`);
        break;

      case "user.updated":
        await db.user.update({
          where: { id: eventData.id }, // Assumes local DB user.id stores Clerk's user.id
          data: {
            email: eventData.email_addresses.find(
              (email) => email.id === eventData.primary_email_address_id,
            )?.email_address,
            name: eventData.first_name
              ? `${eventData.first_name} ${eventData.last_name ?? ""}`.trim()
              : eventData.username,
            image: eventData.image_url,
            emailVerified: eventData.email_addresses.find(
              (email) => email.id === eventData.primary_email_address_id,
            )?.verification?.status === "verified" ? new Date() : null,
          },
        });
        console.log(`User ${eventData.id} updated in local DB.`);
        break;

      case "user.deleted":
        // Ensure it's not a soft delete from Clerk if your local DB expects hard delete
        if (eventData.id) { // Clerk sends id for deleted user
          await db.user.delete({
            where: { id: eventData.id },
          });
          console.log(`User ${eventData.id} deleted from local DB.`);
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Failed to process webhook event" },
      { status: 500 },
    );
  }
}

export { handler as GET, handler as POST };
