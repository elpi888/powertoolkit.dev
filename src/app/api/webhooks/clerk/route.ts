import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { WebhookEvent, UserJSON } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { env } from "@/env";

// const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET; // Moved inside handler

// if (!WEBHOOK_SECRET) { // Moved inside handler
//   throw new Error(
//     "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
//   );
// }

async function handler(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not configured for webhook handler.");
    return new Response("Server configuration error: Webhook secret not set.", {
      status: 500,
    });
  }

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

  const getEmailVerifiedDate = (eventData: UserJSON): Date | null => {
    const primaryEmail = eventData.email_addresses.find(
      (email) => email.id === eventData.primary_email_address_id,
    );
    return primaryEmail?.verification?.status === "verified"
      ? new Date(eventData.updated_at * 1000)
      : null;
  };

  try {
    switch (eventType) {
      case "user.created":
        await db.user.create({
          data: {
            id: eventData.id, // This is Clerk's internal user ID
            email: eventData.email_addresses.find(
              (email) => email.id === eventData.primary_email_address_id,
            )?.email_address ?? null, // Defensive null check
            name: eventData.first_name
              ? `${eventData.first_name} ${eventData.last_name ?? ""}`.trim()
              : eventData.username, // Fallback to username if name parts are not available
            image: eventData.image_url,
            emailVerified: getEmailVerifiedDate(eventData),
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
            )?.email_address ?? null, // Defensive null check
            name: eventData.first_name
              ? `${eventData.first_name} ${eventData.last_name ?? ""}`.trim()
              : eventData.username,
            image: eventData.image_url,
            emailVerified: getEmailVerifiedDate(eventData),
          },
        });
        console.log(`User ${eventData.id} updated in local DB.`);
        break;

      case "user.deleted":
        if (eventData.id) {
          try {
            // Attempt to delete the user.
            // This will fail if there are related records that prevent deletion due to foreign key constraints,
            // unless cascading deletes are set up appropriately in the Prisma schema.
            // It will also fail if the user does not exist (e.g., already deleted or never synced).
            await db.user.delete({
              where: { id: eventData.id },
            });
            console.log(`User ${eventData.id} deleted from local DB via webhook.`);
          } catch (error: unknown) { // Changed from any to unknown
            // Log the error, especially if it's a PrismaClientKnownRequestError (e.g., P2025 Record to delete does not exist)
            // or a foreign key constraint error (P2003).
            if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
              console.warn(`Webhook: Attempted to delete user ${eventData.id}, but user not found in local DB.`);
            } else {
              console.error(`Webhook: Error deleting user ${eventData.id}:`, error);
              // Depending on the error, you might want to respond differently or retry.
              // For now, we'll still return a 200 to Clerk to acknowledge receipt unless it's a critical config issue.
            }
          }
        } else {
          console.warn("Webhook: Received user.deleted event without a user ID.", eventData);
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) { // Changed from any to unknown
    console.error("Error processing webhook event:", error);
    return NextResponse.json(
      { error: "Failed to process webhook event" },
      { status: 500 },
    );
  }
}

export { handler as GET, handler as POST };
