import { z } from "zod"
import { PaginationQuerySchema } from "./common"

// ============================================
// ENUMS
// ============================================

export const EventStatusEnum = z
  .enum(["DRAFT", "PENDING_REVIEW", "REVIEWED", "ARCHIVED"])
  .openapi("EventStatus")

export const TokenTypeEnum = z.enum(["VALIDATOR", "MEDIA"]).openapi("TokenType")

// ============================================
// EVENT SCHEMAS
// ============================================

export const CreateEventSchema = z
  .object({
    name: z.string().min(1).max(255).openapi({ example: "Culte du 19 janvier" }),
    date: z.string().datetime().openapi({ example: "2025-01-19T10:00:00Z" }),
    churchId: z.string().cuid2().openapi({ example: "cmky7c8c8a8hGF-m6sN8" }),
    description: z
      .string()
      .max(1000)
      .optional()
      .openapi({ example: "Culte dominical" }),
  })
  .openapi("CreateEventRequest")

export const UpdateEventSchema = CreateEventSchema.partial()
  .extend({
    status: EventStatusEnum.optional(),
  })
  .openapi("UpdateEventRequest")

export const ListEventsQuerySchema = z
  .object({
    status: EventStatusEnum.optional(),
    churchId: z.string().cuid2().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .merge(PaginationQuerySchema)
  .openapi("ListEventsQuery")

export const EventSchema = z
  .object({
    id: z.string().cuid2(),
    name: z.string(),
    date: z.string().datetime(),
    churchId: z.string().cuid2(),
    church: z.string(), // Nom de l'église (pour affichage)
    description: z.string().nullable(),
    status: EventStatusEnum,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Event")

export const EventWithStatsSchema = EventSchema.extend({
  photoCount: z.number().int(),
  approvedCount: z.number().int(),
  rejectedCount: z.number().int(),
  pendingCount: z.number().int(),
}).openapi("EventWithStats")

// ============================================
// SHARE TOKEN SCHEMAS
// ============================================

export const CreateShareTokenSchema = z
  .object({
    type: TokenTypeEnum,
    label: z
      .string()
      .max(255)
      .optional()
      .openapi({ example: "Pasteur Martin" }),
    expiresInDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional()
      .openapi({ example: 7 }),
  })
  .openapi("CreateShareTokenRequest")

export const ShareTokenResponseSchema = z
  .object({
    id: z.string().cuid2(),
    token: z.string(),
    url: z.string().url(),
    type: TokenTypeEnum,
    label: z.string().nullable(),
    expiresAt: z.string().datetime().nullable(),
    lastUsedAt: z.string().datetime().nullable(),
    usageCount: z.number().int(),
    createdAt: z.string().datetime(),
  })
  .openapi("ShareTokenResponse")

// ============================================
// TYPES
// ============================================

export type EventStatus = z.infer<typeof EventStatusEnum>
export type TokenType = z.infer<typeof TokenTypeEnum>
export type CreateEvent = z.infer<typeof CreateEventSchema>
export type UpdateEvent = z.infer<typeof UpdateEventSchema>
export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>
export type Event = z.infer<typeof EventSchema>
export type EventWithStats = z.infer<typeof EventWithStatsSchema>
export type CreateShareToken = z.infer<typeof CreateShareTokenSchema>
export type ShareTokenResponse = z.infer<typeof ShareTokenResponseSchema>
