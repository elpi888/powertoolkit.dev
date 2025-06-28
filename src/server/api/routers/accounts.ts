import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const accountsRouter = createTRPCRouter({
  getAccounts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const items = await ctx.db.account.findMany({
        where: {
          userId: ctx.auth.userId, // Updated from ctx.session.user.id
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      const nextCursor =
        items.length > limit ? items[items.length - 1]?.id : undefined;
      const accounts = items.slice(0, limit);

      return {
        items: accounts,
        hasMore: items.length > limit,
        nextCursor,
      };
    }),

  getAccount: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.account.findFirst({
        where: {
          id: input,
          userId: ctx.auth.userId, // Updated from ctx.session.user.id
        },
      });
    }),

  getAccountByProvider: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.account.findFirst({
        where: {
          userId: ctx.auth.userId, // Updated from ctx.session.user.id
          provider: input,
        },
      });
    }),

  hasProviderAccount: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.account.findFirst({
        where: { userId: ctx.auth.userId, provider: input }, // Updated from ctx.session.user.id
      });

      return !!account;
    }),

  deleteAccount: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Coderabbit suggestion: Use findFirst then delete to ensure ownership and use unique filter for delete
      const account = await ctx.db.account.findUnique({
        where: { id: input },
      });

      if (!account) {
        throw new Error("Account link not found.");
      }

      if (account.userId !== ctx.auth.userId) {
        throw new Error("Access denied. You can only delete your own account links.");
      }

      return ctx.db.account.delete({
        where: { id: input }, // Delete by unique id after verification
      });
    }),
});
