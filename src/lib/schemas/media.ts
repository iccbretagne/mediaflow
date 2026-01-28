import { z } from "zod"

// ============================================
// ENUMS
// ============================================

export const MediaTypeEnum = z
  .enum(["PHOTO", "VISUAL", "VIDEO"])
  .openapi("MediaType")

export const MediaStatusEnum = z
  .enum([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "DRAFT",
    "IN_REVIEW",
    "REVISION_REQUESTED",
    "FINAL_APPROVED",
  ])
  .openapi("MediaStatus")

// ============================================
// MIME TYPES CONSTANTS
// ============================================

export const PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const

export const VISUAL_MIME_TYPES = [
  "image/png",
  "image/svg+xml",
  "application/pdf",
] as const

export const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const

export const ALL_MEDIA_MIME_TYPES = [
  ...PHOTO_MIME_TYPES,
  ...VISUAL_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
] as const

// ============================================
// MEDIA SCHEMAS
// ============================================

export const MediaSchema = z
  .object({
    id: z.string().cuid2(),
    type: MediaTypeEnum,
    status: MediaStatusEnum,
    filename: z.string(),
    mimeType: z.string(),
    size: z.number().int(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    duration: z.number().int().nullable(),
    eventId: z.string().cuid().nullable(),
    projectId: z.string().cuid().nullable(),
    scheduledDeletionAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Media")

export const MediaWithUrlsSchema = MediaSchema.extend({
  thumbnailUrl: z.string().url(),
  originalUrl: z.string().url().optional(),
}).openapi("MediaWithUrls")

export const CreateMediaSchema = z
  .object({
    type: MediaTypeEnum,
    eventId: z.string().cuid().optional(),
    projectId: z.string().cuid().optional(),
  })
  .refine((data) => Boolean(data.eventId) !== Boolean(data.projectId), {
    message: "Exactly one of eventId or projectId must be provided",
  })
  .openapi("CreateMediaRequest")

export const UpdateMediaStatusSchema = z
  .object({
    status: MediaStatusEnum,
    comment: z.string().min(1).max(5000).optional(),
  })
  .openapi("UpdateMediaStatusRequest")

// ============================================
// TYPES
// ============================================

export type MediaType = z.infer<typeof MediaTypeEnum>
export type MediaStatus = z.infer<typeof MediaStatusEnum>
export type Media = z.infer<typeof MediaSchema>
export type MediaWithUrls = z.infer<typeof MediaWithUrlsSchema>
export type CreateMedia = z.infer<typeof CreateMediaSchema>
export type UpdateMediaStatus = z.infer<typeof UpdateMediaStatusSchema>
