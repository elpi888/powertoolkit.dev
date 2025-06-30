import { createServerToolkit } from "@/toolkits/create-toolkit";
import { baseMem0ToolkitConfig } from "./base";
import { mem0AddMemoryToolConfigServer } from "./tools/add_memory/server";
import { mem0SearchMemoriesToolConfigServer } from "./tools/search_memories/server";
import { Mem0Tools } from "./tools/tools";
import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth

export const mem0ToolkitServer = createServerToolkit(
  baseMem0ToolkitConfig,
  `You have access to the Mem0 (Memory) toolkit for persistent information storage and retrieval. This toolkit provides:

- **Add Memory**: Store important information, facts, preferences, or context for future reference
- **Search Memories**: Retrieve previously stored information using semantic search

**Tool Sequencing Workflows:**
1. **Information Capture**: Use Add Memory to store important details, user preferences, or key facts from conversations
2. **Context Retrieval**: Use Search Memories to recall relevant information before providing answers or recommendations
3. **Continuous Learning**: Add Memory for new insights or corrections, then Search Memories to build upon previous knowledge

**Best Practices:**
- Store specific, actionable information rather than generic facts
- Include context and metadata when adding memories to improve searchability
- Use descriptive, searchable terms when storing information
- Search memories at the beginning of related conversations to provide personalized responses
- Store user preferences, important dates, ongoing projects, and frequently referenced information
- Update memories when information changes rather than storing duplicate or conflicting data

This toolkit enables persistent, personalized interactions by maintaining a knowledge base specific to each user.

You can also ask the user for more information if you don't have enough information after a search to answer a question.`,
  async () => {
    const authData = await auth(); // Use Clerk's auth

    if (!authData.userId) { // Check Clerk's userId
      // This toolkit requires a user ID. If not available, it cannot function.
      // Unlike other toolkits that might return null based on feature flag,
      // this one throws an error if no user ID, which is reasonable for a memory toolkit.
      throw new Error("User not authenticated, Mem0 toolkit cannot be initialized.");
    }

    return {
      [Mem0Tools.AddMemory]: mem0AddMemoryToolConfigServer(authData.userId),
      [Mem0Tools.SearchMemories]: mem0SearchMemoriesToolConfigServer(
        authData.userId,
      ),
    };
  },
);
