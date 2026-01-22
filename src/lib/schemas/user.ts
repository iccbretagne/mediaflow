import { z } from "zod"

// ============================================
// ENUMS
// ============================================

export const UserRoleSchema = z.enum(["ADMIN", "MEDIA"])
export const UserStatusSchema = z.enum(["PENDING", "ACTIVE", "REJECTED"])

export type UserRole = z.infer<typeof UserRoleSchema>
export type UserStatus = z.infer<typeof UserStatusSchema>

// ============================================
// REQUEST SCHEMAS
// ============================================

export const UpdateUserSchema = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
})

export const ListUsersQuerySchema = z.object({
  status: UserStatusSchema.optional(),
  role: UserRoleSchema.optional(),
})

// ============================================
// RESPONSE SCHEMAS
// ============================================

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerified: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  _count: z
    .object({
      events: z.number(),
    })
    .optional(),
})

export type UserResponse = z.infer<typeof UserResponseSchema>
