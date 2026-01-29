import { z } from "zod"
import { PaginationQuerySchema } from "./common"

// ============================================
// PROJECT SCHEMAS
// ============================================

export const CreateProjectSchema = z
  .object({
    name: z.string().min(1).max(255).openapi({ example: "Campagne Noël 2025" }),
    churchId: z.string().cuid2().openapi({ example: "cmky7c8c8a8hGF-m6sN8" }),
    description: z
      .string()
      .max(2000)
      .optional()
      .openapi({ example: "Visuels pour la campagne de Noël" }),
  })
  .openapi("CreateProjectRequest")

export const UpdateProjectSchema = CreateProjectSchema.partial().openapi(
  "UpdateProjectRequest"
)

export const ListProjectsQuerySchema = z
  .object({
    churchId: z.string().cuid2().optional(),
  })
  .merge(PaginationQuerySchema)
  .openapi("ListProjectsQuery")

export const ProjectSchema = z
  .object({
    id: z.string().cuid2(),
    name: z.string(),
    churchId: z.string().cuid2(),
    church: z.string(), // Nom de l'église (pour affichage)
    description: z.string().nullable(),
    createdById: z.string().cuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Project")

export const ProjectWithStatsSchema = ProjectSchema.extend({
  mediaCount: z.number().int(),
  visualCount: z.number().int(),
  videoCount: z.number().int(),
  pendingCount: z.number().int(),
  approvedCount: z.number().int(),
}).openapi("ProjectWithStats")

// ============================================
// TYPES
// ============================================

export type CreateProject = z.infer<typeof CreateProjectSchema>
export type UpdateProject = z.infer<typeof UpdateProjectSchema>
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>
export type Project = z.infer<typeof ProjectSchema>
export type ProjectWithStats = z.infer<typeof ProjectWithStatsSchema>
