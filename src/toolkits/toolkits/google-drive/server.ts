import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleDriveToolkitConfig } from "./base";
import {
  googleDriveSearchFilesToolConfigServer,
  googleDriveReadFileToolConfigServer,
} from "./tools/server";
import { GoogleDriveTools } from "./tools";
// import { api } from "@/trpc/server"; // No longer needed
// import { env } from "@/env"; // No longer needed
import { clerkClient, type OauthAccessToken } from "@clerk/nextjs/server"; // Import clerkClient and OauthAccessToken
import { TRPCError } from "@trpc/server"; // Import TRPCError

export const googleDriveToolkitServer = createServerToolkit(
  baseGoogleDriveToolkitConfig,
  `You have access to the Google Drive toolkit for file management and content access. This toolkit provides:

- **Search Files**: Find files and folders in Google Drive using various search criteria
- **Read File**: Extract and read content from documents, PDFs, and other supported file types

**Tool Sequencing Workflows:**
1. **File Discovery**: Use Search Files to locate documents by name, type, or content, then Read File to access specific content
2. **Content Analysis**: Search for files by topic or keywords, then read multiple files to gather comprehensive information
3. **Document Research**: Find relevant documents through search, then read them to extract specific information or insights

**Best Practices:**
- Use specific search terms and file type filters (e.g., "type:pdf", "type:document") for better results
- Search by modification date or owner when looking for recent or specific documents
- When reading files, be aware of file format limitations and supported document types
- Combine search results from multiple queries to get comprehensive document coverage
- Use folder-based searches when documents are organized in specific directory structures`,
  async (params, userId) => { // Added userId
    if (!userId) {
      console.error("Google Drive Server Toolkit: userId not provided.");
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User authentication required for Google Drive toolkit." });
    }

    const clerkProvider = "oauth_google"; // Standard Clerk provider ID for Google
    const requiredScope = "https://www.googleapis.com/auth/drive.readonly";

    let accessToken: string | null = null;
    try {
      const client = await clerkClient();
      const tokenResponse = await client.users.getUserOauthAccessToken(userId, clerkProvider);

      const googleToken = tokenResponse.data.find((token: OauthAccessToken) =>
        token.provider === clerkProvider &&
        token.scopes?.includes(requiredScope)
      );

      if (googleToken?.token) {
        accessToken = googleToken.token;
      } else {
        console.warn(`Google Drive Server Toolkit: No OAuth token found for user ${userId} with provider ${clerkProvider} and scope ${requiredScope}.`);
        throw new TRPCError({ code: "NOT_FOUND", message: `Google Drive access denied. Please ensure the app has '${requiredScope}' permission.` });
      }
    } catch (error) {
      console.error(`Google Drive Server Toolkit: Error fetching OAuth token for user ${userId}, provider ${clerkProvider}:`, error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve Google Drive OAuth token.", cause: error instanceof Error ? error : undefined });
    }

    if (!accessToken) {
      // Should have been caught above
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Google Drive access token could not be obtained." });
    }

    return {
      [GoogleDriveTools.SearchFiles]: googleDriveSearchFilesToolConfigServer(
        accessToken,
      ),
      [GoogleDriveTools.ReadFile]: googleDriveReadFileToolConfigServer(
        accessToken,
      ),
    };
  },
);
