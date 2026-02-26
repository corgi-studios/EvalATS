import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/careers(.*)",
  "/api/public(.*)",
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
  const { sessionClaims } = await auth();

  if (isAdminRoute(req)) {
    const role = (sessionClaims?.publicMetadata as any)?.role;

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
