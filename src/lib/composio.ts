import { Composio } from "@composio/core";
import { env } from "@/env";

let composioClient: Composio | null = null;

/**
 * Returns a singleton instance of the Composio v3 client.
 * Initializes the client with the API key from environment variables
 * if it hasn't been initialized yet.
 *
 * @returns {Composio} The initialized Composio client instance.
 * @throws {Error} If the COMPOSIO_API_KEY is not set in the environment variables.
 */
export const getComposioClient = (): Composio => {
  if (!env.COMPOSIO_API_KEY) {
    throw new Error(
      "COMPOSIO_API_KEY is not set in environment variables. Please ensure it is configured.",
    );
  }

  if (!composioClient) {
    // According to new v3 docs, API key can be passed in constructor or SDK picks it from env.
    // Explicitly passing it for clarity.
    composioClient = new Composio({ apiKey: env.COMPOSIO_API_KEY });
  }
  return composioClient;
};
