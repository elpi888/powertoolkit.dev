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
      return ctx.db.account.delete({
        where: {
          id: input,
          // userId: ctx.session.user.id, // This was incorrect, a user should only be able to delete their own account record
          // The check should be: find the account by id, then check if its userId matches ctx.auth.userId
          // However, Prisma's delete often requires a unique identifying field or combination.
          // A safer pattern is to ensure the userId matches in the where clause if possible,
          // or do a check before deleting if the where clause can't combine id and userId directly for delete.
          // For now, let's assume the ID is globally unique and the intent was to scope by user.
          // Prisma's delete typically works on a unique field. If 'id' is unique, this is fine.
          // The original code might have had a bug if 'id' wasn't globally unique for accounts.
          // Given it's `userId: ctx.session.user.id` in the where clause, it means it was trying to ensure
          // that the account being deleted belongs to the user.
          // Let's replicate that with `userId: ctx.auth.userId`.
          userId: ctx.auth.userId, // Ensures the user is deleting their own account link
          id: input, // The ID of the account link to delete
        },
      });
    }),
});
