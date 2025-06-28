import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// Admin middleware to check if user has admin feature
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const adminFeature = await ctx.db.userFeature.findFirst({
    where: {
      userId: ctx.auth.userId, // Updated
      feature: {
        name: "admin",
      },
    },
  });

  if (!adminFeature) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx,
  });
});

export const featuresRouter = createTRPCRouter({
  // Get all features (admin only)
  getAllFeatures: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.feature.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Create a new feature (admin only)
  createFeature: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Feature name is required"),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.feature.create({
          data: {
            name: input.name,
            description: input.description,
          },
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Feature with this name already exists",
          });
        }
        throw error;
      }
    }),

  // Search users by email or name (admin only)
  searchUsers: adminProcedure
    .input(
      z.object({
        query: z.string().min(1, "Search query is required"),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.user.findMany({
        where: {
          OR: [
            {
              email: {
                contains: input.query,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: input.query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          userFeatures: {
            include: {
              feature: true,
            },
          },
        },
        take: 10,
      });
    }),

  // Get user's features
  getUserFeatures: protectedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.auth.userId; // Updated

      // Only allow users to see their own features unless they're admin
      if (targetUserId !== ctx.auth.userId) { // Updated
        const adminFeature = await ctx.db.userFeature.findFirst({
          where: {
            userId: ctx.auth.userId, // Updated
            feature: {
              name: "admin",
            },
          },
        });

        if (!adminFeature) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only view your own features",
          });
        }
      }

      return ctx.db.userFeature.findMany({
        where: {
          userId: targetUserId,
        },
        include: {
          feature: true,
        },
        orderBy: {
          feature: {
            name: "asc",
          },
        },
      });
    }),

  hasFeature: protectedProcedure
    .input(z.object({ feature: z.string() }))
    .query(async ({ ctx, input }) => {
      return !!(await ctx.db.userFeature.findFirst({
        where: {
          userId: ctx.auth.userId, // Updated
          feature: { name: input.feature },
        },
      }));
    }),

  // Add feature to user (admin only)
  addFeatureToUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        featureId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.userFeature.create({
          data: {
            userId: input.userId,
            featureId: input.featureId,
          },
          include: {
            feature: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User already has this feature",
          });
        }
        throw error;
      }
    }),

  // Remove feature from user (admin only)
  removeFeatureFromUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        featureId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userFeature = await ctx.db.userFeature.findFirst({
        where: {
          userId: input.userId,
          featureId: input.featureId,
        },
      });

      if (!userFeature) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User does not have this feature",
        });
      }

      return ctx.db.userFeature.delete({
        where: {
          id: userFeature.id,
        },
      });
    }),

  // Check if current user has admin access
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    const adminFeature = await ctx.db.userFeature.findFirst({
      where: {
        userId: ctx.auth.userId, // Updated
        feature: {
          name: "admin",
        },
      },
    });

    return !!adminFeature;
  }),
});
