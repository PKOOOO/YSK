import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/submit/(.*)",
  "/results/(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role
  const path = req.nextUrl.pathname

  if (role === "JUDGE" && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/judge", req.url))
  }

  if (role === "ADMIN" && path.startsWith("/judge")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
