import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { env } from "@/env";
import { getComposioToolset } from "@/lib/composio";

// Define the expected request body schema
const initiateRequestSchema = z.object({
  service: z.string().min(1), // e.g., "google_calendar"
  // We might add other params like specific scopes if needed later
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
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
    let integrationId: string | undefined;

    // For now, we only support google_calendar
    // This can be expanded to a switch or lookup if more services are added
    if (service.toLowerCase() === "google_calendar") {
      integrationId = env.COMPOSIO_GOOGLE_CALENDAR_INTEGRATION_ID;
    } else {
      return NextResponse.json(
        { error: "Unsupported service provided." },
        { status: 400 },
      );
    }

    if (!integrationId) {
      console.error(`Integration ID for service ${service} is not configured in environment variables.`);
      return NextResponse.json(
        { error: `Configuration error for service: ${service}` },
        { status: 500 },
      );
    }

    const toolset = getComposioToolset();

    // Construct the redirect URL for our app after Composio's own redirects
    // The user will land here after authorizing (or failing to authorize) with the third-party
    const appRedirectUrl = `${env.APP_URL}/account?tab=connected-accounts&composio_service=${service}`;

    const connectedAccount = await toolset.connectedAccounts.initiate({
      integrationId,
      entityId: userId, // Use Clerk userId as entityId
      redirectUrl: appRedirectUrl, // Optional: where user lands in our app after Composio's flow
    });

    if (!connectedAccount.redirectUrl) {
      console.error("Composio did not return a redirectUrl for OAuth flow.", { service, entityId: userId });
      return NextResponse.json(
        { error: "Failed to initiate connection: No redirect URL from provider." },
        { status: 500 },
      );
    }

    return NextResponse.json({ redirectUrl: connectedAccount.redirectUrl });

  } catch (error) {
    console.error("Error initiating Composio connection:", error);
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
