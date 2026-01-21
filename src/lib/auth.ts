import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { ApiError } from "./api-utils"
import type { NextRequest } from "next/server"

// ============================================
// NEXTAUTH CONFIGURATION
// ============================================

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user id and role to session
      if (session.user) {
        session.user.id = user.id
        // Fetch user role
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        })
        session.user.role = dbUser?.role || "ADMIN"
      }
      return session
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  trustHost: true,
})

// ============================================
// AUTH HELPERS
// ============================================

export async function requireAuth(request?: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED")
  }

  return session.user
}

export async function requireAdmin(request?: NextRequest) {
  const user = await requireAuth(request)

  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Admin access required", "FORBIDDEN")
  }

  return user
}

// ============================================
// TYPE AUGMENTATION
// ============================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: "ADMIN" | "MEDIA"
    }
  }

  interface User {
    role?: "ADMIN" | "MEDIA"
  }
}
