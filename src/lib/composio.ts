import { Composio } from "@composio/core";
// import { VercelProvider } from "@composio/vercel"; // Removed for standard API route usage
import { env } from "@/env";

let composioClient: Composio | null = null;

export const getComposioClient = (): Composio => {
  if (!composioClient) {
    if (!env.COMPOSIO_API_KEY) {
      throw new Error(
        "COMPOSIO_API_KEY is not set in environment variables. This is required for core Composio SDK operations.",
      );
    }
    composioClient = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
    });
  }
  return composioClient;
};
