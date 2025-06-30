import { Chat } from "@/app/_components/chat";
import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth
import { generateUUID } from "@/lib/utils";
import LandingPage from "./_components/landing-page";

export default async function Page() {
  const authData = await auth(); // Use Clerk's auth

  if (!authData.userId) { // Check Clerk's userId
    return <LandingPage />;
  }

  const id = generateUUID();

  return (
    <Chat
      key={id}
      id={id}
      initialVisibilityType="private"
      isReadonly={false}
      isNew={true}
    />
  );
}
