declare module 'composio' {
  export class Composio {
    constructor(config: { apiKey?: string });
    connected_accounts: {
      initiate(args: {
        userId: string;
        authConfigId: string;
        config: {
          type: "OAUTH2";
          redirectUrl: string;
        };
        }): Promise<{ id: string; redirectUrl?: string | null; [key: string]: unknown }>;
    };
    // Add other namespaces like 'toolkits', 'tools' if they are used directly.
  }
}
