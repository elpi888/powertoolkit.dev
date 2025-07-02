import { notFound, redirect } from "next/navigation";

import { Chat } from "@/app/_components/chat";
import { api } from "@/trpc/server";

import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const authData = await auth(); // auth() from Clerk

  if (!authData.userId) { // Check for userId from Clerk's auth response
    // Use Clerk’s default sign-in route and param
    redirect(`/sign-in?redirectUrl=/${id}`);
    // Or import and use Clerk’s helper instead:
    // import { redirectToSignIn } from '@clerk/nextjs/server';
    // redirectToSignIn({ redirectUrl: `/${id}` });
  }

  const chat = await api.chats.getChat(id);

  if (!chat) {
    notFound();
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialVisibilityType={chat.visibility}
        isReadonly={authData.userId !== chat.userId} // Use authData.userId
        isNew={false}
      />
    </>
  );
}
