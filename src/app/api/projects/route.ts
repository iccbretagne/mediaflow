import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateBody,
  validateQuery,
  successResponse,
  paginatedResponse,
  errorResponse,
  getPaginationParams,
} from "@/lib/api-utils"
import { CreateProjectSchema, ListProjectsQuerySchema } from "@/lib/schemas"
import { createId } from "@paralleldrive/cuid2"

// GET /api/projects - List projects
export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const query = validateQuery(request, ListProjectsQuerySchema)

    const { skip, take } = getPaginationParams(query.page, query.limit)

    const where = {
      ...(query.churchId && { churchId: query.churchId }),
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          church: {
            select: { name: true },
          },
          _count: {
            select: { media: true },
          },
          media: {
            select: { type: true, status: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ])

    // Transform to include stats
    const projectsWithStats = projects.map((project) => {
      const visualCount = project.media.filter((m) => m.type === "VISUAL").length
      const videoCount = project.media.filter((m) => m.type === "VIDEO").length
      const pendingCount = project.media.filter(
        (m) => m.status === "PENDING" || m.status === "DRAFT" || m.status === "IN_REVIEW"
      ).length
      const approvedCount = project.media.filter(
        (m) => m.status === "APPROVED" || m.status === "FINAL_APPROVED"
      ).length

      return {
        id: project.id,
        name: project.name,
        churchId: project.churchId,
        church: project.church.name,
        description: project.description,
        createdById: project.createdById,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        mediaCount: project._count.media,
        visualCount,
        videoCount,
        pendingCount,
        approvedCount,
      }
    })

    return paginatedResponse(projectsWithStats, total, query.page, query.limit)
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await validateBody(request, CreateProjectSchema)

    const project = await prisma.project.create({
      data: {
        id: createId(),
        name: body.name,
        churchId: body.churchId,
        description: body.description,
        createdById: user.id,
      },
      include: {
        church: {
          select: { name: true },
        },
      },
    })

    return successResponse(
      {
        id: project.id,
        name: project.name,
        churchId: project.churchId,
        church: project.church.name,
        description: project.description,
        createdById: project.createdById,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
      201
    )
  } catch (error) {
    return errorResponse(error)
  }
}
