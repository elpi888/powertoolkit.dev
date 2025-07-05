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
    } catch (fetchError: unknown) {
      // Handle cases where the connection might not be found by `get` (e.g., already deleted, invalid ID)
      console.error(`Error fetching connection ${connectedAccountId} for verification:`, fetchError);

      let errorMessage = "Failed to verify connection ownership.";
      let errorStatus = 500;

      if (typeof fetchError === 'object' && fetchError !== null) {
        const status = (fetchError as any).status; // Potentially unsafe, but common for SDK errors
        const message = (fetchError as any).message as string || "";

        if (status === 404 || message.toLowerCase().includes("not found")) {
          errorMessage = "Connection not found.";
          errorStatus = 404;
        }
      } else if (fetchError instanceof Error) {
        if (fetchError.message.toLowerCase().includes("not found")) {
            errorMessage = "Connection not found.";
            errorStatus = 404;
        }
      }
      return NextResponse.json({ error: errorMessage }, { status: errorStatus });
    }

    // Step 2: Delete the connection using Composio v3 SDK
    // Method: composio.connected_accounts.delete({ connectedAccountId })
    await composio.connected_accounts.delete({
      connectedAccountId: connectedAccountId,
    });

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
