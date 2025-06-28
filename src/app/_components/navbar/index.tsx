import { Logo } from "@/components/ui/logo";

import { AccountButton } from "./account-button"; // This is now a client component
import { ColorModeToggle } from "./color-mode-toggle";
import { HStack } from "@/components/ui/stack";

// No longer needs to be async, AccountButton handles its own auth state
export const Navbar = () => {
  return (
    <HStack className="bg-background sticky top-0 z-10 justify-between p-2 md:hidden">
      <HStack>
        <Logo className="size-6" />
        <h1 className="overflow-hidden text-lg font-bold whitespace-nowrap">
          Toolkit.dev
        </h1>
      </HStack>
      <HStack>
        <AccountButton /> {/* Clerk's <SignedIn>/<SignedOut> inside will manage visibility */}
        <ColorModeToggle />
      </HStack>
    </HStack>
  );
};
