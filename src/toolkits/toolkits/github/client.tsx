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
import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";

export const githubClientToolkit = createClientToolkit(
  baseGithubToolkitConfig,
  {
    name: "GitHub",
    description: "Find and analyze repositories, users, and organizations",
    icon: SiGithub,
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
        const hasGithubConnection = user?.externalAccounts?.some(
          (acc) => acc.provider === "oauth_github"
        );

        if (!hasGithubConnection) {
          // TODO: This button should ideally link to Clerk's User Profile connection management page
          // or use a Clerk SDK method to initiate the connection flow.
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info("Manage GitHub connection via your user profile.");
                // Example: window.open('/user-profile#connections', '_blank');
              }}
              className="bg-transparent"
            >
              Connect GitHub
            </Button>
          );
        }
        return children; // Clerk user has GitHub connection
      } else {
        // Legacy path (useClerkAccounts is false)
        // The hook is defined here, but only enabled if !useClerkAccounts
        const { data: hasLegacyAccount, isLoading: isLoadingLegacy } =
          api.accounts.hasProviderAccount.useQuery("github", {
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
          return ( // Legacy Connect Button (shows toast, as per previous state)
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info("Connect GitHub via your user profile (legacy: functionality pending).");
              }}
              className="bg-transparent"
            >
              Connect
            </Button>
          );
        }
        return children; // Legacy account exists
      }
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
