import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
  validateBody,
  validateParams,
  successResponse,
  errorResponse,
  ApiError,
} from "@/lib/api-utils"
import { UpdateProjectSchema, Cuid2IdParamSchema } from "@/lib/schemas"
import { deleteFiles } from "@/lib/s3"

type RouteParams = { params: Promise<{ id: string }> }

// Helper to build ownership filter based on role
function getOwnershipFilter(userId: string, role: string) {
  return role === "ADMIN" ? {} : { createdById: userId }
}

// GET /api/projects/[id] - Get project details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth()
    const { id } = validateParams(await params, Cuid2IdParamSchema)

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        church: {
          select: { name: true },
        },
        media: {
          select: { type: true, status: true },
        },
      },
    })

    if (!project) {
      throw new ApiError(404, "Project not found", "NOT_FOUND")
    }

    const visualCount = project.media.filter((m) => m.type === "VISUAL").length
    const videoCount = project.media.filter((m) => m.type === "VIDEO").length
    const pendingCount = project.media.filter(
      (m) => m.status === "PENDING" || m.status === "DRAFT" || m.status === "IN_REVIEW"
    ).length
    const approvedCount = project.media.filter(
      (m) => m.status === "APPROVED" || m.status === "FINAL_APPROVED"
    ).length

    return successResponse({
      id: project.id,
      name: project.name,
      churchId: project.churchId,
      church: project.church.name,
      description: project.description,
      createdById: project.createdById,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      mediaCount: project.media.length,
      visualCount,
      videoCount,
      pendingCount,
      approvedCount,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = validateParams(await params, Cuid2IdParamSchema)
    const body = await validateBody(request, UpdateProjectSchema)

    const existing = await prisma.project.findUnique({
      where: { id, ...getOwnershipFilter(user.id, user.role) },
    })

    if (!existing) {
      throw new ApiError(404, "Project not found", "NOT_FOUND")
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.churchId && { churchId: body.churchId }),
        ...(body.description !== undefined && { description: body.description }),
      },
      include: {
        church: {
          select: { name: true },
        },
      },
    })

    return successResponse({
      id: project.id,
      name: project.name,
      churchId: project.churchId,
      church: project.church.name,
      description: project.description,
      createdById: project.createdById,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = validateParams(await params, Cuid2IdParamSchema)

    const project = await prisma.project.findUnique({
      where: { id, ...getOwnershipFilter(user.id, user.role) },
      include: {
        media: {
          include: {
            versions: true,
          },
        },
      },
    })

    if (!project) {
      throw new ApiError(404, "Project not found", "NOT_FOUND")
    }

    // Collect all S3 keys to delete
    const s3Keys: string[] = []
    for (const media of project.media) {
      for (const version of media.versions) {
        s3Keys.push(version.originalKey, version.thumbnailKey)
      }
    }

    if (s3Keys.length > 0) {
      await deleteFiles(s3Keys)
    }

    // Delete project (cascades to media, versions, comments, and tokens)
    await prisma.project.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
