import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const usersRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    // The protectedProcedure now adds 'dbUser' to the context after provisioning.
    // We can return this directly if the selected fields match.
    // Or, fetch using ctx.auth.userId if more specific select is needed or dbUser is not yet populated.
    if (ctx.dbUser) {
      return {
        id: ctx.dbUser.id,
        name: ctx.dbUser.name,
        email: ctx.dbUser.email,
        image: ctx.dbUser.image,
        emailVerified: ctx.dbUser.emailVerified, // This field's sync from Clerk needs consideration
      };
    }
    // Fallback if dbUser somehow isn't there, though protectedProcedure should ensure it.
    return ctx.db.user.findUnique({
      where: {
        id: ctx.auth.userId, // Updated
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
      },
    });
  }),

  updateUser: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // IMPORTANT: User profile data (email, name, image) should ideally be updated
      // via Clerk (e.g., <UserProfile /> or Clerk Backend API).
      // Changes would then sync to the local DB via webhooks.
      // Directly updating here can lead to inconsistencies with Clerk as the source of truth.
      // For now, just updating the ID reference.
      return ctx.db.user.update({
        where: {
          id: ctx.auth.userId, // Updated
        },
        data: input,
      });
    }),

  deleteUser: protectedProcedure.mutation(async ({ ctx }) => {
    // IMPORTANT: User deletion should be initiated via Clerk.
    // Clerk can then trigger deletion in this application via webhooks.
    // Deleting here only removes the local record and not the Clerk user.
    // For now, just updating the ID reference.
    return ctx.db.user.delete({
      where: {
        id: ctx.auth.userId, // Updated
      },
    });
  }),
});
