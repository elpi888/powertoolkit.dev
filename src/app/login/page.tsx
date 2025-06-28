import { SignIn } from "@clerk/nextjs";
import { VStack } from "@/components/ui/stack";
import { Logo } from "@/components/ui/logo";

// Note: For this page to be the default sign-in page used by Clerk,
// you would set NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login" in your .env file.
// And ensure middleware allows access to /login for unauthenticated users.

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <VStack className="w-full max-w-md gap-4 mb-8">
        <Logo className="size-16" />
        <VStack className="gap-1">
          <h1 className="text-primary text-2xl font-bold text-center">
            Welcome to Toolkit.dev
          </h1>
          <p className="text-muted-foreground text-center text-sm">
            Sign in to continue
          </p>
        </VStack>
      </VStack>
      <SignIn path="/login" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}
