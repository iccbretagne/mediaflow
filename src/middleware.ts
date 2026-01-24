import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { hasPermission, type Permission, type Role } from "@/lib/permissions"

// Routes that require specific permissions
const PROTECTED_ROUTES: { path: string; permission: Permission }[] = [
  { path: "/users", permission: "users:view" },
  { path: "/settings", permission: "settings:view" },
]

// Routes where only viewing is allowed for all, but mutations need admin
// (handled in API routes, not middleware)

export async function middleware(request: NextRequest) {
  const session = await auth()

  // Check protected routes
  for (const route of PROTECTED_ROUTES) {
    if (request.nextUrl.pathname.startsWith(route.path)) {
      if (!session?.user) {
        // Not authenticated, redirect to login
        return NextResponse.redirect(new URL("/", request.url))
      }

      if (session.user.status !== "ACTIVE") {
        // Not active, let the layout handle the display
        return NextResponse.next()
      }

      const role = session.user.role as Role
      if (!hasPermission(role, route.permission)) {
        // No permission, redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/users/:path*",
    "/settings/:path*",
  ],
}
