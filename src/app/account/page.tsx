import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth

import { redirect } from "next/navigation";

import { api } from "@/trpc/server";

import { AccountHeader } from "./components/header";
import { AccountTabs } from "./components/tabs";

const AccountPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) => {
  const { tab } = await searchParams;

  const authData = await auth(); // Use Clerk's auth

  if (!authData.userId) { // Check Clerk's userId
    redirect("/login?redirect=/account"); // Or Clerk's sign-in URL
  }

  const user = await api.users.getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/account");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-2 py-4 md:space-y-8">
      <AccountHeader user={user} />
      <AccountTabs defaultTab={tab} />
    </div>
  );
};

export default AccountPage;
