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
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
// import { signIn } from "next-auth/react"; // Removed
import { Loader2 } from "lucide-react";
import { ToolkitGroups } from "@/toolkits/types";
import { env } from "@/env";
import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";

export const notionClientToolkit = createClientToolkit(
  baseNotionToolkitConfig,
  {
    name: "Notion",
    description: "Query and create pages and databases",
    icon: SiNotion,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);
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
          (acc) => acc.provider === "oauth_notion"
        );

        if (!hasNotionConnection) {
          // TODO: This button should ideally link to Clerk's User Profile connection management page
          // or use a Clerk SDK method to initiate the connection flow for Notion.
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info("Manage Notion connection via your user profile.");
                // Example: window.open('/user-profile#connections', '_blank');
              }}
              className="bg-transparent"
            >
              Connect Notion
            </Button>
          );
        }
        return children; // Clerk user has Notion connection
      } else {
        // Legacy path (useClerkAccounts is false)
        const { data: hasLegacyAccount, isLoading: isLoadingLegacy } =
          api.accounts.hasProviderAccount.useQuery("notion", {
            enabled: !useClerkAccounts, // This ensures it only runs in the legacy path
          });

        if (isLoadingLegacy) {
          return (
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              <Loader2 className="size-4 animate-spin" />
            </Button>
          );
        }

        if (!hasLegacyAccount) {
          return ( // Legacy Connect Button (original signIn logic)
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Guide user to profile for connection, even in legacy path
                toast.info("Please manage your Notion connection via your user profile.");
                window.open('/user-profile#connected-accounts', '_blank');
              }}
              className="bg-transparent"
            >
              Manage Connection
            </Button>
          );
        }
        return children; // Legacy account exists
      }
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
