import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { getComposioClient } from "@/lib/composio"; // Updated import

const disconnectRequestSchema = z.object({
  connectedAccountId: z.string().min(1).startsWith("ca_"), // Expecting nanoId for v3
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth(); // Added await
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reqBody = await request.json();
    const validationResult = disconnectRequestSchema.safeParse(reqBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error.format() },
        { status: 400 },
      );
    }

    const { connectedAccountId } = validationResult.data;
    const composio = getComposioClient(); // Use new v3 client

    // Step 1: Verify ownership (important security step)
    // List all connections for the user and check if the target connectedAccountId is in that list.
    try {
      const userConnectionsResponse = await composio.connectedAccounts.list({ userIds: [userId] }); // Changed to userIds: [userId]

      let userConnections: { id: string }[] = []; // Assuming a minimal interface for the check
      if (Array.isArray(userConnectionsResponse)) {
        userConnections = userConnectionsResponse as { id: string }[];
      } else if (userConnectionsResponse && typeof userConnectionsResponse === 'object' && 'items' in userConnectionsResponse && Array.isArray(userConnectionsResponse.items)) {
        userConnections = userConnectionsResponse.items as { id: string }[];
      }

      const connectionToDisconnect = userConnections.find(conn => conn.id === connectedAccountId);

      if (!connectionToDisconnect) {
        console.warn(
          `User ${userId} attempt to disconnect account ${connectedAccountId} which they do not own or does not exist for them.`,
        );
        return NextResponse.json(
          { error: "Permission denied or connection not found." },
          { status: 403 }, // Or 404 if we are sure it doesn't exist at all
        );
      }
      // If found, ownership is verified.
    } catch (listError: unknown) {
      console.error(`Error listing connections for user ${userId} during disconnect verification:`, listError);
      return NextResponse.json({ error: "Failed to verify connection ownership due to a server error." }, { status: 500 });
    }

    // Step 2: Delete the connection using Composio v3 SDK
    // Method: composio.connectedAccounts.delete(connectedAccountId)
    await composio.connectedAccounts.delete(connectedAccountId); // Pass ID directly

    return NextResponse.json({ message: "Account disconnected successfully." });

  } catch (error: unknown) {
    console.error("Error disconnecting Composio v3 account:", error);
    let finalErrorMessage = "Failed to disconnect account.";
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        finalErrorMessage = "Composio API Key error.";
      } else {
        // You could choose to expose error.message directly if it's safe,
        // or keep a generic message for other types of errors.
        // finalErrorMessage = error.message;
      }
    }
    // Check for specific SDK error structures if Composio SDK throws custom errors with status codes
    // else if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
    //   finalErrorMessage = (error as any).message || finalErrorMessage;
    //   return NextResponse.json({ error: finalErrorMessage }, { status: (error as any).status || 500 });
    // }

    return NextResponse.json(
      { error: finalErrorMessage },
      { status: 500 },
    );
  }
}
