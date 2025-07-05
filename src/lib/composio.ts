import { Composio } from "composio";
import { env } from "@/env";

let composioClient: Composio | null = null;

export function getComposioClient(): Composio {
  if (!composioClient) {
    if (!env.COMPOSIO_API_KEY) {
      throw new Error("COMPOSIO_API_KEY is not set in environment variables.");
    }
    composioClient = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
    });
  }
  return composioClient;
}
