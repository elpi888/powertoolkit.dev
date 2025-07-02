"use client";

import React from "react";

import { Check, Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { api } from "@/trpc/react";
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections differently
import { env } from "@/env";
import { useMemo } from "react";

interface ConnectProps {
  provider: string;
}

export const ConnectButton: React.FC<ConnectProps> = ({ provider }) => {
  return (
    <Button
      onClick={() => {
        // Direct users to their Clerk User Profile to manage connected accounts.
        // The UserProfile component is mounted at '/user-profile', and the 'Account'
        // section (which includes connected accounts) is typically at '/user-profile/account'.
        window.open('/user-profile/account', '_blank');
      }}
    >
      Manage via Profile
    </Button>
  );
};

interface DisconnectProps {
  accountId: string;
}

export const DisconnectButton: React.FC<DisconnectProps> = ({ accountId }) => {
  const useClerkAccounts = useMemo(() => env.NEXT_PUBLIC_FEATURE_EXTERNAL_ACCOUNTS_ENABLED, []);
  const router = useRouter();
  const utils = api.useUtils();
  const {
    mutate: deleteAccount,
    isPending,
    isSuccess,
  } = api.accounts.deleteAccount.useMutation({
    onSuccess: async () => {
      await utils.accounts.getAccounts.invalidate();
      router.refresh();
      toast.success("Account disconnected");
    },
  });

  const handleDisconnect = () => {
    if (useClerkAccounts) {
      toast.info("Managing connected accounts is now done through your Clerk user profile.");
    } else {
      void deleteAccount(accountId);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDisconnect}
      // If Clerk is active, the button should appear disabled unless an old (non-Clerk) operation is somehow pending.
      // Effectively, if useClerkAccounts is true, this button does nothing destructive.
      disabled={isPending || useClerkAccounts}
    >
      Disconnect
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : isSuccess && !useClerkAccounts ? ( // Only show check if legacy op succeeded
        <Check />
      ) : null}
    </Button>
  );
};
