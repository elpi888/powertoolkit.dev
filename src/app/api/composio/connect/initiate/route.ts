import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { env } from "@/env";
import { getComposioClient } from "@/lib/composio"; // Updated import

// Define the expected request body schema
const initiateRequestSchema = z.object({
  service: z.string().min(1), // e.g., "google_calendar"
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth(); // Added await
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reqBody = await request.json();
    const validationResult = initiateRequestSchema.safeParse(reqBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const { service } = validationResult.data;

    // Using new terminology: Auth Config ID
    const SERVICE_AUTH_CONFIG_MAP: Record<string, string | undefined> = {
      google_calendar: env.COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID,
      // Future services can be added here, e.g.:
      // github: env.COMPOSIO_GITHUB_AUTH_CONFIG_ID,
    };

    const authConfigId = SERVICE_AUTH_CONFIG_MAP[service.toLowerCase()];

    if (!authConfigId) {
      if (service.toLowerCase() in SERVICE_AUTH_CONFIG_MAP) {
        console.error(`Auth Config ID for service ${service} is not configured in environment variables.`);
        return NextResponse.json(
          { error: `Configuration error for service: ${service}. Auth Config ID missing.` },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "Unsupported service provided." },
        { status: 400 },
      );
    }

    const composio = getComposioClient(); // Use new client utility

    // const appRedirectUrl = `${env.APP_URL}/account?tab=connected-accounts&composio_service=${service}&composio_status=pending_completion`;
    // Based on v3 docs, redirectUrl for our app is likely configured in Composio dashboard per AuthConfig,
    // or the SDK doesn't allow overriding it during initiate for the final user destination.
    // The `initiate` call itself returns the URL the user should be sent to for the provider's OAuth.

    const connectionRequest = await composio.connectedAccounts.initiate( // Changed to camelCase
      userId, // This is the `user_id` for Composio v3
      authConfigId
      // The v3 example `composio.connected_accounts.initiate(userId, linearAuthConfigId)` does not pass a third options object.
    );

    // The v3 docs show `connRequest.redirectUrl` (this is Composio's URL for user to auth with provider)
    // and `connRequest.id` (this is the connected_account_id, e.g. "ca_...")
    // and `connRequest.waitForConnection()` (a method to poll for completion)

    if (!connectionRequest.redirectUrl) {
      console.error("Composio v3 SDK did not return a redirectUrl for the provider's OAuth flow.", { service, userId });
      return NextResponse.json(
        { error: "Failed to initiate connection: No redirect URL from Composio." },
        { status: 500 },
      );
    }

    // We might also want to return connectionRequest.id (the new connectedAccountId `ca_...`)
    // if the frontend needs to track this specific pending connection.
    return NextResponse.json({
      redirectUrl: connectionRequest.redirectUrl,
      pendingConnectedAccountId: connectionRequest.id // e.g., "ca_..."
    });

  } catch (error) {
    console.error("Error initiating Composio v3 connection:", error);
    // Consider more specific error handling based on error types from Composio SDK
    if (error instanceof Error && error.message.includes("API key")) {
        return NextResponse.json({ error: "Composio API Key error." }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to initiate connection with third-party service." },
      { status: 500 },
    );
  }
}
