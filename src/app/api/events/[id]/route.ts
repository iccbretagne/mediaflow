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
import { UpdateEventSchema, IdParamSchema } from "@/lib/schemas"
import { deleteFiles } from "@/lib/s3"

type RouteParams = { params: Promise<{ id: string }> }

// GET /api/events/[id] - Get event details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = validateParams(await params, IdParamSchema)

    const event = await prisma.event.findUnique({
      where: { id, createdById: user.id },
      include: {
        photos: {
          select: { status: true },
        },
      },
    })

    if (!event) {
      throw new ApiError(404, "Event not found", "NOT_FOUND")
    }

    const approvedCount = event.photos.filter((p) => p.status === "APPROVED").length
    const rejectedCount = event.photos.filter((p) => p.status === "REJECTED").length
    const pendingCount = event.photos.filter((p) => p.status === "PENDING").length

    return successResponse({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      church: event.church,
      description: event.description,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      photoCount: event.photos.length,
      approvedCount,
      rejectedCount,
      pendingCount,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/events/[id] - Update event
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = validateParams(await params, IdParamSchema)
    const body = await validateBody(request, UpdateEventSchema)

    const existing = await prisma.event.findUnique({
      where: { id, createdById: user.id },
    })

    if (!existing) {
      throw new ApiError(404, "Event not found", "NOT_FOUND")
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.church && { church: body.church }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
      },
    })

    return successResponse({
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      church: event.church,
      description: event.description,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id } = validateParams(await params, IdParamSchema)

    const event = await prisma.event.findUnique({
      where: { id, createdById: user.id },
      include: { photos: true },
    })

    if (!event) {
      throw new ApiError(404, "Event not found", "NOT_FOUND")
    }

    // Delete photos from S3
    const s3Keys = event.photos.flatMap((p) => [p.originalKey, p.thumbnailKey])
    if (s3Keys.length > 0) {
      await deleteFiles(s3Keys)
    }

    // Delete event (cascades to photos and tokens)
    await prisma.event.delete({ where: { id } })

    return new Response(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
