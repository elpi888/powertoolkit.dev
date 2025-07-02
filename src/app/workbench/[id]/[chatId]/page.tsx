import { notFound } from "next/navigation";

import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth
import { Chat } from "@/app/_components/chat";
import { api } from "@/trpc/server";

export default async function Page(props: {
  params: Promise<{ id: string; chatId: string }>;
}) {
  const params = await props.params;
  const { id, chatId } = params;

  const authData = await auth(); // Use Clerk's auth

  const [chat, workbench] = await Promise.all([
    api.chats.getChat(chatId),
    api.workbenches.getWorkbench(id),
  ]);

  if (!chat || !workbench) {
    notFound();
  }

  return (
    <Chat
      id={chat.id}
      initialVisibilityType={chat.visibility}
      isReadonly={authData.userId !== chat.userId} // Use Clerk's userId
      isNew={false}
      workbench={workbench}
    />
  );
}
