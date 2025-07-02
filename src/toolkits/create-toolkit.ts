import type { z, ZodObject, ZodRawShape } from "zod";
import { createClientTool, createServerTool } from "./create-tool";
import type {
  ClientTool,
  ClientToolConfig,
  ClientToolkit,
  ClientToolkitConifg,
  ServerTool,
  ServerToolConfig,
  ServerToolkit,
  ToolkitConfig,
} from "./types";

// Define ServerToolkitToolsExecutor if not already in types.ts
// This is speculative, type might be more complex or already exist
// export type ServerToolkitToolsExecutor<Parameters extends ZodRawShape, ToolNames extends string> = (
//   params: z.infer<ZodObject<Parameters>>,
//   userId: string,
// ) => Promise<Record<ToolNames, ServerTool> | null>;


export const createClientToolkit = <
  ToolNames extends string,
  Parameters extends ZodRawShape = ZodRawShape,
>(
  toolkitConfig: ToolkitConfig<ToolNames, Parameters>,
  clientToolkitConfig: ClientToolkitConifg<Parameters>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolConfigs: Record<ToolNames, ClientToolConfig<any, any>>,
): ClientToolkit<ToolNames, Parameters> => {
  return {
    ...toolkitConfig,
    ...clientToolkitConfig,
    tools: Object.keys(toolConfigs).reduce(
      (acc, toolName) => {
        const typedToolName = toolName as ToolNames;
        const baseToolConfig = toolkitConfig.tools[typedToolName];
        const toolConfig = toolConfigs[typedToolName];
        acc[typedToolName] = createClientTool(baseToolConfig, toolConfig);
        return acc;
      },
      {} as Record<ToolNames, ClientTool>,
    ),
  } as ClientToolkit<ToolNames, Parameters>;
};

export const createServerToolkit = <
  ToolNames extends string,
  Parameters extends ZodRawShape = ZodRawShape,
>(
  toolkitConfig: ToolkitConfig<ToolNames, Parameters>,
  systemPrompt: string,
  initializeToolsFn: ( // Renamed for clarity and to match my mental model
    params: z.infer<ZodObject<Parameters>>,
    userId: string, // Added userId
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<Record<ToolNames, ServerToolConfig<any, any>> | null>,
): ServerToolkit<ToolNames, Parameters> => {
  return {
    systemPrompt,
    tools: async (
      params: z.infer<ZodObject<Parameters>>,
      userId: string, // Added userId
    ) => {
      const initializedToolsMap = await initializeToolsFn(params, userId); // Pass userId
      if (!initializedToolsMap) {
        return null;
      }

      return Object.keys(initializedToolsMap).reduce(
        (acc, toolName) => {
          const typedToolName = toolName as ToolNames;
          const baseToolConfig = toolkitConfig.tools[typedToolName];
          const toolConfig = initializedToolsMap[typedToolName];
          acc[typedToolName] = createServerTool(baseToolConfig, toolConfig);
          return acc;
        },
        {} as Record<ToolNames, ServerTool>,
      );
    },
  };
};
