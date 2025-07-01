import { NotionTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { baseNotionToolkitConfig } from "./base";
import {
  notionListDatabasesToolConfigClient,
  notionQueryDatabaseToolConfigClient,
  notionCreateDatabaseToolConfigClient,
  notionGetPageToolConfigClient,
  notionSearchPagesToolConfigClient,
  notionCreatePageToolConfigClient,
  notionGetBlocksToolConfigClient,
  notionAppendBlocksToolConfigClient,
  notionListUsersToolConfigClient,
} from "./tools/client";
import { SiNotion } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
// import { signIn } from "next-auth/react"; // Removed
import { Loader2 } from "lucide-react";
import { ToolkitGroups } from "@/toolkits/types";
import { env } from "@/env";
import { useUser } from "@clerk/nextjs";

export const notionClientToolkit = createClientToolkit(
  baseNotionToolkitConfig,
  {
    name: "Notion",
    description: "Query and create pages and databases",
    icon: SiNotion,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;
      const { user, isLoaded: isUserLoaded } = useUser();

      if (useClerkAccounts) {
        if (!isUserLoaded) {
          return ( // Clerk User loading
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              <Loader2 className="size-4 animate-spin" />
            </Button>
          );
        }
        // Assuming Clerk provider ID for Notion is 'oauth_notion'
        const hasNotionConnection = user?.externalAccounts?.some(
          (acc) => (acc.provider as string) === "oauth_notion"
        );

        if (!hasNotionConnection) {
          // When Clerk is enabled, don't show connect button - accounts managed via Clerk user profile.
          return null;
        }
        return children; // Clerk user has Notion connection
      }
      // Legacy path removed. Assuming env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is true.
      // If it were false, this would pass control to `children` without connection checks.
      // For a production-ready Clerk integration, this is the desired state.
      return children;
    },
    type: ToolkitGroups.KnowledgeBase,
  },
  {
    [NotionTools.ListDatabases]: notionListDatabasesToolConfigClient,
    [NotionTools.QueryDatabase]: notionQueryDatabaseToolConfigClient,
    [NotionTools.CreateDatabase]: notionCreateDatabaseToolConfigClient,
    [NotionTools.GetPage]: notionGetPageToolConfigClient,
    [NotionTools.SearchPages]: notionSearchPagesToolConfigClient,
    [NotionTools.CreatePage]: notionCreatePageToolConfigClient,
    [NotionTools.GetBlocks]: notionGetBlocksToolConfigClient,
    [NotionTools.AppendBlocks]: notionAppendBlocksToolConfigClient,
    [NotionTools.ListUsers]: notionListUsersToolConfigClient,
  },
);
