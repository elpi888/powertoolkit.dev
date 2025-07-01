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
      // const { limit, cursor } = input; // limit and cursor not used if not fetching

      // The Account table from NextAuth has been removed.
      // This procedure is now obsolete or needs full reimplementation with Clerk.
      // For now, return empty to prevent build errors and runtime errors on legacy path.
      // TODO: Refactor or remove this procedure. If needed, fetch connected accounts from Clerk.
      if (env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED) {
        // In Clerk mode, this should ideally fetch from Clerk's API if needed.
        // For now, returning empty as this specific tRPC was for legacy DB accounts.
        console.warn("getAccounts TRPC route called in Clerk mode - this is for legacy DB accounts and should be replaced/removed.");
      } else {
        // In legacy mode, the table is gone.
        console.warn("getAccounts TRPC route called in legacy mode, but Account table is removed.");
      }

      return {
        items: [],
        hasMore: false,
        nextCursor: null,
      };
    }),

  getAccount: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // The Account table from NextAuth has been removed.
      // TODO: Refactor or remove this procedure.
      if (env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED) {
        console.warn("getAccount TRPC route called in Clerk mode - this is for legacy DB accounts and should be replaced/removed.");
      } else {
        console.warn("getAccount TRPC route called in legacy mode, but Account table is removed.");
      }
      return null; // Or throw an error indicating data source is unavailable
    }),

  getAccountByProvider: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      // The Account table from NextAuth has been removed.
      // TODO: Refactor or remove this procedure. If needed, fetch specific provider connection from Clerk.
      if (env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED) {
        console.warn("getAccountByProvider TRPC route called in Clerk mode - this is for legacy DB accounts and should be replaced/removed.");
      } else {
        console.warn("getAccountByProvider TRPC route called in legacy mode, but Account table is removed.");
      }
      return null; // Or throw an error
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
    .mutation(async ({ ctx, input }) => {
      // The Account table from NextAuth has been removed.
      // Deleting accounts should be handled via Clerk.
      // TODO: Refactor or remove this procedure. If needed, use Clerk API to remove external account.
      if (env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED) {
        console.warn("deleteAccount TRPC route called in Clerk mode - this is for legacy DB accounts and should be replaced/removed. Account deletion should be managed via Clerk.");
        throw new Error("Account deletion is now managed via Clerk user profile.");
      } else {
        console.warn("deleteAccount TRPC route called in legacy mode, but Account table is removed.");
        throw new Error("Legacy account system is unavailable for deletion.");
      }
      // Original logic would fail as ctx.db.account does not exist.
      // return ctx.db.account.delete(...);
    }),
});
