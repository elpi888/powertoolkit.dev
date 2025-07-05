import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getComposioToolset } from "@/lib/composio";

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const toolset = getComposioToolset();

    // Define interfaces for better type safety based on expected Composio responses
    // Attempt to import ConnectedAccount type from composio-core, fallback to custom interface
    // import type { ConnectedAccount as ComposioConnectedAccount } from "composio-core";
    // If the above import fails or the structure is different, use custom interfaces:
    interface ComposioConnectionItem {
      id: string; // This is the connectedAccountId
      app_key?: string; // Typically the identifier like 'google_calendar', 'github'
      integration_id: string;
      entity_id: string;
      status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "ERROR" | "PENDING" | "INITIATED"; // Based on typical statuses
      scopes?: string[];
      created_at: string;
      updated_at: string;
      metadata?: Record<string, any>;
      // Other fields like `name`, `appName` might be present depending on Composio's exact response
      // For appName, we might need to derive it from app_key or integration_id if not directly provided
      // in a user-friendly way by the list method.
    }

    // The list method might return an object with an 'items' array or just an array.
    // Assuming it returns an array of ComposioConnectionItem directly based on some SDK patterns.
    // If it's { items: [] }, then connectionsResponse below needs to access .items
    // CodeRabbit suggested `toolset.connected_accounts.list`. Let's try that.
    // If `toolset.connected_accounts` does not exist, or `list` is not snake_case,
    // this will need adjustment after inspecting the SDK.

    let rawConnections: ComposioConnectionItem[] = [];

    try {
      // Attempting snake_case as per CodeRabbit suggestion, assuming it's on OpenAIToolSet.
      // This is a common pattern if the SDK is auto-generated from a Python backend.
      if (typeof (toolset.connected_accounts as any)?.list === 'function') {
        const response = await (toolset.connected_accounts as any).list({ entityId: userId });
        // Check if response has an 'items' property or is the array itself
        if (Array.isArray(response)) {
          rawConnections = response as ComposioConnectionItem[];
        } else if (response && Array.isArray(response.items)) {
          rawConnections = response.items as ComposioConnectionItem[];
        } else {
          console.warn("Composio connections list response format unexpected:", response);
        }
      } else if (typeof toolset.connectedAccounts?.list === 'function') {
        // Fallback to camelCase if snake_case doesn't exist
        const response = await toolset.connectedAccounts.list({ entityId: userId });
        if (Array.isArray(response)) {
          rawConnections = response as ComposioConnectionItem[];
        } else if (response && Array.isArray(response.items)) {
          rawConnections = response.items as ComposioConnectionItem[];
        } else {
          console.warn("Composio connections list (camelCase) response format unexpected:", response);
        }
      } else {
        throw new Error("Composio SDK method to list connected accounts not found on toolset.");
      }
    } catch (sdkError) {
      console.error("Error calling Composio SDK for listing connections:", sdkError);
      // Re-throw or handle as appropriate for the outer catch block
      throw sdkError;
    }

    const formattedConnections = rawConnections.map((conn) => ({
      connectedAccountId: conn.id,
      // Use app_key as the primary source for a consistent identifier like 'google_calendar'
      // The frontend will then map this to a friendly name and icon.
      appName: conn.app_key || conn.integration_id,
      status: conn.status,
      integrationId: conn.integration_id,
      // metadata: conn.metadata, // Optionally pass metadata if useful for frontend
    }));

    return NextResponse.json(formattedConnections);

  } catch (error) {
    console.error("Error fetching Composio connections:", error);
    // Consider more specific error handling
    if (error instanceof Error && error.message.includes("API key")) {
        return NextResponse.json({ error: "Composio API Key error." }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to fetch connections from third-party service." },
      { status: 500 },
    );
  }
}
