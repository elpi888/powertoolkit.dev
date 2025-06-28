import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";
import type { InputJsonValue } from "@prisma/client/runtime/library";

export const chatsRouter = createTRPCRouter({
  getChats: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().nullish(),
        workbenchId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Updated
      const { limit, cursor, workbenchId } = input;

      const items = await ctx.db.chat.findMany({
        where: {
          userId,
          workbenchId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      const nextCursor =
        items.length > limit ? items[items.length - 1]?.id : undefined;
      const chats = items.slice(0, limit);

      return {
        items: chats,
        hasMore: items.length > limit,
        nextCursor,
      };
    }),

  getChat: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.chat.findUnique({
        where: {
          id: input,
          // Ensure user owns the chat or it's public
          OR: [{ userId: ctx.auth.userId }, { visibility: "public" }], // Updated
        },
        include: {
          workbench: true,
        },
      });
    }),

  createChat: protectedProcedure
    .input(
      z.object({
        id: z.string(), // ID is passed from client? Usually DB generates it. Assuming client generates UUID.
        title: z.string(),
        visibility: z.enum(["public", "private"]),
        // userId: z.string(), // userId should come from context
        workbenchId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.create({
        data: {
          id: input.id,
          title: input.title,
          visibility: input.visibility,
          userId: ctx.auth.userId, // Use authenticated user's ID
          workbenchId: input.workbenchId,
        },
      });
    }),

  updateChatVisibility: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        visibility: z.enum(["public", "private"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.update({
        where: {
          id: input.id,
          userId: ctx.auth.userId, // Updated
        },
        data: { visibility: input.visibility },
      });
    }),

  updateChatTitle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chat.update({
        where: {
          id: input.id,
          userId: ctx.auth.userId, // Updated
        },
        data: { title: input.title },
      });
    }),

  deleteChat: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // First, verify the chat belongs to the user or if other conditions allow deletion
      const chatToDelete = await ctx.db.chat.findUnique({
        where: { id: input },
      });

      if (!chatToDelete) {
        throw new Error("Chat not found.");
      }

      if (chatToDelete.userId !== ctx.auth.userId) {
        // Optionally, allow admins to delete, or based on other roles/permissions
        throw new Error("Access denied. You can only delete your own chats.");
      }

      return ctx.db.chat.delete({
        where: { id: input /* userId: ctx.auth.userId */ }, // userId check is done above
      });
    }),

  branchChat: protectedProcedure
    .input(
      z.object({
        originalChatId: z.string(),
        messageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { originalChatId, messageId } = input;
      const userId = ctx.auth.userId; // Updated

      // Get the original chat to verify ownership
      const originalChat = await ctx.db.chat.findUnique({
        where: { id: originalChatId, userId: userId }, // Ensured userId for ownership check
      });

      if (!originalChat) {
        throw new Error("Chat not found or access denied");
      }

      // Get all messages up to and including the specified message
      const messagesToCopy = await ctx.db.message.findMany({
        where: {
          chatId: originalChatId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Find the index of the target message
      const messageIndex = messagesToCopy.findIndex(
        (msg) => msg.id === messageId,
      );
      if (messageIndex === -1) {
        throw new Error("Message not found in chat");
      }

      // Keep only messages up to and including the target message
      const messagesToInclude = messagesToCopy.slice(0, messageIndex + 1);

      // Create the new branched chat
      const newChat = await ctx.db.chat.create({
        data: {
          title: originalChat.title,
          userId: userId,
          visibility: originalChat.visibility,
          parentChatId: originalChatId,
        },
      });

      // Copy the messages to the new chat
      await ctx.db.message.createMany({
        data: messagesToInclude.map((message) => ({
          chatId: newChat.id,
          role: message.role,
          parts: message.parts as InputJsonValue,
          attachments: message.attachments as InputJsonValue[],
          modelId: message.modelId,
        })),
      });

      return newChat;
    }),
});
