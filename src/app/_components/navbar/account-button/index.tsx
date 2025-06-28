"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const AccountButton = () => {
  return (
    <>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
};
