import { Composio } from "@composio/core";
import { env } from "@/env";

let composioClient: Composio | null = null;

export const getComposioClient = (): Composio => {
  if (!composioClient) {
    if (!env.COMPOSIO_API_KEY) {
      throw new Error(
        "COMPOSIO_API_KEY is not set in environment variables.",
      );
    }
    composioClient = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
    });
  }
  return composioClient;
};
