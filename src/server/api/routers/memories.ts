import { z } from "zod";
import { MemoryClient } from "mem0ai";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";

// Type definitions for mem0 responses
interface Memory {
  id: string;
  memory?: string;
  text?: string;
  created_at?: string;
  updated_at?: string;
  categories?: string[];
  metadata?: Record<string, unknown>;
}

interface PaginatedMemoryResponse {
  memories?: Memory[];
  results?: Memory[];
}

export const memoriesRouter = createTRPCRouter({
  getUserMemories: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        page: z.number().min(1).default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.userId; // Updated

      if (!env.MEM0_API_KEY) {
        throw new Error("MEM0_API_KEY is not set");
      }

      const memoryClient = new MemoryClient({ apiKey: env.MEM0_API_KEY });

      try {
        const memories = (await memoryClient.getAll({
          user_id: userId,
          page: input.page,
          page_size: input.limit,
        })) as Memory[] | PaginatedMemoryResponse;

        // Handle both paginated response format and array format
        if (Array.isArray(memories)) {
          return {
            items: memories,
            nextCursor: undefined,
            hasMore: false,
          };
        }

        // If it's a paginated response
        const items = memories.memories ?? memories.results ?? [];
        const hasMore = items.length === input.limit;

        return {
          items: items.map((memory) => ({
            id: memory.id,
            memory: memory.memory ?? memory.text ?? "",
            created_at: memory.created_at,
            updated_at: memory.updated_at,
            categories: memory.categories ?? [],
            metadata: memory.metadata ?? {},
          })),
          hasMore,
          page: input.page,
        };
      } catch (error) {
        console.error("Error fetching memories:", error);
        return {
          items: [],
          hasMore: false,
          page: input.page,
        };
      }
    }),

  getMemoryCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId; // Updated

    if (!env.MEM0_API_KEY) {
      throw new Error("MEM0_API_KEY is not set");
    }

    const memoryClient = new MemoryClient({ apiKey: env.MEM0_API_KEY });

    try {
      const memories = (await memoryClient.getAll({
        user_id: userId,
      })) as Memory[] | PaginatedMemoryResponse;

      // Handle both response formats
      if (Array.isArray(memories)) {
        return memories.length;
      }

      const items = memories.memories ?? memories.results ?? [];
      return items.length;
    } catch (error) {
      console.error("Error counting memories:", error);
      return 0;
    }
  }),

  deleteMemory: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: memoryId }) => {
      if (!env.MEM0_API_KEY) {
        throw new Error("MEM0_API_KEY is not set");
      }

      const memoryClient = new MemoryClient({ apiKey: env.MEM0_API_KEY });

      try {
        await memoryClient.delete(memoryId);
        return { success: true };
      } catch (error) {
        console.error("Error deleting memory:", error);
        throw new Error("Failed to delete memory");
      }
    }),

  deleteAllUserMemories: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.auth.userId; // Updated

    if (!env.MEM0_API_KEY) {
      throw new Error("MEM0_API_KEY is not set");
    }

    const memoryClient = new MemoryClient({ apiKey: env.MEM0_API_KEY });

    try {
      await memoryClient.deleteAll({ user_id: userId });
      return { success: true };
    } catch (error) {
      console.error("Error deleting all memories:", error);
      throw new Error("Failed to delete all memories");
    }
  }),
});
