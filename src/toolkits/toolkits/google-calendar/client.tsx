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
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections
import { Loader2 } from "lucide-react";
// import { toast } from "sonner"; // No longer used
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { SiGooglecalendar } from "@icons-pack/react-simple-icons";
import { ToolkitGroups } from "@/toolkits/types";
import { Toolkits } from "../shared";
import { env } from "@/env";
// import { useMemo } from "react"; // No longer used
import { useUser } from "@clerk/nextjs"; // Added useUser

const calendarScope = "https://www.googleapis.com/auth/calendar";

export const googleCalendarClientToolkit = createClientToolkit(
  baseGoogleCalendarToolkitConfig,
  {
    name: "Google Calendar",
    description: "Find availability and schedule meetings",
    icon: SiGooglecalendar,
    form: null,
    addToolkitWrapper: ({ children }) => {
      const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;

      // Common: Check for feature access first
      const { data: hasFeatureAccess, isLoading: isLoadingFeatureAccess } =
        api.features.hasFeature.useQuery({ feature: "google-calendar" });

      if (isLoadingFeatureAccess) {
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
        const { user, isLoaded: isUserLoaded } = useUser();

        if (!isUserLoaded) {
          return ( // Clerk User loading
            <Button variant="outline" size="sm" disabled className="bg-transparent">
              <Loader2 className="size-4 animate-spin" />
            </Button>
          );
        }

        const googleAccount = user?.externalAccounts?.find(
          (acc) => (acc.provider as string) === "oauth_google"
        );

        if (!googleAccount) {
          // Connect Google Calendar via Clerk user profile
          return null;
        }

        // externalAccount.approvedScopes is a space-separated string.
        const currentScopes = googleAccount.approvedScopes ?? "";
        const hasCalendarScopeAccess = currentScopes.split(' ').includes(calendarScope);

        if (!hasCalendarScopeAccess) {
          // Grant Google Calendar access with required scopes via Clerk user profile
          return null;
        }

        return children; // Clerk user has Google connection with calendar scope
      }
      // Legacy path removed. Assuming env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is true.
      // If it were false, this component would not render the children if feature access was granted.
      // This path should ideally not be reached if Clerk is the sole auth method and feature flag is true.
      // The api.features.hasFeature check is outside the Clerk/legacy conditional, so it still applies.
      // If useClerkAccounts is false (i.e., env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is false),
      // this toolkit component cannot perform its Clerk-based connection checks.
      // Since Clerk is the sole auth provider, this state implies a misconfiguration
      // or an unsupported environment for this toolkit. Return null to prevent rendering
      // the toolkit UI which relies on Clerk-managed connections.
      // The api.features.hasFeature check above still gates overall feature access.
      return null;
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
