import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const imagesRouter = createTRPCRouter({
  getUserImages: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Updated

      const items = await ctx.db.image.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      const hasMore = items.length > input.limit;
      const nextCursor = hasMore ? items[input.limit]!.id : undefined;

      return {
        items: items.slice(0, input.limit),
        nextCursor,
      };
    }),

  getImage: protectedProcedure
    .input(
      z.object({
        imageId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Updated

      return ctx.db.image.findFirst({
        where: {
          id: input.imageId,
          userId, // Ensure user can only access their own images
        },
      });
    }),

  getImageCountByUserId: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    return ctx.db.image.count({
      where: {
        userId,
      },
    });
  }),

  createImage: protectedProcedure
    .input(
      z.object({
        contentType: z.string(),
        url: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Updated

      return ctx.db.image.create({
        data: {
          contentType: input.contentType,
          url: input.url,
          userId,
        },
      });
    }),

  deleteImage: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Updated

      return ctx.db.image.delete({
        where: {
          id: input,
          userId, // Ensure user can only delete their own images
        },
      });
    }),

  deleteAllUserImages: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.auth.userId; // Updated

    return ctx.db.image.deleteMany({
      where: {
        userId,
      },
    });
  }),
});
