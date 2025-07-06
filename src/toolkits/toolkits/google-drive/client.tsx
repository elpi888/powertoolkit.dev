import { GoogleDriveTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleDriveToolkitConfig } from "./base";
import {
  googleDriveSearchFilesToolConfigClient,
  googleDriveReadFileToolConfigClient,
} from "./tools/client";
// import { api } from "@/trpc/react"; // No longer needed
// import { Button } from "@/components/ui/button"; // No longer needed by wrapper
// import { Badge } from "@/components/ui/badge"; // No longer needed by wrapper
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections
// import { Loader2 } from "lucide-react"; // No longer needed by wrapper
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip"; // No longer needed by wrapper
// import Link from "next/link"; // No longer needed by wrapper
import { SiGoogledrive } from "@icons-pack/react-simple-icons";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";
// import { env } from "@/env"; // No longer needed by wrapper
// import { useUser } from "@clerk/nextjs"; // No longer needed by wrapper

// const driveScope = "https://www.googleapis.com/auth/drive.readonly"; // No longer used by wrapper

export const googleDriveClientToolkit = createClientToolkit(
  baseGoogleDriveToolkitConfig,
  {
    name: "Google Drive",
    description: "Search and read files from your Google Drive.",
    icon: SiGoogledrive,
    form: null,
    addToolkitWrapper: ({ children }) => {
      return children;
    },
    type: ToolkitGroups.KnowledgeBase,
  },
  {
    [GoogleDriveTools.SearchFiles]: googleDriveSearchFilesToolConfigClient,
    [GoogleDriveTools.ReadFile]: googleDriveReadFileToolConfigClient,
  },
);
