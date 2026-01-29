import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"

extendZodWithOpenApi(z)

// ============================================
// CHURCH (ÉGLISE)
// ============================================

export const ChurchSchema = z
  .object({
    id: z.string().cuid2(),
    name: z.string().min(1).max(255),
    address: z.string().max(500).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("Church")

export const CreateChurchSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis").max(255),
    address: z.string().max(500).optional(),
  })
  .openapi("CreateChurch")

export const UpdateChurchSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    address: z.string().max(500).nullable().optional(),
  })
  .openapi("UpdateChurch")

export const ChurchResponseSchema = z
  .object({
    id: z.string().cuid2(),
    name: z.string(),
    address: z.string().nullable(),
    createdAt: z.string(), // ISO date string
    updatedAt: z.string(),
    _count: z
      .object({
        events: z.number(),
      })
      .optional(),
  })
  .openapi("ChurchResponse")

export type Church = z.infer<typeof ChurchSchema>
export type CreateChurch = z.infer<typeof CreateChurchSchema>
export type UpdateChurch = z.infer<typeof UpdateChurchSchema>
export type ChurchResponse = z.infer<typeof ChurchResponseSchema>
