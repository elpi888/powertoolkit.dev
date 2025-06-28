/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server"; // Import Clerk's auth

import { db } from "@/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const authResult = await auth(); // Clerk's auth result
  // const user = await currentUser(); // Optionally get full user details if needed in context for all procedures

  return {
    db,
    auth: authResult, // Pass Clerk's auth object to the context
    // clerkUser: user,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.auth?.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    // User provisioning logic
    // ctx.auth.userId is the ID from Clerk (potentially externalId if JWT template is set)
    let userInDb = await ctx.db.user.findUnique({
      where: { id: ctx.auth.userId },
    });

    if (!userInDb) {
      // User does not exist in local DB, create them
      // Fetch full user details from Clerk to populate local DB
      const clerkUser = await currentUser(); // Fetches the full user object from Clerk

      if (!clerkUser) {
        // This should ideally not happen if ctx.auth.userId is present,
        // but as a safeguard or if clerkUser details are essential.
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not fetch user details from Clerk." });
      }

      // Determine name: use full name, or first + last, or email if name parts are empty
      let nameToStore = clerkUser.fullName;
      if (!nameToStore && clerkUser.firstName && clerkUser.lastName) {
        nameToStore = `${clerkUser.firstName} ${clerkUser.lastName}`;
      }
      // If no name parts are available, nameToStore will remain null (as User.name is String?)
      // This is preferable to deriving from email.
      // A better UX would be to prompt the user to complete their profile on first login.

      try {
        userInDb = await ctx.db.user.create({
          data: {
            id: ctx.auth.userId, // Use ctx.auth.userId (which is externalId or Clerk's ID via JWT template)
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: nameToStore,
            image: clerkUser.imageUrl,
            emailVerified: clerkUser.primaryEmailAddress?.verification?.status === "verified"
              ? new Date()
              : null,
            // Note: This sets emailVerified based on Clerk's status at creation time.
            // Webhooks (user.updated) should keep this in sync if status changes later.
          },
        });
      } catch (error: any) {
        // Improved error handling as suggested by Coderabbit
        console.error("Failed to create user in local DB:", error);
        // Check if it's a unique constraint violation (user might have been created by a concurrent request)
        if (error.code === 'P2002' || (error.meta?.target as string[])?.includes('email')) { // P2002 is Prisma's unique constraint failed code
          // Attempt to fetch the user again, as they might have been created by a concurrent request
          userInDb = await ctx.db.user.findUnique({
            where: { id: ctx.auth.userId },
          });
          if (!userInDb) {
            // If still not found after a P2002, something else is wrong.
             throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to provision user locally after unique constraint error." });
          }
          // If found, proceed with this userInDb
        } else {
          // For other errors, re-throw a generic error
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to provision user locally.",
            cause: error
          });
        }
      }
    }

    // Attach the Clerk auth object and potentially the local DB user to the context for procedures
    return next({
      ctx: {
        ...ctx,
        auth: ctx.auth, // Clerk auth object (includes userId, sessionId, orgId, etc.)
        dbUser: userInDb, // The user record from your local Prisma database
      },
    });
  });
