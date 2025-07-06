import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { env } from "@/env";

let composioClient: Composio | null = null;

export const getComposioClient = (): Composio => {
  if (!composioClient) {
    // Assuming VercelProvider might use COMPOSIO_API_KEY from env implicitly,
    // or that API key is not needed directly in constructor when provider is used.
    // The VercelProvider documentation example does not show apiKey in Composio constructor.
    // We still might need to ensure COMPOSIO_API_KEY is set for the provider to pick up.
    if (!env.COMPOSIO_API_KEY) {
      console.warn(
        "COMPOSIO_API_KEY is not set; VercelProvider might rely on it implicitly.",
      );
      // Not throwing an error here to see if provider handles it or gives a more specific error.
    }
    composioClient = new Composio({
      provider: new VercelProvider(),
    });
  }
  return composioClient;
};
