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

const driveScope = "https://www.googleapis.com/auth/drive.readonly";

export const googleDriveClientToolkit = createClientToolkit(
  baseGoogleDriveToolkitConfig,
  {
    name: "Google Drive",
    description: "Search and read files from your Google Drive.",
    icon: SiGoogledrive,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const { data: account, isLoading: isLoadingAccount } =
        api.accounts.getAccountByProvider.useQuery("google");

      const { data: hasAccess, isLoading: isLoadingAccess } =
        api.features.hasFeature.useQuery({
          feature: "google-drive",
        });

      if (isLoadingAccount || isLoadingAccess) {
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

      if (!hasAccess) {
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

      if (!account) {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Refactor for Clerk.
              // This should ideally link to Clerk's User Profile page where connections can be managed,
              // or use a Clerk-provided method to initiate the Google connection with correct scopes.
              // The tRPC call api.accounts.getAccountByProvider is also now based on obsolete data.
              toast.info(
                "Connect Google Drive via your user profile (functionality pending). Ensure Drive scopes are granted.",
              );
            }}
            className="bg-transparent"
          >
            Connect {/* Button's purpose needs to be re-evaluated with Clerk */}
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
              // or use a Clerk-provided method to re-authenticate/request additional scopes for Google.
              // The logic for checking account?.scope is based on obsolete data.
              toast.info(
                "Grant Google Drive access via your user profile (functionality pending).",
              );
            }}
            className="bg-transparent"
          >
            Grant Access {/* Button's purpose needs to be re-evaluated with Clerk */}
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
