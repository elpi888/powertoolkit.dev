import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { VStack } from "@/components/ui/stack";
import { Button } from "@/components/ui/button"; // Import Button component
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
            <Button
              variant="default"
              className="w-full"
              aria-label="Sign in to your account"
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              variant="secondary"
              className="w-full"
              aria-label="Create a new account"
            >
              Sign Up
            </Button>
          </SignUpButton>
          {/* TODO: Add more specific Clerk sign-in options if needed, e.g., social providers */}
          {/* Or embed <SignIn /> component directly if more control over the form is needed */}
        </VStack>
      </DialogContent>
    </Dialog>
  );
};
