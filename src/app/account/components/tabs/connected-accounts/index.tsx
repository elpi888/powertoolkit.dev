import { AuthProviderIcon } from "@/app/_components/navbar/account-button/provider-icon";
import { Badge } from "@/components/ui/badge";
import { HStack } from "@/components/ui/stack";
import { providers } from "@/server/auth/providers";
import { api } from "@/trpc/server";
import { ConnectButton, DisconnectButton } from "./connect-disconnect";
import { env } from "@/env";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const ConnectedAccounts = async () => {
  const useClerkAccounts = env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED;

  if (useClerkAccounts) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground mb-2">
          Connected accounts are now managed through your Clerk user profile.
        </p>
        <Link href="/user-profile#connected-accounts" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">Manage Connections in Profile</Button>
        </Link>
      </div>
    );
  }

  const accounts = await api.accounts.getAccounts({
    limit: 100,
  });

  return (
    <div className="flex flex-col gap-2">
      {providers.map((provider) => {
        const account = accounts?.items.find(
          (account) => account.provider === provider.id,
        );

        return (
          <HStack
            key={provider.id}
            className="w-full justify-between rounded-md border px-4 py-2"
          >
            <HStack className="gap-4">
              <AuthProviderIcon provider={provider.name} />
              <HStack className="gap-2">
                <h2 className="font-medium">{provider.name}</h2>
                {account && <Badge variant="success">Connected</Badge>}
              </HStack>
            </HStack>
            {account ? (
              <DisconnectButton accountId={account.id} />
            ) : (
              <ConnectButton provider={provider.id} />
            )}
          </HStack>
        );
      })}
    </div>
  );
};
