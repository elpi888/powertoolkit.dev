"use client";

import React from "react";

import { Check, Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { api } from "@/trpc/react";
// import { signIn } from "next-auth/react"; // Removed: Clerk handles connections differently

interface ConnectProps {
  provider: string;
}

export const ConnectButton: React.FC<ConnectProps> = ({ provider }) => {
  return (
    <Button
      onClick={() => {
        // TODO: Refactor for Clerk or remove.
        // Clerk typically handles new connections via its UI (e.g., UserProfile component or sign-in flow).
        // This button's original NextAuth signIn logic is no longer applicable.
        toast.info(
          "Managing connected accounts is now done through your Clerk user profile.",
        );
      }}
    >
      Connect {/* This button may need to be re-purposed or removed */}
    </Button>
  );
};

interface DisconnectProps {
  accountId: string;
}

export const DisconnectButton: React.FC<DisconnectProps> = ({ accountId }) => {
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

  return (
    <Button
      variant="outline"
      onClick={() => {
        void deleteAccount(accountId);
      }}
      disabled={isPending}
    >
      Disconnect
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : isSuccess ? (
        <Check />
      ) : null}
    </Button>
  );
};
