import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getComposioClient } from "@/lib/composio"; // Updated import
// Attempt to import the specific type for a connected account from the v3 SDK
// This might be named differently, e.g., ConnectedAccount, ComposioConnectedAccount, etc.
// For now, let's define a placeholder and adjust if a type is found in SDK.
// import type { ConnectedAccount } from "@composio/core/types"; // Hypothetical path

// Interface adjusted to match the actual structure indicated by the Vercel type error
interface ComposioV3ConnectedAccount {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "INITIATED" | "INITIALIZING" | "FAILED"; // As per error
  toolkit: { slug: string }; // As per error (actual type has toolkit.slug)
  data: Record<string, unknown>; // As per error (actual type has data)
  createdAt: string; // As per error (camelCase)
  updatedAt: string; // As per error (camelCase)
  authConfig: { id: string; [key: string]: unknown }; // Changed any to unknown for better type safety
  // user_id is not directly on items if list is filtered by user, contextually it's `userId` from auth()
  // scopes also not mentioned in the error's depiction of the actual item structure
}

export async function GET() {
  try {
    const { userId } = await auth(); // Added await
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const composio = getComposioClient(); // Use new v3 client

    // Using Composio v3 SDK method: composio.connectedAccounts.list({ userIds: [userId] })
    // The response structure needs to be confirmed.
    // It might return an object like { items: ComposioV3ConnectedAccount[] } or an array directly.
    const response = await composio.connectedAccounts.list({ // Changed to camelCase
      userIds: [userId], // Pass the `userId` as an array in `userIds`
    });

    let rawConnections: ComposioV3ConnectedAccount[] = [];
    // Refined response handling as per CodeRabbit suggestion
    if (response && typeof response === 'object' && 'items' in response && Array.isArray(response.items)) {
      rawConnections = response.items as ComposioV3ConnectedAccount[];
    } else if (Array.isArray(response)) {
      rawConnections = response as ComposioV3ConnectedAccount[];
    } else {
      console.warn("Composio v3 connections list response format unexpected or empty:", response);
      // rawConnections remains [], which is handled gracefully by the map below
    }

    const formattedConnections = rawConnections.map((conn) => ({
      connectedAccountId: conn.id, // This is the nanoId "ca_..."
      // `appName` for the frontend needs to be derived.
      // `toolkit_id` is the new field that likely represents the service (e.g., 'google_calendar').
      // The frontend will map this toolkit_id to a friendly name and icon.
      appName: conn.toolkit?.slug || conn.authConfig?.id, // Use slug from toolkit object, or id from authConfig
      status: conn.status,
      authConfigId: conn.authConfig?.id, // Use id from authConfig object
    }));

    return NextResponse.json(formattedConnections);

  } catch (error) {
    console.error("Error fetching Composio v3 connections:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        return NextResponse.json({ error: "Composio API Key error." }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to fetch connections." },
      { status: 500 },
    );
  }
}
