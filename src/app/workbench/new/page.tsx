import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth
import { redirect } from "next/navigation";
import { NewWorkbenchForm } from "./_components";

export default async function NewWorkbenchPage() {
  const authData = await auth(); // Use Clerk's auth

  if (!authData.userId) { // Check Clerk's userId
    redirect("/"); // Or Clerk's sign-in URL with redirect back
  }

  return <NewWorkbenchForm />;
}
