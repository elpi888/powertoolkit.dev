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
import { toast } from "sonner"; // For placeholder action
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
import { useMemo } from "react";
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
      const useClerkAccounts = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);

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
          (acc) => acc.provider === "oauth_google"
        );

        if (!googleAccount) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Link to Clerk's User Profile to connect Google
                // or use Clerk SDK to initiate connection if available.
                // For now, a toast message directing to user profile.
                toast.info("Connect Google Calendar via your user profile.");
                // Consider: window.open('/user-profile#connected-accounts', '_blank');
              }}
              className="bg-transparent"
            >
              Connect Google Calendar
            </Button>
          );
        }

        // externalAccount.approvedScopes is a space-separated string.
        const currentScopes = googleAccount.approvedScopes ?? "";
        const hasCalendarScopeAccess = currentScopes.split(' ').includes(calendarScope);

        if (!hasCalendarScopeAccess) {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Link to Clerk's User Profile to re-authenticate/grant scopes
                // or use Clerk SDK to initiate re-auth with additional scopes.
                toast.info("Grant Google Calendar access with required scopes via your user profile.");
              }}
              className="bg-transparent"
            >
              Grant Calendar Access
            </Button>
          );
        }

        return children; // Clerk user has Google connection with calendar scope
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
              // or use a Clerk-provided method to initiate the Google connection with correct scopes.
              // The tRPC call api.accounts.getAccountByProvider is also now based on obsolete data.
              toast.info(
                "Connect Google Calendar via your user profile (functionality pending). Ensure calendar scopes are granted.",
              );
            }}
            className="bg-transparent"
          >
            Connect {/* Button's purpose needs to be re-evaluated with Clerk */}
          </Button>
        );
      }

      if (!account?.scope?.includes(calendarScope)) {
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
                "Grant Google Calendar access via your user profile (functionality pending).",
              );
            }}
          >
            Grant Access {/* Button's purpose needs to be re-evaluated with Clerk */}
          </Button>
        );
      }

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
