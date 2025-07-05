import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

import { getComposioToolset } from "@/lib/composio";

const disconnectRequestSchema = z.object({
  connectedAccountId: z.string().min(1),
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
    const toolset = getComposioToolset();

    // Ensure the user owns this connectedAccountId before deleting.
    // This requires fetching the connection first or having this info stored locally.
    // For now, proceeding directly with delete, but this is a crucial security/ownership check.
    // Option 1: Fetch connection, check entity_id (safer)
    let connectionToVerify;
    if (typeof (toolset.connected_accounts as any)?.get === 'function') {
        connectionToVerify = await (toolset.connected_accounts as any).get({ connectedAccountId });
    } else if (typeof toolset.connectedAccounts?.get === 'function') {
        connectionToVerify = await toolset.connectedAccounts.get({ connectedAccountId });
    }
    // Assuming connectionToVerify has an entity_id field
    if (!connectionToVerify || connectionToVerify.entity_id !== userId) {
        console.warn(`User ${userId} attempt to disconnect account ${connectedAccountId} not owned by them or not found.`);
        // Do not explicitly say "not found" or "not owned" to avoid information leakage.
        return NextResponse.json({ error: "Permission denied or connection not found." }, { status: 403 });
    }


    // Attempt to delete the connection
    // Assuming a method like `delete` or `remove` exists on `connected_accounts` or `connectedAccounts`
    let deleteSuccess = false;
    try {
      if (typeof (toolset.connected_accounts as any)?.delete === 'function') {
        await (toolset.connected_accounts as any).delete({ connectedAccountId });
        deleteSuccess = true;
      } else if (typeof toolset.connectedAccounts?.delete === 'function') {
        await toolset.connectedAccounts.delete({ connectedAccountId });
        deleteSuccess = true;
      } else {
        throw new Error("Composio SDK method to delete connected account not found on toolset.");
      }
    } catch (sdkError) {
      console.error(`Error calling Composio SDK for deleting connection ${connectedAccountId}:`, sdkError);
      throw sdkError; // Re-throw to be caught by the outer try-catch
    }

    if (!deleteSuccess) {
        // This case should ideally be caught by the errors above or if methods don't exist.
        return NextResponse.json({ error: "Failed to disconnect account: SDK method issue." }, { status: 500 });
    }

    return NextResponse.json({ message: "Account disconnected successfully." });

  } catch (error) {
    console.error("Error disconnecting Composio account:", error);
    if (error instanceof Error && error.message.includes("API key")) {
        return NextResponse.json({ error: "Composio API Key error." }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to disconnect account." },
      { status: 500 },
    );
  }
}
