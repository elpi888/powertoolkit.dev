import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { env } from "@/env";

export const accountsRouter = createTRPCRouter({
  getAccounts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED) {
        if (!ctx.auth.userId) {
          // Should be caught by protectedProcedure, but as a safeguard
          return { items: [], hasMore: false, nextCursor: null };
        }
        try {
          const user = await clerkClient.users.getUser(ctx.auth.userId);
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
          return { items: [], hasMore: false, nextCursor: null, error: "Failed to fetch accounts from Clerk" };
        }
      } else {
        // Legacy mode: Account table is removed.
        console.warn("getAccounts TRPC route called in legacy mode, but Account table is removed.");
        return { items: [], hasMore: false, nextCursor: null };
      }
    }),

  // Removing getAccount procedure as its original purpose is obsolete (fetching legacy DB Account by ID)
  // and there's no clear current need for fetching a single Clerk external account by its specific ID via tRPC.
  // getAccount: protectedProcedure
  //   .input(z.string())
  //   .query(async ({ ctx, input }) => {
  //     // The Account table from NextAuth has been removed.
  //     // TODO: Refactor or remove this procedure.
  //     if (env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED) {
  //       console.warn("getAccount TRPC route called in Clerk mode - this is for legacy DB accounts and should be replaced/removed.");
  //     } else {
  //       console.warn("getAccount TRPC route called in legacy mode, but Account table is removed.");
  //     }
  //     return null; // Or throw an error indicating data source is unavailable
  //   }),

  getAccountByProvider: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const useClerkForAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;

      if (useClerkForAccounts) {
        if (!ctx.auth.userId) {
          return null;
        }
        try {
          const user = await clerkClient.users.getUser(ctx.auth.userId);

          const providerMapping: Record<string, string> = {
            github: 'oauth_github',
            google: 'oauth_google',
            notion: 'oauth_notion',
          };
          const lowerInput = input.toLowerCase();
          const clerkOAuthProviderId = providerMapping[lowerInput] || `oauth_${lowerInput}`;

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
      } else {
        // Legacy mode: Account table is removed.
        console.warn("getAccountByProvider TRPC route called in legacy mode, but Account table is removed.");
        return null;
      }
    }),

  hasProviderAccount: protectedProcedure
    .input(z.string()) // provider name e.g., "github", "notion", "google"
    .query(async ({ ctx, input }) => {
      const useClerkForAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;

      if (useClerkForAccounts) {
        if (!ctx.auth.userId) {
          // This case should ideally not be reached in a protectedProcedure
          // TODO: Replace with proper logging service
          // console.error("hasProviderAccount: ctx.auth.userId is missing in a protected procedure.");
          return false;
        }
        try {
          const user = await clerkClient.users.getUser(ctx.auth.userId);

          const providerMapping: Record<string, string> = {
            github: 'oauth_github',
            google: 'oauth_google',
            notion: 'oauth_notion',
            // Add other provider mappings as needed
          };
          const lowerInput = input.toLowerCase();
          const clerkOAuthProviderId = providerMapping[lowerInput] || `oauth_${lowerInput}`;

          const hasConnection = user.externalAccounts.some(
            (extAccount) => extAccount.provider === clerkOAuthProviderId
          );
          return hasConnection;
        } catch (error) {
          // TODO: Replace with proper logging service
          // console.error(`[Clerk] Error fetching user ${ctx.auth.userId} or their external accounts:`, error);
          return false; // Return false on error to indicate account not found or inaccessible
        }
      } else {
        // Legacy path: The Account table from NextAuth has been removed.
        // This path is effectively non-functional.
        // TODO: Remove this legacy path once Clerk migration is complete and flag is removed/defaulted to true.
        console.warn("hasProviderAccount TRPC route called legacy path, but Account table is removed.");
        return false;
      }
    }),

  deleteAccount: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => { // input is now expected to be Clerk's externalAccountId
      const useClerkForAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;

      if (useClerkForAccounts) {
        if (!ctx.auth.userId) {
          throw new Error("User not authenticated.");
        }
        try {
          // The 'input' is the externalAccountId from Clerk
          await clerkClient.users.deleteExternalAccount(ctx.auth.userId, input);
          return { success: true, message: "Account disconnected successfully via Clerk." };
        } catch (error) {
          console.error(`[Clerk] Error deleting external account ${input} for user ${ctx.auth.userId}:`, error);
          // TODO: Replace with proper logging service
          throw new Error("Failed to disconnect account via Clerk.");
        }
      } else {
        // Legacy mode: Account table is removed, so this operation is not possible.
        console.warn("deleteAccount TRPC route called in legacy mode, but Account table is removed.");
        throw new Error("Legacy account system is unavailable for deletion.");
      }
    }),
});
