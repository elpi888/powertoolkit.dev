import { redirect, notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server"; // Changed to Clerk's auth
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { headers } from "next/headers";
import { AdminPanel } from "./_components/admin-panel";

export default async function AdminPage() {
  // Check authentication
  const authData = await auth(); // Use Clerk's auth

  if (!authData.userId) { // Check Clerk's userId
    redirect("/login?redirect=/admin"); // Or Clerk's sign-in URL
  }

  // Create TRPC context and caller for server-side calls
  const ctx = await createTRPCContext({ headers: await headers() });
  const caller = createCaller(ctx);

  // Check if user has admin access
  try {
    const isAdmin = await caller.features.isAdmin();

    if (!isAdmin) {
      notFound();
    }
  } catch (error) {
    console.error(error);
    // If there's an error checking admin status, deny access
    notFound();
  }

  // If user is admin, render the admin panel
  return <AdminPanel />;
}
