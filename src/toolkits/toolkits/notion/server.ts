import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseNotionToolkitConfig } from "./base";
import {
  notionListDatabasesToolConfigServer,
  notionQueryDatabaseToolConfigServer,
  notionCreateDatabaseToolConfigServer,
  notionGetPageToolConfigServer,
  notionSearchPagesToolConfigServer,
  notionCreatePageToolConfigServer,
  notionGetBlocksToolConfigServer,
  notionAppendBlocksToolConfigServer,
  notionListUsersToolConfigServer,
} from "./tools/server";
import { NotionTools } from "./tools";
// import { api } from "@/trpc/server"; // No longer needed
import { Client } from "@notionhq/client";
// import { env } from "@/env"; // No longer needed
import { clerkClient } from "@clerk/nextjs/server"; // Import clerkClient
import { TRPCError } from "@trpc/server"; // Import TRPCError

export const notionToolkitServer = createServerToolkit(
  baseNotionToolkitConfig,
  `You have access to the Notion toolkit for comprehensive workspace management and content operations. This toolkit provides:

- **List Databases**: Get all databases accessible to the user
- **Query Database**: Search and filter database entries with advanced criteria  
- **Create Database**: Create new databases with custom properties and structure
- **Get Page**: Retrieve detailed content and metadata from specific pages
- **Search Pages**: Find pages across the workspace using text search
- **Create Page**: Create new pages with content and properties
- **Get Blocks**: Retrieve block-level content from pages (paragraphs, headings, lists, etc.)
- **Append Blocks**: Add new content blocks to existing pages
- **List Users**: Get information about workspace users and collaborators

**Tool Sequencing Workflows:**
1. **Workspace Discovery**: Start with List Databases to see available data structures, then use Search Pages to find relevant content
2. **Database Operations**: Use List Databases, then Query Database to find specific entries, followed by Get Page for detailed content
3. **Content Creation**: Use Create Database for new data structures, then Create Page to add content, and Append Blocks to expand pages
4. **Content Analysis**: Use Search Pages to find relevant pages, then Get Page and Get Blocks to extract detailed content
5. **Collaborative Workflows**: Use List Users to understand workspace collaboration, then query/create content with appropriate permissions


Pages and databases must be created under another page or database. So if the user asks you to create a page or database, search the pages and databases to find a parent and confirm with the user before creating.

If the user also has the memory toolkit, you can use it to store information about the user's workspace and use it to answer questions. If they have memory enabled, you can ask them if they want to save the default page or database under which you should create the page or database.

If the user has memory enabled and they ask you to make content, check the memory tool to see if you have enough information to make the content. If you don't, ask the user for more information.

**Best Practices:**
- Start with broad searches (List Databases, Search Pages) before drilling down to specific content
- Use Query Database with filters for precise data retrieval from structured databases
- When creating content, establish database structure first, then add pages and blocks
- Combine page content with block-level details for comprehensive information extraction
- Consider user permissions and workspace structure when creating or modifying content`,
  async (params, userId) => { // Added userId
    if (!userId) {
      console.error("Notion Server Toolkit: userId not provided.");
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User authentication required for Notion toolkit." });
    }

    const clerkProvider = "oauth_notion";

    let accessToken: string | null = null;
    try {
      const client = await clerkClient();
      const tokenResponse = await client.users.getUserOauthAccessToken(userId, clerkProvider);

      if (tokenResponse.data.length > 0 && tokenResponse.data[0]?.token) {
        accessToken = tokenResponse.data[0].token;
      } else {
        console.warn(`Notion Server Toolkit: No OAuth token found for user ${userId}, provider ${clerkProvider}.`);
        throw new TRPCError({ code: "NOT_FOUND", message: "Notion OAuth token not found or access denied." });
      }
    } catch (error) {
      console.error(`Notion Server Toolkit: Error fetching OAuth token for user ${userId}, provider ${clerkProvider}:`, error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve Notion OAuth token.", cause: error instanceof Error ? error : undefined });
    }

    if (!accessToken) {
      // This case should ideally be caught by the errors above.
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Notion access token could not be obtained." });
    }

    const notion = new Client({
      auth: accessToken,
    });

    return {
      [NotionTools.ListDatabases]: notionListDatabasesToolConfigServer(notion),
      [NotionTools.QueryDatabase]: notionQueryDatabaseToolConfigServer(notion),
      [NotionTools.CreateDatabase]:
        notionCreateDatabaseToolConfigServer(notion),
      [NotionTools.GetPage]: notionGetPageToolConfigServer(notion),
      [NotionTools.SearchPages]: notionSearchPagesToolConfigServer(notion),
      [NotionTools.CreatePage]: notionCreatePageToolConfigServer(notion),
      [NotionTools.GetBlocks]: notionGetBlocksToolConfigServer(notion),
      [NotionTools.AppendBlocks]: notionAppendBlocksToolConfigServer(notion),
      [NotionTools.ListUsers]: notionListUsersToolConfigServer(notion),
    };
  },
);
