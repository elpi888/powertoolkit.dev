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

      if (useClerkAccounts) {
        const { user, isLoaded: isUserLoaded } = useUser();

        if (!isUserLoaded) {
          return (
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading...
            </Button>
          );
        }

        const googleAccount = user?.externalAccounts?.find(
          (acc) => (acc.provider as string) === "oauth_google"
        );

        if (!googleAccount) {
          return (
            <Button variant="outline" size="sm" asChild>
              <Link href="/user-profile">Connect Google</Link>
            </Button>
          );
        }

        const currentScopes = googleAccount.approvedScopes ?? "";
        const hasDriveScopeAccess = currentScopes.split(' ').includes(driveScope);

        if (!hasDriveScopeAccess) {
          return (
            <Button variant="outline" size="sm" asChild>
              <Link href="/user-profile">Grant Scope</Link>
            </Button>
          );
        }
        // All Clerk checks passed, render children
        return children;
      }
      // Fallback or non-Clerk path
      return children;
    },
    type: ToolkitGroups.KnowledgeBase,
  },
  {
    [GoogleDriveTools.SearchFiles]: googleDriveSearchFilesToolConfigClient,
    [GoogleDriveTools.ReadFile]: googleDriveReadFileToolConfigClient,
  },
);
