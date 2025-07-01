// File: src/server/api/routers/accounts.ts

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { env } from "@/env";

const getClerkProviderId = (provider: string): string => {
  const providerMapping: Record<string, string> = {
    github: 'oauth_github',
    google: 'oauth_google',
    notion: 'oauth_notion',
  };
  const lowerProvider = provider.toLowerCase();
  return providerMapping[lowerProvider] || `oauth_${lowerProvider}`;
};

export const accountsRouter = createTRPCRouter({
  getAccounts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx }) => {
      if (!ctx.auth.userId) {
        return { items: [], hasMore: false, nextCursor: null };
      }
      try {
        const client = await clerkClient(); // Use await
        const user = await client.users.getUser(ctx.auth.userId);
        const mappedAccounts = user.externalAccounts.map((extAccount) => {
          const providerName = extAccount.provider.startsWith("oauth_")
            ? extAccount.provider.substring(6)
            : extAccount.provider;
          return {
            id: extAccount.id,
            provider: providerName,
          };
        });

        return {
          items: mappedAccounts,
          hasMore: false,
          nextCursor: null,
        };
      } catch (error) {
        console.error("[Clerk] Error fetching user's external accounts:", error);
        return { items: [], hasMore: false, nextCursor: null };
      }
    }),

  getAccountByProvider: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        return null;
      }
      try {
        const client = await clerkClient(); // Use await
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
            scope: externalAccount.approvedScopes,
            emailAddress: externalAccount.emailAddress,
            username: externalAccount.username,
          };
        }
        return null;
      } catch (error) {
        console.error(`[Clerk] Error fetching user's external account for provider ${input}:`, error);
        return null;
      }
    }),

  hasProviderAccount: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        return false;
      }
      try {
        const client = await clerkClient(); // Use await
        const user = await client.users.getUser(ctx.auth.userId);
        const clerkOAuthProviderId = getClerkProviderId(input);
        const hasConnection = user.externalAccounts.some(
          (extAccount) => extAccount.provider === clerkOAuthProviderId
        );
        return hasConnection;
      } catch (error) {
        console.error(`[Clerk] Error checking for provider account ${input}:`, error);
        return false;
      }
    }),

  deleteAccount: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated."
        });
      }
      try {
        const client = await clerkClient(); // Use await
        // Using the UserAPI method which expects userId and externalAccountId
        await client.users.deleteUserExternalAccount(ctx.auth.userId, input);
        return { success: true, message: "Account disconnected successfully via Clerk." };
      } catch (error) {
        console.error(`[Clerk] Error deleting external account ${input} for user ${ctx.auth.userId}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disconnect the account. Please try again later.",
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
});
