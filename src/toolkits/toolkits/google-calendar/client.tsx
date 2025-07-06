import { GoogleCalendarTools } from "./tools";
import { createClientToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleCalendarToolkitConfig } from "./base";
import {
  googleCalendarListCalendarsToolConfigClient,
  googleCalendarGetCalendarToolConfigClient,
  googleCalendarListEventsToolConfigClient,
  googleCalendarGetEventToolConfigClient,
  googleCalendarSearchEventsToolConfigClient,
} from "./tools/client";
// import { api } from "@/trpc/react"; // No longer needed if Private Beta check removed
// import { Button } from "@/components/ui/button"; // No longer needed by wrapper
// import { Badge } from "@/components/ui/badge"; // No longer needed by wrapper
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections
// import { Loader2 } from "lucide-react"; // No longer needed by wrapper
// import { toast } from "sonner"; // No longer used
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip"; // No longer needed by wrapper
// import Link from "next/link"; // No longer needed by wrapper
import { SiGooglecalendar } from "@icons-pack/react-simple-icons";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";
// import { env } from "@/env"; // No longer needed by wrapper
// import { useMemo } from "react"; // No longer used
// import { useUser } from "@clerk/nextjs"; // No longer needed by wrapper

// const calendarScope = "https://www.googleapis.com/auth/calendar"; // No longer used by wrapper

export const googleCalendarClientToolkit = createClientToolkit(
  baseGoogleCalendarToolkitConfig,
  {
    name: "Google Calendar",
    description: "Find availability and schedule meetings",
    icon: SiGooglecalendar,
    form: null,
    // Simplified addToolkitWrapper: Assumes not private beta and no Clerk connection logic here.
    // Allows ToolkitItem to handle button display (e.g., "Connect" for OAuth via Composio).
    addToolkitWrapper: ({ children }) => {
      return children;
    },
    type: ToolkitGroups.DataSource,
  },
  {
    [GoogleCalendarTools.ListCalendars]:
      googleCalendarListCalendarsToolConfigClient,
    [GoogleCalendarTools.GetCalendar]:
      googleCalendarGetCalendarToolConfigClient,
    [GoogleCalendarTools.ListEvents]: googleCalendarListEventsToolConfigClient,
    [GoogleCalendarTools.GetEvent]: googleCalendarGetEventToolConfigClient,
    [GoogleCalendarTools.SearchEvents]:
      googleCalendarSearchEventsToolConfigClient,
  },
);
