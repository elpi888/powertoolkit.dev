import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseGoogleCalendarToolkitConfig } from "./base";
import {
  googleCalendarListCalendarsToolConfigServer,
  googleCalendarGetCalendarToolConfigServer,
  googleCalendarListEventsToolConfigServer,
  googleCalendarGetEventToolConfigServer,
  googleCalendarSearchEventsToolConfigServer,
} from "./tools/server";
import { GoogleCalendarTools } from "./tools";
// import { api } from "@/trpc/server"; // No longer needed
// import { env } from "@/env"; // No longer needed for NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED check
import { clerkClient } from "@clerk/nextjs/server"; // Import clerkClient
import { TRPCError } from "@trpc/server"; // Import TRPCError

export const googleCalendarToolkitServer = createServerToolkit(
  baseGoogleCalendarToolkitConfig,
  `You have access to the Google Calendar toolkit for comprehensive calendar management and scheduling. This toolkit provides:

- **List Calendars**: Get all available calendars for the user
- **Get Calendar**: Retrieve detailed information about a specific calendar
- **List Events**: Get events from a calendar within a date range
- **Get Event**: Retrieve detailed information about a specific event
- **Search Events**: Find events matching specific criteria across calendars

**Tool Sequencing Workflows:**
1. **Calendar Overview**: Start with List Calendars to see available calendars, then use Get Calendar for specific calendar details
2. **Event Management**: Use List Events to see upcoming events, then Get Event for detailed information about specific events
3. **Event Discovery**: Use Search Events to find events by keywords, participants, or topics across all calendars
4. **Schedule Analysis**: Combine List Events across multiple calendars to analyze scheduling patterns and availability

**Best Practices:**
- Always specify appropriate date ranges when listing events to avoid overwhelming results
- Use Search Events for finding specific meetings, appointments, or events by keywords
- When analyzing schedules, consider different calendar types (personal, work, shared calendars)
- Check multiple calendars when assessing availability or conflicts`,
  async (params, userId) => { // Added userId
    if (!userId) {
      console.error("Google Calendar Server Toolkit: userId not provided.");
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User authentication required for Google Calendar toolkit." });
    }

    const clerkProvider = "oauth_google"; // Standard Clerk provider ID for Google

    let accessToken: string | null = null;
    try {
      const client = await clerkClient();
      const tokenResponse = await client.users.getUserOauthAccessToken(userId, clerkProvider);
      // TODO: Check tokenResponse.data for required scopes if necessary (e.g., calendarScope)
      // tokenResponse.data[0]?.scopes
      if (tokenResponse.data.length > 0 && tokenResponse.data[0]?.token) {
        accessToken = tokenResponse.data[0].token;
      } else {
        console.warn(`Google Calendar Server Toolkit: No OAuth token found for user ${userId}, provider ${clerkProvider}.`);
        throw new TRPCError({ code: "NOT_FOUND", message: "Google OAuth token not found or access denied." });
      }
    } catch (error) {
      console.error(`Google Calendar Server Toolkit: Error fetching OAuth token for user ${userId}, provider ${clerkProvider}:`, error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve Google OAuth token.", cause: error instanceof Error ? error : undefined });
    }

    if (!accessToken) {
      // This case should ideally be caught by the errors above.
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Google access token could not be obtained." });
    }

    return {
      [GoogleCalendarTools.ListCalendars]:
        googleCalendarListCalendarsToolConfigServer(accessToken),
      [GoogleCalendarTools.GetCalendar]:
        googleCalendarGetCalendarToolConfigServer(accessToken),
      [GoogleCalendarTools.ListEvents]:
        googleCalendarListEventsToolConfigServer(accessToken),
      [GoogleCalendarTools.GetEvent]: googleCalendarGetEventToolConfigServer(
        accessToken,
      ),
      [GoogleCalendarTools.SearchEvents]:
        googleCalendarSearchEventsToolConfigServer(accessToken),
    };
  },
);
