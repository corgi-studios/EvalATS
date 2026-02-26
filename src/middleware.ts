import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/careers(.*)",
  "/api/public(.*)",
  "/api/debug-claims(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Define what is "admin ATS"
const isAdminRoute = createRouteMatcher([
  "/jobs(.*)",
  "/candidates(.*)",
  "/interviews(.*)",
  "/analytics(.*)",
  "/settings(.*)",
  "/compliance(.*)",
  "/", // if your homepage is admin dashboard; remove if not
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  // Require login (redirects to sign-in automatically)
  await auth.protect();

  // Read user + claims using auth()
  const { sessionClaims, userId } = await auth();

  if (isAdminRoute(req)) {
    // Try to get role from JWT claims first
    let role = (sessionClaims as any)?.role;

    // If role not in JWT claims, try to fetch from Clerk API
    // This is a fallback in case the JWT template hasn't propagated yet
    if (!role && userId) {
      try {
        const response = await fetch(
          `https://api.clerk.com/v1/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
          }
        );
        if (response.ok) {
          const user = await response.json();
          role = user.public_metadata?.role;
        }
      } catch (error) {
        console.error('Failed to fetch user role from Clerk:', error);
      }
    }

    if (role !== "admin" && role !== "recruiter") {
      return NextResponse.redirect(new URL("/careers", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
