import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { getComposioClient } from "@/lib/composio"; // Updated import

const disconnectRequestSchema = z.object({
  connectedAccountId: z.string().min(1).startsWith("ca_"), // Expecting nanoId for v3
});

export async function POST(request: Request) {
  try {
    const { userId } = auth();
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
    // Fetch the connected account by its ID and check if its user_id matches the authenticated user.
    try {
      const connectionToVerify = await composio.connected_accounts.get({
        connectedAccountId: connectedAccountId,
      });

      if (!connectionToVerify || connectionToVerify.user_id !== userId) {
        console.warn(
          `User ${userId} attempt to disconnect account ${connectedAccountId} not owned by them or not found.`,
        );
        return NextResponse.json(
          { error: "Permission denied or connection not found." },
          { status: 403 },
        );
      }
    } catch (fetchError: any) {
      // Handle cases where the connection might not be found by `get` (e.g., already deleted, invalid ID)
      console.error(`Error fetching connection ${connectedAccountId} for verification:`, fetchError);
      // Distinguish between "not found" and other errors if SDK provides specific error types/codes
      if (fetchError.status === 404 || fetchError.message?.toLowerCase().includes("not found")) {
         return NextResponse.json({ error: "Connection not found." }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to verify connection ownership." }, { status: 500 });
    }

    // Step 2: Delete the connection using Composio v3 SDK
    // Method: composio.connected_accounts.delete({ connectedAccountId })
    await composio.connected_accounts.delete({
      connectedAccountId: connectedAccountId,
    });

    return NextResponse.json({ message: "Account disconnected successfully." });

  } catch (error) {
    console.error("Error disconnecting Composio v3 account:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        return NextResponse.json({ error: "Composio API Key error." }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to disconnect account." },
      { status: 500 },
    );
  }
}
