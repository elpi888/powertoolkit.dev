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
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { ToolkitGroups } from "@/toolkits/types";
import { env } from "@/env";

export const notionClientToolkit = createClientToolkit(
  baseNotionToolkitConfig,
  {
    name: "Notion",
    description: "Query and create pages and databases",
    icon: SiNotion,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED === "true";

      const { data: hasAccount, isLoading } =
        api.accounts.hasProviderAccount.useQuery("notion", {
          enabled: !useClerkAccounts, // Only run if not using Clerk accounts
        });

      if (isLoading && !useClerkAccounts) { // Only show loader if query is running
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="bg-transparent"
          >
            <Loader2 className="size-4 animate-spin" />
          </Button>
        );
      }

      if (!hasAccount) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void signIn("notion", {
                callbackUrl: window.location.href,
              });
            }}
            className="bg-transparent"
          >
            Connect
          </Button>
        );
      }

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
