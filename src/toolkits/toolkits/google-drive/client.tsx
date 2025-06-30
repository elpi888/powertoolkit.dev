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
import { toast } from "sonner"; // For placeholder action
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
import { useMemo } from "react";

const driveScope = "https://www.googleapis.com/auth/drive.readonly";

export const googleDriveClientToolkit = createClientToolkit(
  baseGoogleDriveToolkitConfig,
  {
    name: "Google Drive",
    description: "Search and read files from your Google Drive.",
    icon: SiGoogledrive,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);

      // Common: Check for feature access first
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

      // Feature access is granted, now handle Clerk vs Legacy
      if (useClerkAccounts) {
        // TODO: Implement Clerk-based account and scope checking here for Google Drive.
        // For now, if Clerk is active and feature access is granted, render children.
        // Connection status is assumed to be handled by Clerk's global UI / UserProfile.
        return children;
      }

      // Legacy path (useClerkAccounts is false and hasFeatureAccess is true)
      const { data: account, isLoading: isLoadingAccount } =
        api.accounts.getAccountByProvider.useQuery("google"); // Query runs as useClerkAccounts is false

      if (isLoadingAccount) {
        return (
          <Button variant="outline" size="sm" disabled className="bg-transparent">
            <Loader2 className="size-4 animate-spin" />
          </Button>
        );
      }

      if (!account) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Refactor for Clerk.
              // This should ideally link to Clerk's User Profile page where connections can be managed,
              // This legacy path implies Clerk is not yet the primary method for this user,
              // but we guide them towards the new central place for connections.
              toast.info("Please manage your Google Drive connection via your user profile.");
              window.open('/user-profile#connected-accounts', '_blank');
            }}
            className="bg-transparent"
          >
            Manage Connection
          </Button>
        );
      }

      if (!account?.scope?.includes(driveScope)) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Refactor for Clerk.
              // This should ideally link to Clerk's User Profile page where connections can be managed,
              // This legacy path implies Clerk is not yet the primary method for this user,
              // but we guide them towards the new central place for connections and permissions.
              toast.info("Please update Google Drive permissions via your user profile.");
              window.open('/user-profile#connected-accounts', '_blank');
            }}
            className="bg-transparent"
          >
            Update Permissions
          </Button>
        );
      }

      return children;
    },
    type: ToolkitGroups.KnowledgeBase,
  },
  {
    [GoogleDriveTools.SearchFiles]: googleDriveSearchFilesToolConfigClient,
    [GoogleDriveTools.ReadFile]: googleDriveReadFileToolConfigClient,
  },
);
