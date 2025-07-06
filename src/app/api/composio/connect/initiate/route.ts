import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { auth_scheme } from "@composio/core"; // Import auth_scheme
import { env } from "@/env";
import { getComposioClient } from "@/lib/composio";

// Define the expected request body schema
const initiateRequestSchema = z.object({
  service: z.string().min(1), // e.g., "google_calendar"
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
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

    const SERVICE_AUTH_CONFIG_MAP: Record<string, string | undefined> = {
      google_calendar: env.COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID,
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

    const composio = getComposioClient();

    // This is the URL in our app where the user should land after the entire OAuth flow.
    const ourAppCallbackUrl = `${env.APP_URL}/workbench/settings?composio_service=${service}&composio_status=pending_completion`;
    // Assuming workbench settings is where they'll return. Adjust if needed.
    // Or, more generically: `${env.APP_URL}/composio/callback?service=${service}` if we want a dedicated callback handler page.
    // For now, sending them back to a generic workbench/account area with query params.

    const connectionRequest = await composio.connected_accounts.initiate({
      userId: userId,
      authConfigId: authConfigId,
    });

    if (!connectionRequest.redirectUrl) {
      console.error("Composio v3 SDK did not return a redirectUrl for the provider's OAuth flow.", { service, userId });
      return NextResponse.json(
        { error: "Failed to initiate connection: No redirect URL from Composio." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      redirectUrl: connectionRequest.redirectUrl, // This is Composio's URL to send the user to the provider
      pendingConnectedAccountId: connectionRequest.id
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
