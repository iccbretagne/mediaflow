import { z } from "zod"

// ============================================
// MEDIA VERSION SCHEMAS
// ============================================

export const MediaVersionSchema = z
  .object({
    id: z.string().cuid(),
    versionNumber: z.number().int().min(1),
    mediaId: z.string().cuid2(),
    thumbnailUrl: z.string().url(),
    originalUrl: z.string().url().optional(),
    notes: z.string().nullable(),
    createdById: z.string().cuid(),
    createdByName: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi("MediaVersion")

export const CreateVersionSchema = z
  .object({
    notes: z
      .string()
      .max(2000)
      .optional()
      .openapi({ example: "Correction des couleurs" }),
  })
  .openapi("CreateVersionRequest")

export const MediaVersionListSchema = z
  .object({
    versions: z.array(MediaVersionSchema),
    currentVersion: z.number().int(),
  })
  .openapi("MediaVersionList")

// ============================================
// TYPES
// ============================================

export type MediaVersion = z.infer<typeof MediaVersionSchema>
export type CreateVersion = z.infer<typeof CreateVersionSchema>
export type MediaVersionList = z.infer<typeof MediaVersionListSchema>
