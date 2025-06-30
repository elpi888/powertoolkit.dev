import { serverToolkits } from "@/toolkits/toolkits/server";
import type { Toolkits } from "@/toolkits/toolkits/shared";
import { createMcpHandler } from "@vercel/mcp-adapter";

// Create a wrapper function that can access Next.js route parameters
async function createHandlerWithParams(
  request: Request,
  { params }: { params: Promise<{ server: Toolkits }> },
) {
  const { server } = await params;

  const serverToolkit = serverToolkits[server];

  const handler = createMcpHandler(
    async (mcpServer) => {
      const tools = await serverToolkit.tools({
        model: "openai:gpt-image-1",
      });

      if (tools) { // Check if tools is not null
        Object.entries(tools).forEach(([toolName, tool]) => {
          const { description, inputSchema, callback, message } = tool;
          mcpServer.tool(
            toolName,
          description,
          inputSchema.shape,
          async (args) => {
            const result = await callback(args);
            return {
              content: [
                {
                  type: "text",
                  text: message
                    ? typeof message === "function"
                      ? message(result)
                      : message
                    : JSON.stringify(result, null, 2),
                },
              ],
              structuredContent: result,
            };
          },
        );
      });
      } else {
        // Optional: log that the toolkit was disabled or had no tools
        console.warn(`[MCP Handler] Toolkit '${server}' provided no tools or is disabled.`);
      }
    },
    {
      // Optional server options
    },
    {
      redisUrl: process.env.REDIS_URL,
      basePath: `/mcp/${server}`,
      sseEndpoint: "/sse",
      maxDuration: 120,
      verboseLogs: true,
    },
  );

  return await handler(request);
}

export { createHandlerWithParams as GET, createHandlerWithParams as POST };
