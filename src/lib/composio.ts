import { OpenAIToolSet } from "composio-core";
import { env } from "@/env";

let toolset: OpenAIToolSet | null = null;

/**
 * Returns a singleton instance of the Composio OpenAIToolSet.
 * Initializes the toolset with the API key from environment variables
 * if it hasn't been initialized yet.
 *
 * @returns {OpenAIToolSet} The initialized OpenAIToolSet instance.
 * @throws {Error} If the COMPOSIO_API_KEY is not set in the environment variables.
 */
export const getComposioToolset = (): OpenAIToolSet => {
  if (!env.COMPOSIO_API_KEY) {
    throw new Error(
      "COMPOSIO_API_KEY is not set in environment variables. Please ensure it is configured.",
    );
  }

  if (!toolset) {
    toolset = new OpenAIToolSet({ apiKey: env.COMPOSIO_API_KEY });
  }
  return toolset;
};

// Optional: A more generic client if needed for non-toolset specific actions,
// though OpenAIToolSet seems to provide access to .connectedAccounts etc.
// For now, OpenAIToolSet should suffice based on documentation snippets.
/*
import { Composio } from "composio-core";
let genericClient: Composio | null = null;

export const getComposioClient = (): Composio => {
  if (!env.COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY is not set.");
  }
  if (!genericClient) {
    genericClient = new Composio({ apiKey: env.COMPOSIO_API_KEY });
  }
  return genericClient;
};
*/
