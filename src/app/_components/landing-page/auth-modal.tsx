import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { AuthButtons } from "../auth/auth-buttons"; // Removed
// import { providers } from "@/server/auth/providers"; // Removed
import { Logo } from "@/components/ui/logo";
import { VStack } from "@/components/ui/stack";
import { SignInButton, SignUpButton } from "@clerk/nextjs"; // Added Clerk buttons

interface AuthModalProps {
  children: React.ReactNode;
}

export const AuthModal = ({ children }: AuthModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-6">
        <DialogHeader className="items-center gap-2">
          <Logo className="size-16" />
          <VStack>
            <DialogTitle className="text-primary text-xl">
              Sign in to Toolkit
            </DialogTitle>
            <DialogDescription className="hidden">
              Sign in to your account to get started with Toolkit.
            </DialogDescription>
          </VStack>
        </DialogHeader>
        <VStack className="gap-2">
          <SignInButton mode="modal">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full rounded-md px-4 py-2">Sign Up</button>
          </SignUpButton>
          {/* TODO: Add more specific Clerk sign-in options if needed, e.g., social providers */}
          {/* Or embed <SignIn /> component directly if more control over the form is needed */}
        </VStack>
      </DialogContent>
    </Dialog>
  );
};
