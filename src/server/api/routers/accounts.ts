import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server"; // Import TRPCError
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
// import type { UserAPI } from "@clerk/backend"; // Reverted for now
import { env } from "@/env";

const getClerkProviderId = (provider: string): string => {
  const providerMapping: Record<string, string> = {
    github: 'oauth_github',
    google: 'oauth_google',
    notion: 'oauth_notion',
    // Add other common mappings if known
  };
  const lowerProvider = provider.toLowerCase();
  return providerMapping[lowerProvider] || `oauth_${lowerProvider}`; // Fallback for unmapped
};

export const accountsRouter = createTRPCRouter({
  getAccounts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Assuming NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is true as per plan
      if (!ctx.auth.userId) {
        // Should be caught by protectedProcedure, but as a safeguard
        return { items: [], hasMore: false, nextCursor: null };
      }
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(ctx.auth.userId);
        const mappedAccounts = user.externalAccounts.map((extAccount) => {
          // Clean up provider name (e.g., "oauth_google" -> "google")
          const providerName = extAccount.provider.startsWith("oauth_")
            ? extAccount.provider.substring(6)
            : extAccount.provider;

          return {
            id: extAccount.id, // This is Clerk's external account ID
            provider: providerName,
            // Add other relevant fields from extAccount if needed by the client,
            // mapping them to the old Prisma Account structure if possible/necessary.
            // For now, focusing on what ConnectedAccounts/index.tsx uses: id and provider.
            // Legacy fields like type, providerAccountId, access_token are not directly here.
            // scope: extAccount.approvedScopes, // Example if scope is needed
          };
        });

        return {
          items: mappedAccounts,
          hasMore: false, // Clerk SDK getUser doesn't directly support pagination for externalAccounts here
          nextCursor: null,
        };
      } catch (error) {
        console.error("[Clerk] Error fetching user's external accounts:", error);
        // TODO: Replace with proper logging service
        // For a query, returning an empty state might be acceptable, or throw a TRPCError
        // Let's keep returning empty state for now as per original, but note that TRPCError is an option.
        // throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch accounts." });
        return { items: [], hasMore: false, nextCursor: null };
      }
    }),

  getAccountByProvider: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // Assuming NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is true as per plan
      if (!ctx.auth.userId) {
        return null;
      }
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(ctx.auth.userId);

        const clerkOAuthProviderId = getClerkProviderId(input);

        const externalAccount = user.externalAccounts.find(
          (acc) => acc.provider === clerkOAuthProviderId
        );

        if (externalAccount) {
          const providerName = externalAccount.provider.startsWith("oauth_")
            ? externalAccount.provider.substring(6)
            : externalAccount.provider;
          return {
            id: externalAccount.id,
            provider: providerName,
            // Map other relevant fields from Clerk's ExternalAccount if needed
            // For example, scopes, email, etc.
            scope: externalAccount.approvedScopes,
            emailAddress: externalAccount.emailAddress,
            username: externalAccount.username,
            // Ensure this structure is compatible with what client expects from old Prisma Account
          };
        }
        return null; // Provider account not found
      } catch (error) {
        console.error(`[Clerk] Error fetching user's external account for provider ${input}:`, error);
        // TODO: Replace with proper logging service
        return null;
      }
    }),

  hasProviderAccount: protectedProcedure
    .input(z.string()) // provider name e.g., "github", "notion", "google"
    .query(async ({ ctx, input }) => {
      // Assuming NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is true as per plan
      if (!ctx.auth.userId) {
        // This case should ideally not be reached in a protectedProcedure
        // TODO: Replace with proper logging service
        return false;
      }
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(ctx.auth.userId);

        const clerkOAuthProviderId = getClerkProviderId(input);

        const hasConnection = user.externalAccounts.some(
          (extAccount) => extAccount.provider === clerkOAuthProviderId
        );
        return hasConnection;
      } catch (error) {
        // TODO: Replace with proper logging service
        // console.error(`[Clerk] Error fetching user ${ctx.auth.userId} or their external accounts:`, error); // Ensure this is commented or removed
        return false; // Return false on error to indicate account not found or inaccessible
      }
    }),

  deleteAccount: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => { // input is now expected to be Clerk's externalAccountId
      // Assuming NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED is true as per plan
      if (!ctx.auth.userId) {
        throw new Error("User not authenticated.");
      }
      try {
        // The 'input' is the externalAccountId from Clerk
        const client = await clerkClient();
        await client.users.deleteUserExternalAccount(ctx.auth.userId, input);
        return { success: true, message: "Account disconnected successfully via Clerk." };
      } catch (error) {
        console.error(`[Clerk] Error deleting external account ${input} for user ${ctx.auth.userId}:`, error);
        // TODO: Replace with proper logging service
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disconnect the account. Please try again later.",
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
});
