import { GoogleDriveTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleDriveToolkitConfig } from "./base";
import {
  googleDriveSearchFilesToolConfigClient,
  googleDriveReadFileToolConfigClient,
} from "./tools/client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections
import { Loader2 } from "lucide-react";
// import { toast } from "sonner"; // No longer needed
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { SiGoogledrive } from "@icons-pack/react-simple-icons";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";
import { env } from "@/env";
// import { useMemo } from "react"; // No longer used
import { useUser } from "@clerk/nextjs"; // Import useUser

const driveScope = "https://www.googleapis.com/auth/drive.readonly";

export const googleDriveClientToolkit = createClientToolkit(
  baseGoogleDriveToolkitConfig,
  {
    name: "Google Drive",
    description: "Search and read files from your Google Drive.",
    icon: SiGoogledrive,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;

      // Common: Check for feature access first
      // Note: api.features.hasFeature might be removed if not used after legacy path removal
      const { data: hasFeatureAccess, isLoading: isLoadingFeatureAccess } =
        api.features.hasFeature.useQuery({ feature: "google-drive" });

      if (isLoadingFeatureAccess) {
        return (
          <Button variant="outline" size="sm" disabled className="bg-transparent">
            <Loader2 className="size-4 animate-spin" />
          </Button>
        );
      }

      if (!hasFeatureAccess) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">Private Beta</Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-center">
                We need to add you as a test user on Google Cloud for us to
                request sensitive OAuth scopes. <br />
                <br /> Please contact{" "}
                <Link
                  href="https://x.com/jsonhedman"
                  target="_blank"
                  className="underline"
                >
                  @jsonhedman
                </Link>{" "}
                on X to request access.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      // Feature access is granted, now handle Clerk for account checks
      if (useClerkAccounts) {
        const { user, isLoaded: isUserLoaded } = useUser();

        if (!isUserLoaded) {
          return ( // Clerk User loading
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              <Loader2 className="size-4 animate-spin" />
            </Button>
          );
        }

        const googleAccount = user?.externalAccounts?.find(
          (acc) => (acc.provider as string) === "oauth_google" // Assuming "oauth_google" for Drive as well
        );

        if (!googleAccount) {
          // User has not connected their Google account via Clerk
          return null;
        }

        const currentScopes = googleAccount.approvedScopes ?? "";
        const hasDriveScopeAccess = currentScopes.split(' ').includes(driveScope);

        if (!hasDriveScopeAccess) {
          // User has connected Google, but not with the required Drive scope
          return null;
        }

        return children; // All checks passed for Clerk
      }

      // If useClerkAccounts is false (i.e., env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is false),
      // this toolkit component cannot perform its Clerk-based connection checks.
      // Since Clerk is the sole auth provider, this state implies a misconfiguration.
      // Return null to prevent rendering the toolkit UI.
      return null;
    },
    type: ToolkitGroups.KnowledgeBase,
  },
  {
    [GoogleDriveTools.SearchFiles]: googleDriveSearchFilesToolConfigClient,
    [GoogleDriveTools.ReadFile]: googleDriveReadFileToolConfigClient,
  },
);
