import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define routes that should always be public (e.g., landing page, Clerk's own auth pages)
// Clerk's own pages like /sign-in, /sign-up are automatically handled and should not be explicitly listed here
// unless you are overriding them with custom pages that also need to be public.
const isPublicRoute = createRouteMatcher([
  '/', // Example: Landing page
  '/login', // Will be replaced by Clerk's hosted pages or custom pages
  '/api/public/(.*)', // Example: if you have any public API routes
]);

// Define routes that should be protected.
// All tRPC routes except for specific public ones should be protected.
const isTrpcProtectedRoute = createRouteMatcher([
  '/api/trpc/(.*)',
]);

// Define tRPC routes that might need to be public (e.g. for initial data, auth checks)
// This is an example; adjust based on your actual public tRPC procedures.
const isTrpcPublicRoute = createRouteMatcher([
  // No public tRPC routes defined yet. Add specific paths here if any tRPC procedures use `publicProcedure`.
  // e.g., '/api/trpc/post.listPublicPosts', '/api/trpc/health.check'
]);


export default clerkMiddleware((auth, req) => {
  // If it's a public route, do nothing.
  if (isPublicRoute(req)) {
    return;
  }

  // If it's a tRPC route that is NOT explicitly public, protect it.
  if (isTrpcProtectedRoute(req) && !isTrpcPublicRoute(req)) {
    auth().protect();
    return;
  }

  // For any other route not explicitly public, protect it.
  // This makes the application "protected by default".
  auth().protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
