"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export const AccountButton = () => {
  return (
    <>
      <SignedIn>
        {/* UserButton already provides a dropdown, so we might not need the Authenticated component wrapper if we use UserButton directly */}
        {/* For now, let's assume we'll place UserButton here or in a simplified Authenticated component */}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
      <SignedOut>
        {/* This will render a sign-in button. Clerk's modal will show options. */}
        {/* We can customize this further if needed, e.g., by using <SignInButton mode="modal"> or custom triggers */}
        <SignInButton mode="modal">
          <Button variant="outline">
            <User className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </SignInButton>
        {/* Optionally, add a separate SignUpButton if desired */}
        {/* <SignUpButton mode="modal">
          <Button variant="default">Sign Up</Button>
        </SignUpButton> */}
      </SignedOut>
    </>
  );
};
