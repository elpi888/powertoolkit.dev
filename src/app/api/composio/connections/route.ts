import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getComposioClient } from "@/lib/composio"; // Updated import
// Attempt to import the specific type for a connected account from the v3 SDK
// This might be named differently, e.g., ConnectedAccount, ComposioConnectedAccount, etc.
// For now, let's define a placeholder and adjust if a type is found in SDK.
// import type { ConnectedAccount } from "@composio/core/types"; // Hypothetical path

interface ComposioV3ConnectedAccount {
  id: string; // nanoId, e.g., "ca_..."
  auth_config_id: string; // e.g., "ac_..."
  user_id: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "ERROR" | "PENDING" | "INITIATED"; // Common statuses
  toolkit_id?: string; // The new term for "App" or "Service" identifier like 'google_calendar'
  created_at: string;
  updated_at: string;
  scopes?: string[];
  metadata?: Record<string, unknown>;
  // Any other fields returned by the v3 SDK's list method
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
      appName: conn.toolkit_id || conn.auth_config_id, // Use toolkit_id if available, else auth_config_id as fallback
      status: conn.status,
      authConfigId: conn.auth_config_id, // Pass this along if needed by frontend/disconnect
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
