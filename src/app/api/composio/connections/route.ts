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

    // Fetch connected accounts for the user
    // The SDK method for listing might be different, e.g., toolset.connectedAccounts.list()
    // or toolset.entities.get({ entityId: userId }).getConnectedAccounts()
    // For now, assuming a direct method on toolset or toolset.connectedAccounts
    // This will need verification against the actual SDK's capabilities.
    // Based on docs: `toolset.get_connected_accounts(entity_id=user_identifier_from_my_app)` (Python)
    // Let's assume a similar structure for TypeScript, or find it on the toolset.connectedAccounts object.

    // Tentative: trying toolset.connectedAccounts.list() as it's a common pattern.
    // The actual method might require entityId directly or through an entity object.
    // The SDK's structure for this needs to be confirmed.
    // The Python example was `toolset.get_connected_accounts(entity_id=...)`
    // Let's try to adapt that, assuming `getConnectedAccounts` exists on the toolset.

    // The documentation snippet `connections = toolset.get_connected_accounts(entity_id=user_identifier_from_my_app)`
    // was Python. The `connectedAccounts.initiate` was on `toolset.connectedAccounts`.
    // It's likely that listing is also on `toolset.connectedAccounts`.

    const connectionsResponse = await toolset.connectedAccounts.list({
      entityId: userId,
      // We might want to filter by active status if the API supports it,
      // or filter manually after fetching.
      // active: true, // Example: if supported by the SDK call
    });

    // The actual response structure from `list` needs to be verified.
    // Assuming it's an array of connection objects.
    // Let's call the items `items` if it's a paginated-like response, or it could be a direct array.
    // For now, let's assume `connectionsResponse` is the array or has an `items` property.
    const connections = Array.isArray(connectionsResponse)
      ? connectionsResponse
      : (connectionsResponse as any)?.items || [];


    // We need to map the raw connection data to a structure the frontend expects.
    // e.g., { id: string, appName: string, status: string, integrationId: string }
    const formattedConnections = connections.map((conn: any) => ({
      connectedAccountId: conn.id, // Assuming 'id' is the connectedAccountId
      appName: conn.appName || conn.appKey || conn.integrationId, // Prefer appName, fallback if needed
      status: conn.status,
      integrationId: conn.integrationId,
      // Add any other relevant fields the frontend might need
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
