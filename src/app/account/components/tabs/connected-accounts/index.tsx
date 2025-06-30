// import { AuthProviderIcon } from "@/app/_components/navbar/account-button"; // Removed usage
import { Badge } from "@/components/ui/badge";
import { HStack } from "@/components/ui/stack";
// import { providers } from "@/server/auth/providers"; // Removed
import { api } from "@/trpc/server";
import { DisconnectButton } from "./connect-disconnect"; // ConnectButton removed
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

  // Legacy path (useClerkAccounts is false)
  const accountsData = await api.accounts.getAccounts({ limit: 100 });
  const legacyAccounts = accountsData?.items ?? [];

  if (legacyAccounts.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">No legacy accounts connected.</p>
        <p className="text-sm text-muted-foreground mt-2">
          You can manage new connections through your user profile.
        </p>
        <Link href="/user-profile#connected-accounts" target="_blank" rel="noopener noreferrer" className="mt-1">
          <Button variant="outline" size="sm">Manage Connections in Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground mb-2">
        The following are previously connected accounts. Please manage all connections via your user profile going forward.
      </p>
      {legacyAccounts.map((account) => (
        <HStack
          key={account.id}
          className="w-full justify-between rounded-md border px-4 py-2"
        >
          <HStack className="gap-4">
             {/* <AuthProviderIcon provider={account.provider} /> Usage Removed */}
            <HStack className="gap-2">
              {/* Capitalize first letter for display */}
              <h2 className="font-medium">{account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}</h2>
              <Badge variant="outline">Legacy Connection</Badge>
            </HStack>
          </HStack>
          <DisconnectButton accountId={account.id} />
        </HStack>
      ))}
       <Link href="/user-profile#connected-accounts" target="_blank" rel="noopener noreferrer" className="mt-2">
          <Button variant="outline" size="sm">Manage All Connections in Profile</Button>
        </Link>
    </div>
  );
};
