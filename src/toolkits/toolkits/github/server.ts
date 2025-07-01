import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseGithubToolkitConfig } from "./base";
import {
  githubSearchRepositoriesToolConfigServer,
  githubSearchCodeToolConfigServer,
  githubSearchUsersToolConfigServer,
  githubRepoInfoToolConfigServer,
} from "./tools/server";
import { GithubTools } from "./tools";
// import { api } from "@/trpc/server"; // No longer needed
import { Octokit } from "octokit";
// import { env } from "@/env"; // No longer needed for NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED check
import { clerkClient } from "@clerk/nextjs/server"; // Import clerkClient
import { TRPCError } from "@trpc/server"; // Import TRPCError

export const githubToolkitServer = createServerToolkit(
  baseGithubToolkitConfig,
  `You have access to the GitHub toolkit for comprehensive repository and code analysis. This toolkit provides:

- **Search Repositories**: Find GitHub repositories based on various criteria
- **Search Code**: Search for specific code patterns across GitHub repositories  
- **Search Users**: Find GitHub users and developers
- **Repository Info**: Get detailed information about specific repositories

**Tool Sequencing Strategies:**
1. **Repository Discovery**: Start with Search Repositories to find relevant projects, then use Repository Info for detailed analysis
2. **Code Investigation**: Use Search Code to find specific implementations, patterns, or solutions across repositories
3. **Developer Research**: Use Search Users to find contributors or organizations, then Search Repositories to see their projects
4. **Project Analysis**: Combine Repository Info with Search Code to understand project structure and implementation details

**Best Practices:**
- Use specific search terms and programming languages for better results
- Leverage GitHub's advanced search syntax (language:python, stars:>100, etc.)
- When analyzing projects, start with repository overview then drill down into specific code patterns
- For technical research, search code first to find implementations, then explore the containing repositories`,
  async (params, userId) => { // Added userId, params might be unused for GitHub
    if (!userId) {
      // This should ideally be handled by the caller, ensuring userId is always provided.
      // Or, if this toolkit can operate without a user-specific token (e.g. app token), handle that.
      // For now, assume user-specific token is required.
      console.error("GitHub Server Toolkit: userId not provided for initialization.");
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User authentication required for GitHub toolkit." });
    }

    // Determine the Clerk provider ID for GitHub
    const clerkProvider = "oauth_github"; // Direct usage, or use getClerkProviderId from accounts.ts if more complex mapping needed

    let accessToken: string | null = null;
    try {
      const client = await clerkClient(); // Revert to await
      const tokenResponse = await client.users.getUserOauthAccessToken(userId, clerkProvider);
      // tokenResponse.data is an array of OauthAccessToken objects.
      if (tokenResponse.data.length > 0 && tokenResponse.data[0]?.token) {
        accessToken = tokenResponse.data[0].token;
      } else {
        console.warn(`GitHub Server Toolkit: No OAuth token found for user ${userId} and provider ${clerkProvider}.`);
        // Depending on desired behavior, could throw, or return null to disable tools.
        // For now, let's throw, as the toolkit likely needs it.
        throw new TRPCError({ code: "NOT_FOUND", message: "GitHub OAuth token not found or access denied." });
      }
    } catch (error) {
      console.error(`GitHub Server Toolkit: Error fetching OAuth token for user ${userId}, provider ${clerkProvider}:`, error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve GitHub OAuth token.", cause: error instanceof Error ? error : undefined });
    }

    if (!accessToken) {
      // Should have been caught by the throw above, but as a safeguard.
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "GitHub access token could not be obtained." });
    }

    const octokit = new Octokit({
      auth: accessToken,
    });

    return {
      [GithubTools.SearchRepos]:
        githubSearchRepositoriesToolConfigServer(octokit),
      [GithubTools.SearchCode]: githubSearchCodeToolConfigServer(octokit),
      [GithubTools.SearchUsers]: githubSearchUsersToolConfigServer(octokit),
      [GithubTools.RepoInfo]: githubRepoInfoToolConfigServer(octokit),
    };
  },
);
