import { GithubTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { baseGithubToolkitConfig } from "./base";
import {
  githubSearchReposToolConfigClient,
  githubRepoInfoToolConfigClient,
  githubSearchCodeToolConfigClient,
  githubSearchUsersToolConfigClient,
} from "./tools/client";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections
import { Loader2 } from "lucide-react";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";
import { toast } from "sonner"; // For placeholder action
import { env } from "@/env";

export const githubClientToolkit = createClientToolkit(
  baseGithubToolkitConfig,
  {
    name: "GitHub",
    description: "Find and analyze repositories, users, and organizations",
    icon: SiGithub,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED === "true";

      const { data: hasAccount, isLoading } =
        api.accounts.hasProviderAccount.useQuery("github", {
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
              // TODO: Refactor for Clerk.
              // This should ideally link to Clerk's User Profile page where connections can be managed,
              // or use a Clerk-provided method to initiate the GitHub connection.
              // The tRPC call api.accounts.hasProviderAccount is also now based on obsolete data.
              toast.info("Connect GitHub via your user profile (functionality pending).");
            }}
            className="bg-transparent"
          >
            Connect {/* Button's purpose needs to be re-evaluated with Clerk */}
          </Button>
        );
      }

      return children;
    },
    type: ToolkitGroups.DataSource,
  },
  {
    [GithubTools.SearchRepos]: githubSearchReposToolConfigClient,
    [GithubTools.RepoInfo]: githubRepoInfoToolConfigClient,
    [GithubTools.SearchCode]: githubSearchCodeToolConfigClient,
    [GithubTools.SearchUsers]: githubSearchUsersToolConfigClient,
  },
);
