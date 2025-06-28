import { SignUp } from "@clerk/nextjs";
import { VStack } from "@/components/ui/stack";
import { Logo } from "@/components/ui/logo";

// Note: For this page to be the default sign-up page used by Clerk,
// you would set NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up" in your .env file.
// And ensure middleware allows access to /sign-up for unauthenticated users.

export default function SignUpPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <VStack className="w-full max-w-md gap-4 mb-8">
        <Logo className="size-16" />
        <VStack className="gap-1">
          <h1 className="text-primary text-2xl font-bold text-center">
            Create your Toolkit.dev Account
          </h1>
        </VStack>
      </VStack>
      <SignUp path="/sign-up" routing="path" signInUrl="/login" />
    </div>
  );
}
