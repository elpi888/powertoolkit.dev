import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleDriveToolkitConfig } from "./base";
import {
  googleDriveSearchFilesToolConfigServer,
  googleDriveReadFileToolConfigServer,
} from "./tools/server";
import { GoogleDriveTools } from "./tools";
import { api } from "@/trpc/server";
import { env } from "@/env";

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
  async () => {
    const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED === "true";

    if (useClerkAccounts) {
      // If Clerk accounts are active, the old way of getting accounts is disabled.
      // This toolkit will effectively be disabled until migrated to Clerk.
      console.warn("Google Drive Server Toolkit: Attempted to initialize with legacy accounts while Clerk is active. Toolkit will be disabled.");
      return {}; // Return empty tools, effectively disabling the toolkit
    }

    const account = await api.accounts.getAccountByProvider("google");

    if (!account?.access_token) {
      throw new Error("No Google account found or access token missing (legacy accounts).");
    }

    if (!account.scope?.includes("drive.readonly")) {
      throw new Error("Google account does not have drive.readonly scope (legacy accounts).");
    }

    return {
      [GoogleDriveTools.SearchFiles]: googleDriveSearchFilesToolConfigServer(
        account.access_token,
      ),
      [GoogleDriveTools.ReadFile]: googleDriveReadFileToolConfigServer(
        account.access_token,
      ),
    };
  },
);
